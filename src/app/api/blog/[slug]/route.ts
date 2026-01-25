import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import clientPromise from '@/lib/mongodb';
import Blog from '@/lib/models/blog';
import { calculateReadTime } from '@/lib/readTime';
import { slugify } from '@/lib/slugify';

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
    await clientPromise;
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    const blog = await Blog.findOne({ slug: params.slug });
    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    // Fix content structure and add contentJSON for compatibility
    const blogData = blog.toObject();
    return NextResponse.json({
      ...blogData,
      content: validateAndFixContent(blogData.content),
      contentJSON: validateAndFixContent(blogData.content),
    });
  } catch (error) {
    console.error('Blog GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch blog', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
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
    const { title, content, contentJSON, htmlContent, contentHTML, excerpt, author, authorImage, coverImage, tags, metaTitle, metaDescription, metaKeywords, status } = body;

    // Accept both field name variations
    const finalContent = validateAndFixContent(content || contentJSON || {});
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
    blog.content = finalContent;
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
    
    // Return blog with fixed content structure
    const savedBlog = blog.toObject();
    return NextResponse.json({
      ...savedBlog,
      content: validateAndFixContent(savedBlog.content),
      contentJSON: validateAndFixContent(savedBlog.content),
    });
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
    console.error('Blog DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete blog', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}


