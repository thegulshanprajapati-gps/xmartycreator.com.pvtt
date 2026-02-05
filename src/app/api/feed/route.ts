import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import Blog from '@/lib/models/blog';
import mongoose from 'mongoose';

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

export async function GET(request: NextRequest) {
  try {
    await initializeMongoose();

    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://xmartycreator.com';

    // Fetch published blogs
    const blogs = await Blog.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .limit(50)
      .lean()
      .exec();

    // Generate RSS feed
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Xmarty Creator Blog</title>
    <link>${baseUrl}</link>
    <description>Latest articles and insights from Xmarty Creator</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <image>
      <url>${baseUrl}/logo.png</url>
      <title>Xmarty Creator</title>
      <link>${baseUrl}</link>
    </image>
    ${blogs
      .map(
        blog => `
    <item>
      <title><![CDATA[${blog.title}]]></title>
      <link>${baseUrl}/blog/${blog.slug}</link>
      <guid>${baseUrl}/blog/${blog.slug}</guid>
      <description><![CDATA[${blog.excerpt}]]></description>
      <content:encoded><![CDATA[${blog.htmlContent}]]></content:encoded>
      <author>${blog.author}</author>
      <pubDate>${new Date(blog.publishedAt || Date.now()).toUTCString()}</pubDate>
      ${blog.tags.map(tag => `<category>${tag}</category>`).join('')}
      <image>
        <url>${blog.coverImage?.url || `${baseUrl}/logo.png`}</url>
        <title><![CDATA[${blog.title}]]></title>
        <link>${baseUrl}/blog/${blog.slug}</link>
      </image>
    </item>
    `
      )
      .join('')}
  </channel>
</rss>`;

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('RSS feed error:', error);
    return NextResponse.json({ error: 'Failed to generate feed' }, { status: 500 });
  }
}
