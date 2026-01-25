import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import clientPromise from '@/lib/mongodb';
import Blog from '@/lib/models/blog';
import { calculateReadTime } from '@/lib/readTime';
import { slugify } from '@/lib/slugify';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await clientPromise;
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    const blog = await Blog.findOne({ slug: params.slug });
    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json(blog);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch blog' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await clientPromise;
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    const body = await request.json();
    const { title, content, htmlContent, contentHTML, excerpt, author, authorImage, coverImage, tags, metaTitle, metaDescription, metaKeywords, status } = body;

    // Accept both htmlContent and contentHTML
    const finalHtmlContent = htmlContent || contentHTML;

    if (!title || !finalHtmlContent || !author || !excerpt) {
      return NextResponse.json({ error: `Missing required fields: title, htmlContent, author, excerpt` }, { status: 400 });
    }

    const blog = await Blog.findOne({ slug: params.slug });
    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    const newSlug = slugify(title);
    if (newSlug !== params.slug) {
      const existing = await Blog.findOne({ slug: newSlug });
      if (existing) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
      }
    }

    const readTime = calculateReadTime(finalHtmlContent);

    blog.title = title;
    blog.slug = newSlug;
    blog.content = content || {};
    blog.htmlContent = finalHtmlContent;
    blog.excerpt = excerpt;
    blog.author = author;
    blog.authorImage = authorImage || '';
    blog.coverImage = coverImage || { url: '', alt: '' };
    blog.tags = tags || [];
    blog.readTime = readTime;
    blog.metaTitle = metaTitle || title;
    blog.metaDescription = metaDescription || excerpt;
    blog.metaKeywords = metaKeywords || [];
    blog.status = status || 'draft';
    blog.updatedAt = new Date();
    if (status === 'published' && !blog.publishedAt) {
      blog.publishedAt = new Date();
    }

    await blog.save();
    return NextResponse.json(blog);
  } catch (error) {
    console.error('Blog PUT error:', error);
    return NextResponse.json({ error: 'Failed to update blog', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await clientPromise;
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    const blog = await Blog.findOneAndDelete({ slug: params.slug });
    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Blog deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete blog' }, { status: 500 });
  }
}


