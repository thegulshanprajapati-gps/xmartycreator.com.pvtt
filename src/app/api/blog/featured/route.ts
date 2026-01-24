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

// GET /api/blog/featured - Get featured/trending blogs
export async function GET(request: NextRequest) {
  try {
    await initializeMongoose();

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '5');

    const blogs = await Blog.find({ status: 'published' })
      .sort({ views: -1, publishedAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    return NextResponse.json(blogs);
  } catch (error) {
    console.error('Featured blogs error:', error);
    return NextResponse.json({ error: 'Failed to fetch featured blogs' }, { status: 500 });
  }
}
