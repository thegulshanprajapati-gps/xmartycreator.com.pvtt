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
    
    // Fix content structure for all blogs
    const fixedBlogs = blogs.map(blog => ({
      ...blog,
      content: validateAndFixContent(blog.content),
      contentJSON: validateAndFixContent(blog.content),
    }));
    
    return NextResponse.json(fixedBlogs);
  } catch (error) {
    console.error('Blog GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch blogs', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await clientPromise;
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    const body = await request.json();
    console.log('Blog POST received:', JSON.stringify(body, null, 2));
    
    // Accept both htmlContent and contentHTML
    const htmlContent = body.htmlContent || body.contentHTML;
    const { title, content, excerpt, author, authorImage, coverImage, tags, metaTitle, metaDescription, metaKeywords, status } = body;

    // Detailed validation logging
    const missingFields: string[] = [];
    if (!title) missingFields.push('title');
    if (!htmlContent) missingFields.push('htmlContent');
    if (!author) missingFields.push('author');
    if (!excerpt) missingFields.push('excerpt');

    if (missingFields.length > 0) {
      const errorMsg = `Missing required fields: ${missingFields.join(', ')}`;
      console.error(errorMsg);
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const slug = slugify(title);
    console.log(`Generated slug: "${slug}" from title: "${title}"`);
    
    const existing = await Blog.findOne({ slug });
    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    const readTime = calculateReadTime(htmlContent);

    const blog = new Blog({
      title,
      slug,
      content: content || {},
      htmlContent,
      excerpt,
      author,
      authorImage: authorImage || '',
      coverImage: coverImage || { url: '', alt: '' },
      tags: tags || [],
      readTime,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || excerpt,
      metaKeywords: metaKeywords || [],
      status: status || 'draft',
      views: 0,
      likes: 0,
      publishedAt: status === 'published' ? new Date() : null,
    });

    await blog.save();
    return NextResponse.json(blog, { status: 201 });
  } catch (error) {
    console.error('Blog POST error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create blog';
    return NextResponse.json({ error: 'Failed to create blog', details: errorMessage }, { status: 500 });
  }
}
