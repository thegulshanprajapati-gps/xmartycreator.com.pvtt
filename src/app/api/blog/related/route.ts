import { NextRequest, NextResponse } from 'next/server';
import Blog from '@/lib/models/blog';
import mongoose from 'mongoose';
import clientPromise from '@/lib/mongodb';

let mongooseInitialized = false;

async function initializeMongoose() {
  if (mongooseInitialized) return;
  try {
    const client = await clientPromise;
    await mongoose.connect(process.env.MONGODB_URI || '');
    mongooseInitialized = true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
}

// GET /api/blog/related?slug=... - Get related blogs by tags
export async function GET(request: NextRequest) {
  try {
    await initializeMongoose();

    const slug = request.nextUrl.searchParams.get('slug');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '3');

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      );
    }

    // Get current blog
    const currentBlog = await Blog.findOne({ slug }).lean().exec();

    if (!currentBlog) {
      return NextResponse.json(
        { error: 'Blog not found' },
        { status: 404 }
      );
    }

    // Get related blogs by tags
    const relatedBlogs = await Blog.find({
      _id: { $ne: currentBlog._id },
      status: 'published',
      tags: { $in: currentBlog.tags },
    })
      .limit(limit)
      .sort({ publishedAt: -1 })
      .lean()
      .exec();

    return NextResponse.json(relatedBlogs);
  } catch (error) {
    console.error('Related blogs error:', error);
    return NextResponse.json({ error: 'Failed to fetch related blogs' }, { status: 500 });
  }
}
