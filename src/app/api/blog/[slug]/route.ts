import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db-connection';
import Blog from '@/lib/models/blog';
import { calculateReadTime } from '@/lib/readTime';
import { slugify } from '@/lib/slugify';
import { checkRateLimit } from '@/lib/rate-limit';
import { cacheGet, cacheSet, cacheDel } from '@/lib/redis-cache';
import { toPlainObject, serializeDocument } from '@/lib/mongoose-helpers';
import { revalidatePath, revalidateTag } from 'next/cache';

// Ensure content has valid TipTap structure
function validateAndFixContent(content: any) {
  if (!content || typeof content !== 'object') {
    return { type: 'doc', content: [] };
  }
  if (content.type === 'doc' && Array.isArray(content.content)) {
    return content;
  }
  // If it's empty or malformed, return default
  return { type: 'doc', content: [] };
}

function buildExcerpt(inputExcerpt: any, htmlContent: string) {
  const explicit = typeof inputExcerpt === 'string' ? inputExcerpt.trim() : '';
  if (explicit) return explicit;

  const plainText = htmlContent
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!plainText) return '';
  return plainText.length > 220 ? `${plainText.slice(0, 217)}...` : plainText;
}

const MAX_HTML_CONTENT_CHARS = 2_500_000;
const MAX_INLINE_COVER_IMAGE_CHARS = 1_250_000;

function revalidateBlogPages(slugs: string[]) {
  revalidateTag('blog-content');
  revalidateTag('blog-related');
  revalidatePath('/blog');
  slugs
    .filter(Boolean)
    .forEach((currentSlug) => revalidatePath(`/blog/${currentSlug}`));
}

/**
 * GET /api/blog/[slug]
 * 
 * ✅ NEXT.JS 15 FIX: Params must be awaited 
 * Pattern: Query -> exec() -> toPlainObject() -> Return JSON
 * Why: exec() ensures you get a Mongoose document, not plain object
 *      toPlainObject() safely converts to plain JS object for serialization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // ✅ CRITICAL: Await params in Next.js 15 App Router
    const { slug: rawSlug } = await params;
    const clientIP = request.headers.get('x-client-ip') || 'unknown';
    
    // Properly decode and normalize the slug
    let slug = rawSlug?.toString() || '';
    try {
      slug = decodeURIComponent(slug);
    } catch (e) {
      // If decode fails, use the slug as-is
    }
    slug = slug.toLowerCase().trim();

    if (!slug) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
    }
    
    // Rate limiting
    const rateLimitKey = `api:blog:${clientIP}`;
    const rateLimit = await checkRateLimit(rateLimitKey);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }
    
    // Cache check
    const cacheKey = `blog:${slug}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    await connectDB();
    
    // Pattern: .exec() returns Mongoose document, NOT plain object
    // This allows .toObject() to work without errors
    const blog = await Blog.findOne({ slug })
      .select('+content +htmlContent')
      .maxTimeMS(3000)
      .exec();

    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    // SAFE CONVERSION: toPlainObject handles both Mongoose docs and plain objects
    const blogData = toPlainObject<any>(blog);
    const blogDataWithContent = {
      ...blogData,
      content: validateAndFixContent(blogData.content),
      contentJSON: validateAndFixContent(blogData.content),
    };
    
    await cacheSet(cacheKey, blogDataWithContent, { ttl: 'cold' });
    
    return NextResponse.json(blogDataWithContent);
  } catch (error) {
    console.error('Blog GET error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message.includes('MONGODB_URI') || message.includes('MONGO_URI') ? 503 : 500;
    return NextResponse.json(
      { 
        error: 'Failed to fetch blog', 
        details: message 
      }, 
      { status }
    );
  }
}

/**
 * PUT /api/blog/[slug]
 * 
 * Pattern: findOne() -> exec() -> modify -> save() -> toPlainObject() -> Return JSON
 * Why: .exec() returns a Mongoose document (not plain object)
 *      .save() works on documents (NOT on plain objects from findOneAndUpdate)
 *      toPlainObject() safely serializes before JSON response
 * 
 * WRONG: findOneAndUpdate() -> .save()
 * RIGHT: findOne() -> exec() -> modify -> .save()
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // ✅ CRITICAL: Await params in Next.js 15 App Router
    const { slug: rawSlug } = await params;
    const clientIP = request.headers.get('x-client-ip') || 'unknown';
    
    // Properly decode and normalize the slug
    let slug = rawSlug?.toString() || '';
    try {
      slug = decodeURIComponent(slug);
    } catch (e) {
      // If decode fails, use the slug as-is
    }
    slug = slug.toLowerCase().trim();

    if (!slug) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
    }
    
    // Rate limiting - stricter for PUT
    const rateLimitKey = `api:blog:put:${clientIP}`;
    const rateLimit = await checkRateLimit(rateLimitKey);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await request.json();
    const { 
      title, 
      slug: providedSlug, 
      content, 
      contentJSON, 
      htmlContent, 
      contentHTML, 
      excerpt, 
      author, 
      authorImage, 
      coverImage, 
      tags, 
      metaTitle, 
      metaDescription, 
      metaKeywords, 
      status 
    } = body;

    const finalContent = validateAndFixContent(content || contentJSON || {});
    const finalHtmlContent = htmlContent || contentHTML;

    if (typeof finalHtmlContent === 'string' && finalHtmlContent.length > MAX_HTML_CONTENT_CHARS) {
      return NextResponse.json(
        { error: 'Content is too large. Please reduce article size.' },
        { status: 413 }
      );
    }

    if (
      typeof coverImage === 'string'
      && coverImage.startsWith('data:image/')
      && coverImage.length > MAX_INLINE_COVER_IMAGE_CHARS
    ) {
      return NextResponse.json(
        { error: 'Cover image is too large for inline upload. Use an image URL or smaller image.' },
        { status: 413 }
      );
    }

    const normalizedExcerpt = buildExcerpt(excerpt, finalHtmlContent);

    if (!title || !finalHtmlContent || !author || !normalizedExcerpt) {
      const missing = [];
      if (!title) missing.push('title');
      if (!finalHtmlContent) missing.push('htmlContent');
      if (!author) missing.push('author');
      if (!normalizedExcerpt) missing.push('excerpt');
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` }, 
        { status: 400 }
      );
    }

    await connectDB();
    
    // PATTERN: findOne() + exec() -> ensures we get a Mongoose document
    // This is REQUIRED for .save() to work
    let blog;
    try {
      blog = await Blog.findOne({ slug })
        .select('+content +htmlContent')
        .maxTimeMS(3000)
        .lean(false) // ✅ Explicitly disable lean to get Mongoose document
        .exec(); // ✅ exec() returns a Mongoose document
    } catch (queryError) {
      console.error('Blog query error:', queryError);
      throw queryError;
    }
    
    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }
    
    // Verify blog has save method
    if (typeof blog.save !== 'function') {
      console.error('Blog document does not have save method. Type:', typeof blog, 'Keys:', Object.keys(blog || {}));
      return NextResponse.json({ error: 'Invalid blog document' }, { status: 500 });
    }

    // Use provided slug if different, otherwise generate from title
    const newSlug = (providedSlug && providedSlug.trim()) 
      ? providedSlug.toLowerCase().trim() 
      : slugify(title);
      
    if (newSlug !== slug) {
      const existing = await Blog.findOne({ slug: newSlug })
        .maxTimeMS(3000)
        .lean() // ✅ Use lean for read-only check
        .exec();
      if (existing) {
        return NextResponse.json(
          { error: 'New slug already exists' }, 
          { status: 400 }
        );
      }
    }

    const readTime = calculateReadTime(finalHtmlContent);

    // Handle coverImage - convert string URL to object format
    let coverImageData = {};
    if (typeof coverImage === 'string' && coverImage) {
      coverImageData = { url: coverImage, alt: title };
    } else if (coverImage && typeof coverImage === 'object') {
      coverImageData = coverImage;
    }

    // Modify the document
    blog.title = title;
    blog.slug = newSlug;
    blog.content = finalContent;
    blog.htmlContent = finalHtmlContent;
    blog.excerpt = normalizedExcerpt;
    blog.author = author;
    blog.authorImage = authorImage || '';
    blog.coverImage = coverImageData;
    blog.tags = tags || [];
    blog.readTime = readTime;
    blog.metaTitle = metaTitle || title;
    blog.metaDescription = metaDescription || normalizedExcerpt;
    blog.metaKeywords = metaKeywords || [];
    blog.status = status || 'draft';
    blog.updatedAt = new Date();
    
    // Set publishedAt when first publishing
    if (status === 'published' && !blog.publishedAt) {
      blog.publishedAt = new Date();
    }
    
    // Clear publishedAt when unpublishing
    if (status === 'draft' && body.publishedAt === null) {
      blog.publishedAt = null;
    }

    // ✅ .save() works only on Mongoose documents (which we got from .exec())
    // ❌ .save() would fail on plain objects from findOneAndUpdate
    await blog.save();
    
    // Invalidate cache for both old and new slug
    await cacheDel([
      `blog:${slug}`,
      `blog:${newSlug}`,
      `blogs:list:${blog.status}:content-off`,
      `blogs:list:${blog.status}:content-on`,
      `blogs:list:published:content-off`,
      `blogs:list:published:content-on`,
      `blogs:list:all:content-off`,
      `blogs:list:all:content-on`,
      `blogs:list:${blog.status}:content-off:limit-100`,
      `blogs:list:${blog.status}:content-on:limit-100`,
      `blogs:list:${blog.status}:content-off:limit-200`,
      `blogs:list:${blog.status}:content-on:limit-200`,
      'blogs:list:published:content-off:limit-100',
      'blogs:list:published:content-on:limit-100',
      'blogs:list:published:content-off:limit-200',
      'blogs:list:published:content-on:limit-200',
      'blogs:list:all:content-off:limit-100',
      'blogs:list:all:content-on:limit-100',
      'blogs:list:all:content-off:limit-200',
      'blogs:list:all:content-on:limit-200',
    ]);

    revalidateBlogPages([slug, newSlug]);
    
    // SAFE CONVERSION: toPlainObject handles both Mongoose docs and plain objects
    const savedBlog = toPlainObject<any>(blog);
    return NextResponse.json({
      ...savedBlog,
      content: validateAndFixContent(savedBlog.content),
      contentJSON: validateAndFixContent(savedBlog.content),
    });
  } catch (error) {
    console.error('Blog PUT error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update blog', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // ✅ CRITICAL: Await params in Next.js 15 App Router
    const { slug: rawSlug } = await params;
    const clientIP = request.headers.get('x-client-ip') || 'unknown';
    // Properly decode and normalize the slug
    let slug = rawSlug?.toString() || '';
    try {
      slug = decodeURIComponent(slug);
    } catch (e) {
      // If decode fails, use the slug as-is
    }
    slug = slug.toLowerCase().trim();

    if (!slug) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
    }
    
    // Rate limiting - strict for DELETE
    const rateLimitKey = `api:blog:delete:${clientIP}`;
    const rateLimit = await checkRateLimit(rateLimitKey);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    await connectDB();
    const blog = await Blog.findOneAndDelete({ slug }).maxTimeMS(3000);
    
    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    // Invalidate cache
    await cacheDel([
      `blog:${slug}`,
      `blogs:list:published:content-off`,
      `blogs:list:published:content-on`,
      `blogs:list:all:content-off`,
      `blogs:list:all:content-on`,
      `blogs:list:draft:content-off`,
      `blogs:list:draft:content-on`,
      'blogs:list:published:content-off:limit-100',
      'blogs:list:published:content-on:limit-100',
      'blogs:list:published:content-off:limit-200',
      'blogs:list:published:content-on:limit-200',
      'blogs:list:all:content-off:limit-100',
      'blogs:list:all:content-on:limit-100',
      'blogs:list:all:content-off:limit-200',
      'blogs:list:all:content-on:limit-200',
      'blogs:list:draft:content-off:limit-100',
      'blogs:list:draft:content-on:limit-100',
      'blogs:list:draft:content-off:limit-200',
      'blogs:list:draft:content-on:limit-200',
    ]);

    revalidateBlogPages([slug]);

    return NextResponse.json({ message: 'Blog deleted', slug });
  } catch (error) {
    console.error('Blog DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete blog', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
