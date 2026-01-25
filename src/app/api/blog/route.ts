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

export async function GET(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-client-ip') || 'unknown';
    const status = request.nextUrl.searchParams.get('status') || 'published';
    
    // Rate limiting
    const rateLimitKey = `api:blog:${clientIP}`;
    const rateLimit = await checkRateLimit(rateLimitKey);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Cache check
    const cacheKey = `blogs:${status}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // DB query
    await connectDB();
    const query: any = {};
    if (status) query.status = status;

    const blogs = await Blog.find(query)
      .select('title slug excerpt author readTime status publishedAt updatedAt tags views likes') // Projection
      .sort({ createdAt: -1 })
      .limit(100)
      .maxTimeMS(5000) // 5 second timeout
      .lean();
    
    const fixedBlogs = blogs.map(blog => ({
      ...blog,
      content: validateAndFixContent(blog.content),
      contentJSON: validateAndFixContent(blog.content),
    }));
    
    // Cache for 30 minutes
    await cacheSet(cacheKey, fixedBlogs, { ttl: 'warm' });
    
    return NextResponse.json(fixedBlogs);
  } catch (error) {
    console.error('Blog GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch blogs' }, { status: 500 });
  }
}

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
    
    const { title, excerpt, author, authorImage, coverImage, tags, metaTitle, metaDescription, metaKeywords, status } = body;

    const missingFields: string[] = [];
    if (!title) missingFields.push('title');
    if (!htmlContent) missingFields.push('htmlContent');
    if (!author) missingFields.push('author');
    if (!excerpt) missingFields.push('excerpt');

    if (missingFields.length > 0) {
      return NextResponse.json({ error: `Missing: ${missingFields.join(', ')}` }, { status: 400 });
    }

    await connectDB();
    const slug = slugify(title);
    
    const existing = await Blog.findOne({ slug }).maxTimeMS(3000);
    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    const readTime = calculateReadTime(htmlContent);

    const blog = new Blog({
      title,
      slug,
      content,
      htmlContent,
      excerpt,
      author,
      authorImage: authorImage || '',
      coverImage: coverImage || {},
      tags: tags || [],
      readTime,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || excerpt,
      metaKeywords: metaKeywords || [],
      status: status || 'draft',
    });

    await blog.save();
    
    // Invalidate cache for this status
    const statusToInvalidate = status || 'draft';
    await cacheSet(`blogs:${statusToInvalidate}`, [] as any, { ttl: 'hot' });
    
    const savedBlog = blog.toObject();
    return NextResponse.json({
      slug: savedBlog.slug,
      ...savedBlog,
      content: validateAndFixContent(savedBlog.content),
      contentJSON: validateAndFixContent(savedBlog.content),
    }, { status: 201 });
  } catch (error) {
    console.error('Blog POST error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to create blog', details: msg }, { status: 500 });
  }
}
