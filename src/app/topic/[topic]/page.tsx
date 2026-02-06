import { Metadata } from 'next';
import Blog from '@/lib/models/blog';
import clientPromise from '@/lib/mongodb';
import mongoose from 'mongoose';
import BlogCard from '@/components/blog/blog-card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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

async function getBlogsByTag(tag: string) {
  try {
    await initializeMongoose();
    const blogs = await Blog.find({
      status: 'published',
      tags: tag,
    })
      .select('+htmlContent')
      .sort({ publishedAt: -1 })
      .lean();

    return blogs || [];
  } catch (error) {
    console.error('Error fetching blogs by tag:', error);
    return [];
  }
}

async function getAllTags() {
  try {
    await initializeMongoose();
    const blogs = await Blog.find({ status: 'published' }).select('tags').lean();
    const tagsSet = new Set<string>();
    blogs.forEach((blog: any) => {
      blog.tags?.forEach((tag: string) => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
}

export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.map((tag) => ({
    topic: tag.toLowerCase().replace(/\s+/g, '-'),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string }>;
}): Promise<Metadata> {
  const { topic } = await params;
  const decodedTopic = decodeURIComponent(topic).replace(/-/g, ' ');

  return {
    title: `${decodedTopic} - Learn & Explore | Xmarty Creator`,
    description: `Discover comprehensive guides and courses about ${decodedTopic}. Master this skill with expert-crafted content.`,
    openGraph: {
      title: `Learn ${decodedTopic} | Xmarty Creator`,
      description: `Discover comprehensive guides and courses about ${decodedTopic}`,
      type: 'website',
      url: `https://xmartycreator.com/topic/${topic}`,
    },
    keywords: [decodedTopic, `${decodedTopic} tutorial`, `learn ${decodedTopic}`],
  };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  const decodedTopic = decodeURIComponent(topic).replace(/-/g, ' ');

  const blogs = await getBlogsByTag(decodedTopic);

  return (
    <div className="container mx-auto py-12">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div>
          <h1 className="text-5xl font-bold mb-4 capitalize">
            Learn {decodedTopic}
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Master {decodedTopic} with comprehensive guides, tutorials, and courses
            curated by experts.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex gap-4">
            <Button asChild size="lg">
              <Link href={`/courses?tags=${encodeURIComponent(decodedTopic)}`}>
                View Courses
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/blog">All Articles</Link>
            </Button>
          </div>
        </div>

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'CollectionPage',
              name: `Learn ${decodedTopic}`,
              description: `Master ${decodedTopic} with expert-crafted content`,
              url: `https://xmartycreator.com/topic/${topic}`,
              mainEntity: blogs.map((blog) => {
                const validDate = blog.publishedAt && !isNaN(new Date(blog.publishedAt).getTime())
                  ? blog.publishedAt
                  : new Date().toISOString();
                return {
                  '@type': 'BlogPosting',
                  headline: blog.title,
                  description: blog.excerpt,
                  url: `https://xmartycreator.com/blog/${blog.slug}`,
                  image: blog.coverImage,
                  author: {
                    '@type': 'Person',
                    name: blog.author,
                  },
                  datePublished: validDate,
                };
              }),
            }),
          }}
        />

        {/* Content Grid */}
        {blogs.length > 0 ? (
          <>
            <div>
              <h2 className="text-3xl font-bold mb-6">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {blogs.map((blog) => (
                  <BlogCard key={blog._id?.toString()} {...blog} />
                ))}
              </div>
            </div>

            {/* FAQ Section */}
            <section>
              <h2 className="text-3xl font-bold mb-6">
                Frequently Asked Questions
              </h2>
              <div className="bg-muted/50 rounded-lg p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    What is {decodedTopic}?
                  </h3>
                  <p className="text-muted-foreground">
                    Discover the fundamentals and importance of {decodedTopic} in
                    today's digital world through our comprehensive guides.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    How do I get started with {decodedTopic}?
                  </h3>
                  <p className="text-muted-foreground">
                    We have beginner-friendly courses and articles to help you get
                    started with {decodedTopic}. Check our curated learning path.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    What are the best practices for {decodedTopic}?
                  </h3>
                  <p className="text-muted-foreground">
                    Learn industry best practices and expert tips from our courses
                    and articles.
                  </p>
                </div>
              </div>
            </section>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground mb-4">
              No content found for {decodedTopic}
            </p>
            <Button asChild>
              <Link href="/blog">Explore all articles</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
