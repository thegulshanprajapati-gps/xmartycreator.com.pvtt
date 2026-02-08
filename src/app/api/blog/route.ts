import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db-connection';
import Blog from '@/lib/models/blog';
import { calculateReadTime } from '@/lib/readTime';
import { slugify } from '@/lib/slugify';
import { checkRateLimit } from '@/lib/rate-limit';
import { cacheGet, cacheSet, cacheDel } from '@/lib/redis-cache';
import { toPlainObject } from '@/lib/mongoose-helpers';
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

function revalidateBlogPages(slug: string) {
  revalidateTag('blog-content');
  revalidateTag('blog-related');
  revalidatePath('/blog');
  revalidatePath(`/blog/${slug}`);
}

/**
 * GET /api/blog
 * 
 * Fetch blogs from MongoDB with proper field selection including coverImage
 * Default: published blogs only (for public frontend)
 * With status=all: all blogs (for admin console)
 */
export async function GET(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-client-ip') || 'unknown';
    const statusParam = request.nextUrl.searchParams.get('status') || 'published';
    const defaultLimit = statusParam === 'all' ? 200 : 100;
    const parsedLimit = parseInt(request.nextUrl.searchParams.get('limit') || `${defaultLimit}`, 10);
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 1000) : defaultLimit;
    const includeContent = request.nextUrl.searchParams.get('includeContent') === 'true';
    const fresh = request.nextUrl.searchParams.get('fresh') === 'true';
    const shouldBypassCache = statusParam === 'all' || fresh;

    const rateLimitKey = `api:blog:${clientIP}`;
    const rateLimit = await checkRateLimit(rateLimitKey);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    await connectDB();

    const query: any = {};
    if (statusParam !== 'all') {
      query.status = 'published';
    }

    const cacheKey = `blogs:list:${statusParam}:content-${includeContent ? "on" : "off"}:limit-${limit}`;

    if (!shouldBypassCache) {
      const cached = await cacheGet<any[]>(cacheKey);
      if (Array.isArray(cached)) {
        return NextResponse.json(cached);
      }
    }

    const selectFields = includeContent
      ? '_id title slug excerpt author readTime status publishedAt updatedAt tags views likes coverImage +htmlContent +content'
      : '_id title slug excerpt author readTime status publishedAt updatedAt tags views likes coverImage authorImage';

    const sortConfig = statusParam === 'all'
      ? { updatedAt: -1 }
      : { publishedAt: -1 };

    const blogs = await Blog.find(query)
      .select(selectFields)
      .sort(sortConfig)
      .limit(limit)
      .maxTimeMS(5000)
      .lean()
      .exec();

    const response = Array.isArray(blogs) ? blogs : [];

    if (!shouldBypassCache) {
      await cacheSet(cacheKey, response, { ttl: 'hot' });
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Blog GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blogs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/blog
 * 
 * Pattern: new Blog() -> .save() -> toPlainObject() -> Return JSON
 * Why: Using constructor ensures document instance
 *      .save() works (not on plain objects)
 *      toPlainObject() safely serializes for response
 */
export async function POST(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-client-ip') || 'unknown';
    
    // Rate limiting - stricter for POST
    const rateLimitKey = `api:blog:post:${clientIP}`;
    const rateLimit = await checkRateLimit(rateLimitKey);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await request.json();
    
    const htmlContent = body.htmlContent || body.contentHTML || '';
    const rawContent = body.content || body.contentJSON || {};
    const content = validateAndFixContent(rawContent);
    
    const { title, slug: providedSlug, excerpt, author, authorImage, coverImage, tags, metaTitle, metaDescription, metaKeywords, status } = body;
    const normalizedExcerpt = buildExcerpt(excerpt, htmlContent);

    const missingFields: string[] = [];
    if (!title) missingFields.push('title');
    if (!htmlContent) missingFields.push('htmlContent');
    if (!author) missingFields.push('author');
    if (!normalizedExcerpt) missingFields.push('excerpt');

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` }, 
        { status: 400 }
      );
    }

    await connectDB();
    
    // Use provided slug or generate from title
    const slug = providedSlug && providedSlug.trim() 
      ? providedSlug.toLowerCase().trim() 
      : slugify(title);
    
    const existing = await Blog.findOne({ slug }).maxTimeMS(3000);
    if (existing) {
      return NextResponse.json(
        { error: 'A blog with this slug already exists' }, 
        { status: 400 }
      );
    }

    const readTime = calculateReadTime(htmlContent);

    // Handle coverImage - convert string URL to object format
    let coverImageData = {};
    if (typeof coverImage === 'string' && coverImage) {
      coverImageData = { url: coverImage, alt: title };
    } else if (coverImage && typeof coverImage === 'object') {
      coverImageData = coverImage;
    }

    // ✅ NEW INSTANCE: ensures we have a Mongoose document
    const blog = new Blog({
      title,
      slug,
      content,
      htmlContent,
      excerpt: normalizedExcerpt,
      author,
      authorImage: authorImage || '',
      coverImage: coverImageData,
      tags: tags || [],
      readTime,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || normalizedExcerpt,
      metaKeywords: metaKeywords || [],
      status: status || 'draft',
    });

    // ✅ .save() works on new documents
    await blog.save();
    
    // Invalidate caches for list endpoints (published/draft/all, content on/off)
    const statusToInvalidate = status || 'draft';
    const cacheKeys = [
      `blogs:list:${statusToInvalidate}:content-off`,
      `blogs:list:${statusToInvalidate}:content-on`,
      `blogs:list:published:content-off`,
      `blogs:list:published:content-on`,
      `blogs:list:all:content-off`,
      `blogs:list:all:content-on`,
      `blogs:list:${statusToInvalidate}:content-off:limit-100`,
      `blogs:list:${statusToInvalidate}:content-on:limit-100`,
      `blogs:list:${statusToInvalidate}:content-off:limit-200`,
      `blogs:list:${statusToInvalidate}:content-on:limit-200`,
      'blogs:list:published:content-off:limit-100',
      'blogs:list:published:content-on:limit-100',
      'blogs:list:published:content-off:limit-200',
      'blogs:list:published:content-on:limit-200',
      'blogs:list:all:content-off:limit-100',
      'blogs:list:all:content-on:limit-100',
      'blogs:list:all:content-off:limit-200',
      'blogs:list:all:content-on:limit-200',
      `blog:${slug}`,
    ];
    await cacheDel(cacheKeys);
    revalidateBlogPages(slug);
    
    // SAFE CONVERSION: toPlainObject handles the Mongoose document
    const savedBlog = toPlainObject<any>(blog);
    return NextResponse.json({
      slug: savedBlog.slug,
      ...savedBlog,
      content: validateAndFixContent(savedBlog.content),
      contentJSON: validateAndFixContent(savedBlog.content),
    }, { status: 201 });
  } catch (error) {
    console.error('Blog POST error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create blog', details: msg }, 
      { status: 500 }
    );
  }
}
