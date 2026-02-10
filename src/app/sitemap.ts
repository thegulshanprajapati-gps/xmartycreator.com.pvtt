import type { MetadataRoute } from 'next';
import connectDB from '@/lib/db-connection';
import Blog from '@/lib/models/blog';
import Course from '@/lib/models/course';
import { slugify } from '@/lib/slugify';

export const revalidate = 3600;

type BlogDoc = {
  slug?: string;
  updatedAt?: Date | string;
  publishedAt?: Date | string;
  tags?: string[];
};

type CourseDoc = {
  slug?: string;
  updatedAt?: Date | string;
  createdAt?: Date | string;
};

const now = () => new Date();

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

const toSafeDate = (value?: Date | string) => {
  if (!value) return now();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? now() : date;
};

const staticRoutes: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
}> = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/blog', changeFrequency: 'daily', priority: 0.9 },
  { path: '/courses', changeFrequency: 'daily', priority: 0.9 },
  { path: '/community', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/community/hub', changeFrequency: 'weekly', priority: 0.75 },
  { path: '/updates', changeFrequency: 'daily', priority: 0.8 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/faq', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/privacy-policy', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/terms-of-service', changeFrequency: 'yearly', priority: 0.4 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_URL || 'https://xmartycreator.com');
  const entries: MetadataRoute.Sitemap = [];
  const seen = new Set<string>();

  const addEntry = (entry: MetadataRoute.Sitemap[number]) => {
    if (seen.has(entry.url)) return;
    seen.add(entry.url);
    entries.push(entry);
  };

  for (const route of staticRoutes) {
    addEntry({
      url: `${baseUrl}${route.path}`,
      lastModified: now(),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    });
  }

  let blogs: BlogDoc[] = [];
  let courses: CourseDoc[] = [];

  try {
    await connectDB();

    [blogs, courses] = await Promise.all([
      Blog.find({ status: 'published' })
        .select('slug updatedAt publishedAt tags')
        .lean<BlogDoc[]>(),
      Course.find({})
        .select('slug updatedAt createdAt')
        .lean<CourseDoc[]>(),
    ]);
  } catch (error) {
    console.error('[sitemap] Failed to fetch dynamic routes:', error);
    return entries;
  }

  const topicSlugs = new Set<string>();

  for (const blog of blogs) {
    if (!blog.slug) continue;

    addEntry({
      url: `${baseUrl}/blog/${blog.slug}`,
      lastModified: toSafeDate(blog.updatedAt || blog.publishedAt),
      changeFrequency: 'weekly',
      priority: 0.75,
    });

    for (const tag of blog.tags || []) {
      const topic = slugify(tag || '');
      if (topic) topicSlugs.add(topic);
    }
  }

  for (const course of courses) {
    if (!course.slug) continue;

    addEntry({
      url: `${baseUrl}/courses/${course.slug}`,
      lastModified: toSafeDate(course.updatedAt || course.createdAt),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  for (const topic of topicSlugs) {
    addEntry({
      url: `${baseUrl}/topic/${topic}`,
      lastModified: now(),
      changeFrequency: 'weekly',
      priority: 0.65,
    });
  }

  return entries;
}
