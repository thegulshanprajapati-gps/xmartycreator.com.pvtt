import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db-connection';
import Blog from '@/lib/models/blog';
import BlogComment from '@/lib/models/blog-comment';
import { checkRateLimit } from '@/lib/rate-limit';

const MAX_LIMIT = 200;

function normalizeSlug(rawSlug: string | undefined) {
  let slug = rawSlug?.toString() || '';
  try {
    slug = decodeURIComponent(slug);
  } catch (e) {
    // If decode fails, use the slug as-is
  }
  return slug.toLowerCase().trim();
}

function formatComment(comment: any) {
  const plain = comment?.toObject ? comment.toObject() : comment;
  return {
    ...plain,
    _id: plain?._id?.toString?.() ?? plain?._id,
    createdAt: plain?.createdAt instanceof Date ? plain.createdAt.toISOString() : plain?.createdAt,
    updatedAt: plain?.updatedAt instanceof Date ? plain.updatedAt.toISOString() : plain?.updatedAt,
  };
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

    const limitParam = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), MAX_LIMIT) : 50;

    await connectDB();

    const [comments, total] = await Promise.all([
      BlogComment.find({ blogSlug: slug })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()
        .exec(),
      BlogComment.countDocuments({ blogSlug: slug }),
    ]);

    return NextResponse.json({
      comments: comments.map(formatComment),
      total,
    });
  } catch (error) {
    console.error('Blog comments GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
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
    const rateLimitKey = `api:blog-comment:${clientIP}:${slug}`;
    const rateLimit = await checkRateLimit(rateLimitKey);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await request.json();
    const name = (body?.name || '').toString().trim();
    const email = (body?.email || '').toString().trim().toLowerCase();
    const message = (body?.message || '').toString().trim();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and comment are required' },
        { status: 400 }
      );
    }

    if (name.length < 2 || name.length > 80) {
      return NextResponse.json(
        { error: 'Name must be between 2 and 80 characters' },
        { status: 400 }
      );
    }

    if (email.length < 6 || email.length > 120 || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    if (message.length < 2 || message.length > 2000) {
      return NextResponse.json(
        { error: 'Comment must be between 2 and 2000 characters' },
        { status: 400 }
      );
    }

    await connectDB();

    const blog = await Blog.findOne({ slug, status: 'published' })
      .select('title')
      .lean()
      .exec();

    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    const comment = new BlogComment({
      blogSlug: slug,
      blogTitle: blog?.title || '',
      name,
      email,
      message,
    });

    await comment.save();

    return NextResponse.json({ comment: formatComment(comment) }, { status: 201 });
  } catch (error) {
    console.error('Blog comments POST error:', error);
    return NextResponse.json({ error: 'Failed to submit comment' }, { status: 500 });
  }
}
