/**
 * Blog ISR wrapper - ensures pages are pre-rendered and cached
 * Strategy: Top 50 blogs on-demand, rest generated on request
 */

import { notFound } from 'next/navigation';
import connectDB from '@/lib/db-connection';
import Blog from '@/lib/models/blog';
import { cacheGet, cacheSet } from '@/lib/redis-cache';
import { BLOG_REVALIDATION_INTERVAL } from '@/lib/constants';
import type { Metadata, ResolvingMetadata } from 'next';
import Image from 'next/image';
import { BlogDetailClient } from './blog-detail-client';
import { Footer } from '@/components/layout/footer';
import type { BlogPost } from '@/types/blog';

export const revalidate = BLOG_REVALIDATION_INTERVAL;
export const dynamicParams = true; // Allow on-demand generation

async function getBlogForISR(slug: string): Promise<BlogPost | null> {
  const cacheKey = `blog:${slug}`;
  
  const cached = await cacheGet<BlogPost>(cacheKey);
  if (cached) return cached;

  await connectDB();
  const blog = await Blog.findOne({ slug, status: 'published' })
    .maxTimeMS(3000)
    .lean() as BlogPost | null;

  if (blog) {
    await cacheSet(cacheKey, blog, { ttl: 'cold' });
  }

  return blog;
}

export async function generateMetadata(
  { params }: { params: { slug: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const blog = await getBlogForISR(params.slug);

  if (!blog) {
    return { title: 'Blog Not Found' };
  }

  return {
    title: blog.metaTitle || blog.title,
    description: blog.metaDescription || blog.excerpt,
    keywords: blog.metaKeywords,
    openGraph: {
      title: blog.title,
      description: blog.excerpt,
      url: `https://xmartycreator.com/blog/${blog.slug}`,
      type: 'article',
      publishedTime: blog.publishedAt?.toString(),
    },
  };
}

export default async function BlogISRPage({
  params,
}: {
  params: { slug: string };
}) {
  const blog = await getBlogForISR(params.slug);

  if (!blog) {
    notFound();
  }

  return (
    <>
      <article className="max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{blog.title}</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>{blog.author}</span>
            <span>•</span>
            <span>{blog.readTime}</span>
            {blog.publishedAt && (
              <>
                <span>•</span>
                <time dateTime={blog.publishedAt.toString()}>
                  {new Date(blog.publishedAt).toLocaleDateString()}
                </time>
              </>
            )}
          </div>
        </header>

        {blog.coverImage?.url && (
          <figure className="mb-8">
            <Image
              src={blog.coverImage.url}
              alt={blog.title}
              width={800}
              height={400}
              className="w-full rounded-lg"
            />
          </figure>
        )}

        <BlogDetailClient htmlContent={blog.htmlContent} />
      </article>
      <Footer />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: blog.title,
            description: blog.excerpt,
            author: { '@type': 'Person', name: blog.author },
            datePublished: blog.publishedAt,
            image: blog.coverImage?.url,
          }),
        }}
      />
    </>
  );
}

export async function generateStaticParams() {
  // Pre-render top 50 most popular blogs
  await connectDB();
  const blogs = await Blog.find({ status: 'published' })
    .select('slug')
    .sort({ views: -1, publishedAt: -1 })
    .limit(50)
    .maxTimeMS(10000)
    .lean();

  return blogs.map((blog) => ({
    slug: blog.slug,
  }));
}
