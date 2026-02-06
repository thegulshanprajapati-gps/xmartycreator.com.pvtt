import { MetadataRoute } from 'next';
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

async function getAllTags() {
  try {
    await initializeMongoose();
    const blogs = await Blog.find({ status: 'published' })
      .select('tags')
      .lean();
    const tagsSet = new Set<string>();
    blogs.forEach((blog: any) => {
      blog.tags?.forEach((tag: string) => tagsSet.add(tag));
    });
    return Array.from(tagsSet);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await initializeMongoose();

  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://xmartycreator.com';

  // Fetch all published blogs
  let blogs: any[] = [];
  try {
    blogs = await Blog.find({ status: 'published' })
      .select('slug updatedAt publishedAt')
      .lean()
      .exec();
  } catch (error) {
    console.error('Error fetching blogs for sitemap:', error);
  }

  // Get all tags
  const tags = await getAllTags();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Blog posts
  const blogSitemap: MetadataRoute.Sitemap = blogs.map(blog => ({
    url: `${baseUrl}/blog/${blog.slug}`,
    lastModified: blog.updatedAt || blog.publishedAt || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Topic pages
  const tagSitemap: MetadataRoute.Sitemap = tags.map(tag => ({
    url: `${baseUrl}/topic/${tag.toLowerCase().replace(/\s+/g, '-')}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...blogSitemap, ...tagSitemap];
}
