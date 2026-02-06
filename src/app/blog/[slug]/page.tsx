import { notFound } from 'next/navigation';
import type { Metadata, ResolvingMetadata } from 'next';
import { unstable_cache } from 'next/cache';
import Image from 'next/image';
import Link from 'next/link';
import clientPromise from '@/lib/mongodb';
import Blog from '@/lib/models/blog';
import { Footer } from '@/components/layout/footer';
import { BlogContent } from '@/components/blog-content';
import { BlogComments } from '@/components/blog/blog-comments';
import { BlogViews } from '@/components/blog/blog-views';
import {
  generateBlogMetadata,
  generateBlogPostingSchema,
  generateBreadcrumbSchema,
  generateShareUrls,
  generateOrganizationSchema,
  generateWebsiteSchema,
} from '@/lib/seo-utils';
import { generateTableOfContents } from '@/lib/blog-utils';
import {
  ChevronRight,
  Calendar,
  User,
  Clock,
  Eye,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ShareButtons } from './share-buttons';
import { BlogPost } from '@/types/blog';
import mongoose from 'mongoose';
import { scrubCurrencyInHtml } from '@/lib/price-sanitize';

export const revalidate = 300;

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

const getBlogBySlug = unstable_cache(
  async (slug: string): Promise<BlogPost | null> => {
    try {
      await initializeMongoose();
      const blog = await Blog.findOne({ slug, status: 'published' })
        .select('title slug excerpt author authorImage readTime views publishedAt coverImage tags +htmlContent +content')
        .lean<BlogPost>()
        .exec();
      return blog || null;
    } catch (error) {
      console.error(`✖ [Blog] Failed to fetch blog "${slug}":`, error);
      return null;
    }
  },
  ['blog-by-slug'],
  { revalidate: 300 }
);

const getRelatedBlogs = unstable_cache(
  async (slug: string, tags: string[], limit = 3): Promise<BlogPost[]> => {
    try {
      await initializeMongoose();
      const currentBlog = await Blog.findOne({ slug }).select('_id').lean<BlogPost>().exec();
      if (!currentBlog || !Array.isArray(tags)) return [];
      const related = await Blog.find({
        _id: { $ne: currentBlog._id },
        status: 'published',
        tags: { $in: tags },
      })
        .limit(limit)
        .sort({ publishedAt: -1 })
        .select('title slug excerpt coverImage readTime')
        .lean<BlogPost[]>()
        .exec();
      return Array.isArray(related) ? related : [];
    } catch (error) {
      console.error('Error fetching related blogs:', error);
      return [];
    }
  },
  ['blog-related'],
  { revalidate: 300 }
);

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);
  if (!blog) return { title: 'Blog Not Found' };
  return generateBlogMetadata(blog);
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);
  if (!blog) notFound();

  const relatedBlogs = await getRelatedBlogs(slug, blog.tags || []);
  const tableOfContents = generateTableOfContents(blog.content);
  const shareUrls = generateShareUrls(blog.slug, blog.title);
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://xmartycreator.com';
  const cleanedHtml = blog.htmlContent ? scrubCurrencyInHtml(blog.htmlContent) : undefined;

  return (
    <>
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-cyan-200/40 dark:bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute top-24 left-0 h-80 w-80 rounded-full bg-amber-200/30 dark:bg-amber-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-blue-200/30 dark:bg-blue-500/10 blur-3xl" />

        {/* Hero */}
        <section className="relative w-full pt-12 md:pt-16 pb-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.12),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(249,115,22,0.12),transparent_35%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.2),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(249,115,22,0.2),transparent_35%)]" />
          <div className="relative container mx-auto px-4 md:px-6 max-w-6xl">
            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
              <Link href="/blog" className="hover:text-foreground transition">Blog</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground line-clamp-1">{blog.title}</span>
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {blog.tags?.slice(0, 6).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="rounded-full px-3 py-1 text-xs bg-white/80 border border-slate-200 dark:bg-slate-900/70 dark:border-slate-700 dark:text-slate-100"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="space-y-4">
                  <h1 className="font-headline text-3xl md:text-5xl font-bold leading-tight text-slate-900 dark:text-slate-100">
                    {blog.title}
                  </h1>
                  {blog.excerpt && (
                    <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-2xl">
                      {blog.excerpt}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  {blog.publishedAt && (
                    <div className="flex items-center gap-2 rounded-full bg-white/80 border border-slate-200 px-3 py-2 text-slate-700 dark:bg-slate-900/70 dark:border-slate-700 dark:text-slate-200 shadow-sm">
                      <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                      <span>{new Date(blog.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 rounded-full bg-white/80 border border-slate-200 px-3 py-2 text-slate-700 dark:bg-slate-900/70 dark:border-slate-700 dark:text-slate-200 shadow-sm">
                    <User className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                    <span>{blog.author}</span>
                  </div>
                  {blog.readTime && (
                    <div className="flex items-center gap-2 rounded-full bg-white/80 border border-slate-200 px-3 py-2 text-slate-700 dark:bg-slate-900/70 dark:border-slate-700 dark:text-slate-200 shadow-sm">
                      <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                      <span>{blog.readTime}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 rounded-full bg-white/80 border border-slate-200 px-3 py-2 text-slate-700 dark:bg-slate-900/70 dark:border-slate-700 dark:text-slate-200 shadow-sm">
                    <Eye className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                    <BlogViews slug={blog.slug} initialViews={blog.views || 0} />
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-4 rounded-[32px] bg-gradient-to-br from-blue-500/15 via-transparent to-orange-400/15 blur-xl" />
                <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 dark:border-slate-800/80 dark:bg-slate-900/60 shadow-2xl hover-lift hover-sheen">
                  {blog.coverImage?.url ? (
                    <div className="relative aspect-[16/11] sm:aspect-[16/10]">
                      <Image
                        src={blog.coverImage.url}
                        alt={blog.coverImage.alt || blog.title}
                        fill
                        className="object-cover"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 text-white drop-shadow-lg space-y-1">
                        <p className="text-xs uppercase tracking-wide opacity-80">Feature story</p>
                        <h2 className="text-xl md:text-2xl font-semibold leading-tight">{blog.title}</h2>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[16/11] sm:aspect-[16/10] grid place-items-center bg-gradient-to-br from-slate-900 to-slate-700 text-white">
                      <div className="text-center space-y-2">
                        <div className="text-5xl font-bold">{(blog.title || '?').trim().charAt(0).toUpperCase()}</div>
                        <p className="text-sm text-white/70">Xmarty Creator</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Body */}
        <section className="w-full pb-16">
          <div className="container mx-auto px-4 md:px-6 max-w-6xl">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[3.4fr_1fr]">
              <div className="space-y-10">
                <article className="rounded-3xl border border-slate-200/70 bg-white/90 dark:border-slate-800/70 dark:bg-slate-900/70 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.6)] px-6 py-8 md:px-10 md:py-12">
                  <BlogContent
                    htmlContent={cleanedHtml}
                    contentJSON={blog.content}
                    title={blog.title}
                  />
                </article>
                <div className="rounded-3xl border border-slate-200/70 bg-white/90 dark:border-slate-800/70 dark:bg-slate-900/70 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.45)] px-6 py-8 md:px-10 md:py-10">
                  <BlogComments slug={blog.slug} title={blog.title} />
                </div>
              </div>

              <aside className="lg:block">
                <div className="sticky top-24 space-y-6">
                  <div className="rounded-2xl border border-slate-200 bg-white/90 dark:border-slate-800 dark:bg-slate-900/70 p-4 shadow-sm">
                    <h3 className="font-semibold text-sm mb-4">Share this article</h3>
                    <ShareButtons
                      slug={blog.slug}
                      title={blog.title}
                      baseUrl={baseUrl}
                      shareUrls={shareUrls}
                    />
                  </div>

                  {tableOfContents.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-white/90 dark:border-slate-800 dark:bg-slate-900/70 p-4 shadow-sm">
                      <h3 className="font-semibold text-sm mb-4">On this page</h3>
                      <nav className="space-y-2 text-sm">
                        {tableOfContents.map(item => (
                          <a
                            key={item.id}
                            href={`#${item.id}`}
                            className="block text-muted-foreground hover:text-foreground transition truncate"
                            style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
                          >
                            {item.text}
                          </a>
                        ))}
                      </nav>
                    </div>
                  )}

                  <div className="rounded-2xl border border-slate-200 bg-white/90 dark:border-slate-800 dark:bg-slate-900/70 p-4 shadow-sm">
                    <div className="flex items-center gap-4">
                      {blog.authorImage ? (
                        <div className="relative h-14 w-14 rounded-full overflow-hidden flex-shrink-0">
                          <Image
                            src={blog.authorImage}
                            alt={blog.author}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-14 w-14 rounded-full bg-primary/15 text-primary font-bold grid place-items-center text-lg">
                          {(blog.author || '?').trim().charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-foreground">{blog.author}</h3>
                        <p className="text-xs text-muted-foreground">
                          {blog.publishedAt
                            ? new Date(blog.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                            : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    {blog.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-3 mt-3">
                        {blog.excerpt}
                      </p>
                    )}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {(relatedBlogs || []).length > 0 && (
          <section className="w-full py-16 bg-white/60 dark:bg-slate-950/40 border-t dark:border-slate-800">
            <div className="container mx-auto px-4 md:px-6 max-w-6xl">
              <div className="mb-10">
                <h2 className="font-headline text-3xl font-bold mb-2">Related Articles</h2>
                <p className="text-muted-foreground">
                  Keep exploring stories from Xmarty Creator.
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {(relatedBlogs || []).filter((post:any)=>post && post.title && post.slug).map((post:any)=>(
                  <Link
                    key={post._id}
                    href={`/blog/${post.slug}`}
                    className="group"
                  >
                    <div className="bg-white dark:bg-slate-900/70 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 hover-lift hover-sheen h-full flex flex-col">
                      {post.coverImage?.url && (
                        <div className="relative h-40 w-full overflow-hidden bg-muted">
                          <Image
                            src={post.coverImage.url}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-110 transition duration-300"
                          />
                        </div>
                      )}
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-primary transition">
                          {post.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {post.excerpt}
                        </p>
                        <div className="mt-auto text-xs text-muted-foreground">
                          {post.readTime}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      <Footer />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateBlogPostingSchema(blog)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateBreadcrumbSchema(blog.slug, blog.title)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateOrganizationSchema()),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateWebsiteSchema()),
        }}
      />
    </>
  );
}
