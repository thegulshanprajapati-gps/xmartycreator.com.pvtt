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

async function searchBlogs(query: string) {
  try {
    await initializeMongoose();
    const regex = new RegExp(query, 'i');
    const blogs = await Blog.find({
      status: 'published',
      $or: [
        { title: regex },
        { excerpt: regex },
        { tags: regex },
        { author: regex },
      ],
    })
      .select('+htmlContent')
      .sort({ publishedAt: -1 })
      .limit(50)
      .lean();

    return blogs || [];
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q = '' } = await searchParams;
  const decodedQuery = decodeURIComponent(q);

  return {
    title: `Search results for "${decodedQuery}" | Xmarty Creator`,
    description: `Find articles and resources about "${decodedQuery}" on Xmarty Creator`,
    openGraph: {
      title: `Search results for "${decodedQuery}" | Xmarty Creator`,
      description: `Find articles and resources about "${decodedQuery}"`,
      type: 'website',
      url: `https://xmartycreator.com/search?q=${encodeURIComponent(decodedQuery)}`,
    },
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = '' } = await searchParams;
  const decodedQuery = decodeURIComponent(q);

  if (!decodedQuery || decodedQuery.length < 2) {
    return (
      <div className="container mx-auto py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Search</h1>
          <p className="text-muted-foreground mb-8">
            Enter at least 2 characters to search
          </p>
          <Button asChild variant="outline">
            <Link href="/blog">Browse all articles</Link>
          </Button>
        </div>
      </div>
    );
  }

  const results = await searchBlogs(decodedQuery);

  return (
    <div className="container mx-auto py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">
            Search results for "{decodedQuery}"
          </h1>
          <p className="text-muted-foreground">
            {results.length} {results.length === 1 ? 'result' : 'results'} found
          </p>
        </div>

        {/* JSON-LD for SearchResultsPage */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SearchResultsPage',
              query: decodedQuery,
              mainEntity: results.map((blog) => ({
                '@type': 'BlogPosting',
                headline: blog.title,
                description: blog.excerpt,
                url: `https://xmartycreator.com/blog/${blog.slug}`,
              })),
            }),
          }}
        />

        {/* Results Grid */}
        {results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((blog) => (
              <BlogCard key={blog._id?.toString()} {...blog} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground mb-4">
              No results found for "{decodedQuery}"
            </p>
            <p className="text-muted-foreground mb-8">
              Try a different search term or browse our categories
            </p>
            <Button asChild>
              <Link href="/blog">View all articles</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
