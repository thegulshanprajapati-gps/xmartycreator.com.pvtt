import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db-connection';
import Blog from '@/lib/models/blog';
import { calculateReadTime } from '@/lib/readTime';
import { slugify } from '@/lib/slugify';
import { checkRateLimit } from '@/lib/rate-limit';
import { cacheGet, cacheSet, cacheDel } from '@/lib/redis-cache';
import { toPlainObject, toPlainObjectArray } from '@/lib/mongoose-helpers';

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
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100', 10);
    const includeContent = request.nextUrl.searchParams.get('includeContent') === 'true';
    
    console.log(`\n🔵 [API /api/blog] START - Fetching blogs with status: ${statusParam}`);
    
    // Rate limiting
    const rateLimitKey = `api:blog:${clientIP}`;
    const rateLimit = await checkRateLimit(rateLimitKey);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    await connectDB();
    console.log(`✅ [MongoDB] Connected`);
    
    // ✅ FIXED: Use exact query for published OR include all based on status param
    const query: any = {};
    
    if (statusParam === 'all') {
      // Admin: return all blogs regardless of status
      // No status filter
      console.log(`📋 [Query] Admin mode - fetching ALL blogs (no status filter)`);
    } else {
      // Public: only published blogs
      query.status = 'published';
      console.log(`📋 [Query] Public mode - fetching only PUBLISHED blogs`);
    }

    const cacheKey = `blogs:list:${statusParam}:content-${includeContent ? 'on' : 'off'}`;
    
    // Check cache first
    const cached = await cacheGet(cacheKey);
    if (cached) {
      console.log(`✅ [Cache HIT] blog list - ${statusParam}, returning ${Array.isArray(cached) ? cached.length : 0} items`);
      return NextResponse.json(cached);
    }

    console.log(`🔍 [mongoDB Query] Finding with:`, JSON.stringify(query));

    // ✅ CRITICAL: Fetch htmlContent for rendering + all display fields
    // Note: + prefix REQUIRED for fields with select: false in schema
    const selectFields = includeContent
      ? '_id title slug excerpt author readTime status publishedAt updatedAt tags views likes coverImage +htmlContent +content'
      : '_id title slug excerpt author readTime status publishedAt updatedAt tags views likes coverImage authorImage';

    const blogs = await Blog.find(query)
      .select(selectFields)
      .sort({ publishedAt: -1 })
      .limit(limit)
      .maxTimeMS(5000)
      .lean()
      .exec();
    
    console.log(`✅ [MongoDB Result] Found ${blogs.length} blogs for query`, query);
    
    if (blogs.length > 0) {
      console.log(`📄 [First Blog] ${blogs[0].title} (slug: ${blogs[0].slug})`);
      console.log(`📝 [htmlContent] Exists: ${!!blogs[0].htmlContent}, Length: ${blogs[0].htmlContent?.length || 0}`);
    }
    
    if (!blogs || !Array.isArray(blogs)) {
      console.warn(`⚠️ [DB Result] blogs is not array:`, typeof blogs);
      return NextResponse.json([], { status: 200 });
    }

    // Ensure response is always array
    const response = blogs || [];
    
    console.log(`✅ [API Response] Returning ${response.length} blogs`);
    console.log(`🔵 [API /api/blog] DONE\n`);
    
    // Cache for 5 minutes  
    await cacheSet(cacheKey, response, { ttl: 'hot' });
    
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('❌ [API Error] Blog GET error:', error);
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

    const missingFields: string[] = [];
    if (!title) missingFields.push('title');
    if (!htmlContent) missingFields.push('htmlContent');
    if (!author) missingFields.push('author');
    if (!excerpt) missingFields.push('excerpt');

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
      excerpt,
      author,
      authorImage: authorImage || '',
      coverImage: coverImageData,
      tags: tags || [],
      readTime,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || excerpt,
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
      `blog:${slug}`,
    ];
    await cacheDel(cacheKeys);
    
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
