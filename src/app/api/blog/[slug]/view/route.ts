import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db-connection';
import Blog from '@/lib/models/blog';
import { checkRateLimit } from '@/lib/rate-limit';

function normalizeSlug(rawSlug: string | undefined) {
  let slug = rawSlug?.toString() || '';
  try {
    slug = decodeURIComponent(slug);
  } catch (e) {
    // If decode fails, use the slug as-is
  }
  return slug.toLowerCase().trim();
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: rawSlug } = await params;
    const slug = normalizeSlug(rawSlug);
    if (!slug) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
    }

    const clientIP = request.headers.get('x-client-ip') || 'unknown';
    const rateLimitKey = `api:blog:view:${clientIP}:${slug}`;
    const rateLimit = await checkRateLimit(rateLimitKey);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    await connectDB();

    const blog = await Blog.findOneAndUpdate(
      { slug, status: 'published' },
      { $inc: { views: 1 }, updatedAt: new Date() },
      { new: true }
    )
      .select('views')
      .lean()
      .exec();

    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      views: blog.views || 0,
      message: 'View tracked',
    });
  } catch (error) {
    console.error('Blog view POST error:', error);
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: rawSlug } = await params;
    const slug = normalizeSlug(rawSlug);
    if (!slug) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
    }

    await connectDB();

    const blog = await Blog.findOne({ slug, status: 'published' })
      .select('views')
      .lean()
      .exec();

    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json({ views: blog.views || 0 });
  } catch (error) {
    console.error('Blog view GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch view count' }, { status: 500 });
  }
}
