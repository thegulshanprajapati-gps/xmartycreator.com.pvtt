import type { Metadata } from 'next';
import Link from 'next/link';
import connectDB from '@/lib/db-connection';
import Blog from '@/lib/models/blog';
import { slugify } from '@/lib/slugify';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Topics | Xmarty Creator',
  description: 'Browse all learning topics and explore related articles.',
  openGraph: {
    title: 'Topics | Xmarty Creator',
    description: 'Browse all learning topics and explore related articles.',
    type: 'website',
    url: 'https://xmartycreator.com/topic',
  },
};

export const revalidate = 300;

type BlogTagDoc = {
  tags?: string[];
};

async function getTopics() {
  try {
    await connectDB();
    const blogs = await Blog.find({ status: 'published' }).select('tags').lean<BlogTagDoc[]>();

    const slugToLabel = new Map<string, string>();

    for (const blog of blogs) {
      for (const tag of blog.tags || []) {
        const cleanTag = (tag || '').trim();
        if (!cleanTag) continue;

        const slug = slugify(cleanTag);
        if (!slug) continue;

        if (!slugToLabel.has(slug)) {
          slugToLabel.set(slug, cleanTag);
        }
      }
    }

    return Array.from(slugToLabel.entries())
      .map(([slug, label]) => ({ slug, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  } catch (error) {
    console.error('[topic] Failed to fetch topics:', error);
    return [];
  }
}

export default async function TopicIndexPage() {
  const topics = await getTopics();

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">Explore Topics</h1>
        <p className="text-muted-foreground">
          Pick a topic to view curated blogs and learning resources.
        </p>
      </div>

      {topics.length === 0 ? (
        <div className="mt-10 rounded-lg border border-border/70 bg-card/60 p-8 text-center">
          <p className="mb-4 text-muted-foreground">No topics available yet.</p>
          <Button asChild>
            <Link href="/blog">Browse All Articles</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => (
            <Link
              key={topic.slug}
              href={`/topic/${topic.slug}`}
              className="rounded-lg border border-border/70 bg-card/60 px-4 py-3 text-sm font-medium transition-colors hover:border-primary/50 hover:text-primary"
            >
              {topic.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
