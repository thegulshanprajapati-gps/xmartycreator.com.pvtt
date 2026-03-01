import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { clearPageCache } from '@/lib/page-content-cache';

const DEFAULT_BLOG_HERO = {
  badgeText: 'Student Insights',
  title: 'Blog for Diploma Success',
  description: 'Clear explanations, PYQs, exam updates, and real guidance for better results.',
  primaryButton: { text: 'Explore Blog', href: '/blog' },
  secondaryButton: { text: 'Latest Posts', href: '/blog' },
  pills: [
    { title: 'Study Guides', description: 'Semester-wise notes and PYQs' },
    { title: 'Exam Updates', description: 'SBTE notices and key dates' },
  ],
};

const toPlainText = (value: unknown): string =>
  String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeHeroText = (
  value: unknown,
  fallback: string,
  options?: { treatBlogAsEmpty?: boolean }
): string => {
  const plain = toPlainText(value);
  if (!plain) return fallback;
  if (options?.treatBlogAsEmpty && /^blog$/i.test(plain)) return fallback;
  return plain;
};

const sanitizeHeroPayload = (input: any) => ({
  badgeText: normalizeHeroText(input?.badgeText, DEFAULT_BLOG_HERO.badgeText),
  title: normalizeHeroText(input?.title, DEFAULT_BLOG_HERO.title, { treatBlogAsEmpty: true }),
  description: normalizeHeroText(input?.description, DEFAULT_BLOG_HERO.description),
  primaryButton: {
    text: normalizeHeroText(
      input?.primaryButton?.text,
      DEFAULT_BLOG_HERO.primaryButton.text
    ),
    href: toPlainText(input?.primaryButton?.href) || DEFAULT_BLOG_HERO.primaryButton.href,
  },
  secondaryButton: {
    text: normalizeHeroText(
      input?.secondaryButton?.text,
      DEFAULT_BLOG_HERO.secondaryButton.text
    ),
    href:
      toPlainText(input?.secondaryButton?.href) ||
      DEFAULT_BLOG_HERO.secondaryButton.href,
  },
  pills: [0, 1].map((index) => {
    const fallback = DEFAULT_BLOG_HERO.pills[index];
    const source = Array.isArray(input?.pills) ? input.pills[index] : undefined;
    return {
      title: normalizeHeroText(source?.title, fallback.title),
      description: normalizeHeroText(source?.description, fallback.description),
    };
  }),
});

// GET blog page content
export async function GET() {
  try {
    const client = await clientPromise;
    const dbName = process.env.MONGO_DB || process.env.MONGODB_DB || 'myapp';
    const db = client.db(dbName);
    const page = await db.collection('pages').findOne({ slug: 'blog' });

    const content = page?.content || {};
    const hero = sanitizeHeroPayload(content?.hero || {});

    return NextResponse.json({ ...content, hero });
  } catch (error) {
    console.error('[API] Failed to load blog page content:', error);
    return NextResponse.json({ error: 'Failed to load blog page content' }, { status: 500 });
  }
}

// POST to update blog page content (hero + pills + CTAs)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const hero = sanitizeHeroPayload(body?.hero || {});

    const client = await clientPromise;
    const dbName = process.env.MONGO_DB || process.env.MONGODB_DB || 'myapp';
    const db = client.db(dbName);

    await db.collection('pages').updateOne(
      { slug: 'blog' },
      { $set: { slug: 'blog', content: { ...(body || {}), hero } } },
      { upsert: true }
    );

    clearPageCache('blog');
    return NextResponse.json({ ok: true, hero });
  } catch (error) {
    console.error('[API] Failed to save blog page content:', error);
    return NextResponse.json({ error: 'Failed to save blog page content' }, { status: 500 });
  }
}
