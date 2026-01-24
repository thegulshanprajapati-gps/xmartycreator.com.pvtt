
import { notFound } from 'next/navigation';
import type { Metadata, ResolvingMetadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import clientPromise from '@/lib/mongodb';
import Blog from '@/lib/models/blog';
import { Footer } from '@/components/layout/footer';
import {
  generateBlogMetadata,
  generateBlogPostingSchema,
  generateBreadcrumbSchema,
  generateShareUrls,
} from '@/lib/seo-utils';
import { generateTableOfContents } from '@/lib/blog-utils';
import {
  Share2,
  Twitter,
  Linkedin,
  Facebook,
  Link as LinkIcon,
  ChevronRight,
  Calendar,
  User,
  Clock,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BlogDetailClient } from './blog-detail-client';
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

async function getBlogBySlug(slug: string) {
  try {
    await initializeMongoose();
    const blog = await Blog.findOne({ slug, status: 'published' }).lean().exec();
    return blog;
  } catch (error) {
    console.error('Error fetching blog:', error);
    return null;
  }
}

async function getRelatedBlogs(slug: string, tags: string[], limit: number = 3) {
  try {
    await initializeMongoose();
    const currentBlog = await Blog.findOne({ slug }).lean().exec();
    if (!currentBlog) return [];

    const related = await Blog.find({
      _id: { $ne: currentBlog._id },
      status: 'published',
      tags: { $in: tags },
    })
      .limit(limit)
      .sort({ publishedAt: -1 })
      .lean()
      .exec();

    return related;
  } catch (error) {
    console.error('Error fetching related blogs:', error);
    return [];
  }
}

export async function generateMetadata(
  { params }: { params: { slug: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const blog = await getBlogBySlug(params.slug);

  if (!blog) {
    return {
      title: 'Blog Not Found',
    };
  }

  return generateBlogMetadata(blog);
}

export default async function BlogDetailPage({ params }: { params: { slug: string } }) {
  const blog = await getBlogBySlug(params.slug);

  if (!blog) {
    notFound();
  }

  const relatedBlogs = await getRelatedBlogs(params.slug, blog.tags);
  const tableOfContents = generateTableOfContents(blog.content);
  const shareUrls = generateShareUrls(blog.slug, blog.title);
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://xmartycreator.com';

  return (
    <>
      <div className="flex flex-col">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-20 bg-gradient-to-b from-accent/20 to-background">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl">
            <div className="space-y-6">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/blog" className="hover:text-foreground transition">
                  Blog
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground">{blog.title}</span>
              </div>

              {/* Title */}
              <h1 className="font-headline text-3xl md:text-5xl font-bold text-destructive dark:text-foreground leading-tight">
                {blog.title}
              </h1>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {blog.publishedAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(blog.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{blog.author}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{blog.readTime}</span>
                </div>
              </div>

              {/* Tags */}
              {blog.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map(tag => (
                    <Badge key={tag} variant="secondary">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Cover Image */}
        {blog.coverImage?.url && (
          <section className="w-full py-8">
            <div className="container mx-auto px-4 md:px-6 max-w-4xl">
              <div className="relative w-full h-96 rounded-lg overflow-hidden shadow-lg">
                <Image
                  src={blog.coverImage.url}
                  alt={blog.coverImage.alt || blog.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </section>
        )}

        {/* Main Content */}
        <section className="w-full py-12 md:py-16">
          <div className="container mx-auto px-4 md:px-6 max-w-6xl">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
              {/* TOC Sidebar (Sticky) */}
              {tableOfContents.length > 0 && (
                <aside className="hidden lg:block lg:col-span-1">
                  <div className="sticky top-24 bg-muted/50 rounded-lg p-4 h-fit">
                    <h3 className="font-semibold text-sm mb-4">Table of Contents</h3>
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
                </aside>
              )}

              {/* Article Content */}
              <div className="lg:col-span-3 space-y-8">
                {/* Article Body */}
                <article className="prose prose-lg dark:prose-invert max-w-none">
                  <BlogDetailClient htmlContent={blog.htmlContent} />
                </article>

                {/* Social Sharing */}
                <div className="flex items-center gap-2 pt-8 border-t">
                  <span className="text-sm font-medium text-muted-foreground">Share:</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      title="Share on Twitter"
                    >
                      <a href={shareUrls.twitter} target="_blank" rel="noopener noreferrer">
                        <Twitter className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      title="Share on LinkedIn"
                    >
                      <a href={shareUrls.linkedin} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      title="Share on Facebook"
                    >
                      <a href={shareUrls.facebook} target="_blank" rel="noopener noreferrer">
                        <Facebook className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${baseUrl}/blog/${blog.slug}`
                        );
                      }}
                      title="Copy link"
                    >
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Author Info */}
                <div className="bg-muted/50 rounded-lg p-6 flex items-center gap-4">
                  {blog.authorImage && (
                    <div className="relative h-16 w-16 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={blog.authorImage}
                        alt={blog.author}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-foreground">{blog.author}</h3>
                    <p className="text-sm text-muted-foreground">
                      Published on {new Date(blog.publishedAt || Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Posts */}
        {relatedBlogs.length > 0 && (
          <section className="w-full py-16 bg-muted/30">
            <div className="container mx-auto px-4 md:px-6 max-w-6xl">
              <div className="mb-12">
                <h2 className="font-headline text-3xl font-bold mb-2">Related Articles</h2>
                <p className="text-muted-foreground">
                  Check out these related blog posts
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {relatedBlogs.map((post: any) => (
                  <Link
                    key={post._id}
                    href={`/blog/${post.slug}`}
                    className="group"
                  >
                    <div className="bg-background rounded-lg overflow-hidden border transition-all duration-300 hover:shadow-lg hover:border-destructive h-full flex flex-col">
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
                        <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-destructive transition">
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

      {/* JSON-LD Schema */}
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
    </>
  );
}
