import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import clientPromise from '@/lib/mongodb';
import Blog from '@/lib/models/blog';
import { calculateReadTime } from '@/lib/readTime';
import { slugify } from '@/lib/slugify';

export async function GET(request: NextRequest) {
  try {
    await clientPromise;
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const query: any = {};
    if (status) query.status = status;

    const blogs = await Blog.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json(blogs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch blogs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await clientPromise;
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    const body = await request.json();
    const { title, contentJSON, contentHTML, excerpt, author, authorImage, coverImage, tags, metaTitle, metaDescription, status } = body;

    if (!title || !contentHTML || !author) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const slug = slugify(title);
    const existing = await Blog.findOne({ slug });
    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    const readTime = calculateReadTime(contentHTML);

    const blog = new Blog({
      title,
      slug,
      contentJSON,
      contentHTML,
      excerpt,
      author,
      authorImage: authorImage || '',
      coverImage: coverImage || '',
      tags: tags || [],
      readTime,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || excerpt,
      status: status || 'draft',
      viewCount: 0,
      publishedAt: status === 'published' ? new Date() : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await blog.save();
    return NextResponse.json(blog, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create blog' }, { status: 500 });
  }
}
