import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db-connection';
import Blog from '@/lib/models/blog';
import { checkRateLimit } from '@/lib/rate-limit';
import { cacheGet, cacheSet } from '@/lib/redis-cache';


export async function GET(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-client-ip') || 'unknown';
    const statusParam = request.nextUrl.searchParams.get('status');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100', 10);
    
    // Rate limiting
    const rateLimitKey = `api:admin:blog:${clientIP}`;
    const rateLimit = await checkRateLimit(rateLimitKey);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    await connectDB();
    
    // Build query - admin can filter by status or see all
    const query: any = {};
    if (statusParam && statusParam !== 'all') {
      query.status = statusParam;
    }
    // If no status or status='all', returns all blogs

    const cacheKey = `blogs:admin:${statusParam || 'all'}`;
    
    // Check cache
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch all blog data for admin
    const blogs = await Blog.find(query)
      .select('_id title slug excerpt author readTime status publishedAt updatedAt tags views likes coverImage content htmlContent')
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .maxTimeMS(5000)
      .lean()
      .exec();
    
    const response = Array.isArray(blogs) ? blogs : [];
    
    // Cache result
    await cacheSet(cacheKey, response, { ttl: 'warm' });
    return NextResponse.json(response);
  } catch (error) {
    console.error('Admin Blog GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blogs', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}
