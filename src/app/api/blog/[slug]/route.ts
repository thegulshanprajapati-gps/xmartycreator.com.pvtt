import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db-connection';
import Blog from '@/lib/models/blog';
import { calculateReadTime } from '@/lib/readTime';
import { slugify } from '@/lib/slugify';
import { checkRateLimit } from '@/lib/rate-limit';
import { cacheGet, cacheSet } from '@/lib/redis-cache';

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

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const clientIP = request.headers.get('x-client-ip') || 'unknown';
    
    // Rate limiting
    const rateLimitKey = `api:blog:${clientIP}`;
    const rateLimit = await checkRateLimit(rateLimitKey);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Cache check
    const cacheKey = `blog:${params.slug}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    await connectDB();
    const blog = await Blog.findOne({ slug: params.slug })
      .maxTimeMS(3000)
      .lean();

    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    // Cache for 1 hour
    const blogtData = {
      ...blog,
      content: validateAndFixContent(blog.content),
      contentJSON: validateAndFixContent(blog.content),
    };
    
    await cacheSet(cacheKey, blogtData, { ttl: 'cold' });
    
    return NextResponse.json(blogtData);
  } catch (error) {
    console.error('Blog GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch blog' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const clientIP = request.headers.get('x-client-ip') || 'unknown';
    
    // Rate limiting - stricter for PUT
    const rateLimitKey = `api:blog:put:${clientIP}`;
    const rateLimit = await checkRateLimit(rateLimitKey);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await request.json();
    const { title, content, contentJSON, htmlContent, contentHTML, excerpt, author, authorImage, coverImage, tags, metaTitle, metaDescription, metaKeywords, status } = body;

    const finalContent = validateAndFixContent(content || contentJSON || {});
    const finalHtmlContent = htmlContent || contentHTML;

    if (!title || !finalHtmlContent || !author || !excerpt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();
    const blog = await Blog.findOne({ slug: params.slug }).maxTimeMS(3000);
    
    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    const newSlug = slugify(title);
    if (newSlug !== params.slug) {
      const existing = await Blog.findOne({ slug: newSlug }).maxTimeMS(3000);
      if (existing) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
      }
    }

    const readTime = calculateReadTime(finalHtmlContent);

    blog.title = title;
    blog.slug = newSlug;
    blog.content = finalContent;
    blog.htmlContent = finalHtmlContent;
    blog.excerpt = excerpt;
    blog.author = author;
    blog.authorImage = authorImage || '';
    blog.coverImage = coverImage || {};
    blog.tags = tags || [];
    blog.readTime = readTime;
    blog.metaTitle = metaTitle || title;
    blog.metaDescription = metaDescription || excerpt;
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

    await blog.save();
    
    // Invalidate cache
    await cacheSet(`blog:${params.slug}`, null, { ttl: 1 });
    
    const savedBlog = blog.toObject();
    return NextResponse.json({
      ...savedBlog,
      content: validateAndFixContent(savedBlog.content),
      contentJSON: validateAndFixContent(savedBlog.content),
    });
  } catch (error) {
    console.error('Blog PUT error:', error);
    return NextResponse.json({ error: 'Failed to update blog' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const clientIP = request.headers.get('x-client-ip') || 'unknown';
    
    // Rate limiting - strict for DELETE
    const rateLimitKey = `api:blog:delete:${clientIP}`;
    const rateLimit = await checkRateLimit(rateLimitKey);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    await connectDB();
    const blog = await Blog.findOneAndDelete({ slug: params.slug }).maxTimeMS(3000);
    
    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    // Invalidate cache
    await cacheSet(`blog:${params.slug}`, null, { ttl: 1 });

    return NextResponse.json({ message: 'Blog deleted' });
  } catch (error) {
    console.error('Blog DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete blog' }, { status: 500 });
  }
}


