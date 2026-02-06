import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { clearPageCache } from '@/lib/page-content-cache';

// GET blog page content
export async function GET() {
  try {
    const client = await clientPromise;
    const dbName = process.env.MONGO_DB || process.env.MONGODB_DB || 'myapp';
    const db = client.db(dbName);
    const page = await db.collection('pages').findOne({ slug: 'blog' });
    return NextResponse.json(page?.content || {});
  } catch (error) {
    console.error('❌ [API] Failed to load blog page content:', error);
    return NextResponse.json({ error: 'Failed to load blog page content' }, { status: 500 });
  }
}

// POST to update blog page content (hero + pills + CTAs)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const hero = {
      badgeText: body?.hero?.badgeText || '',
      title: body?.hero?.title || '',
      description: body?.hero?.description || '',
      primaryButton: {
        text: body?.hero?.primaryButton?.text || '',
        href: body?.hero?.primaryButton?.href || '#',
      },
      secondaryButton: {
        text: body?.hero?.secondaryButton?.text || '',
        href: body?.hero?.secondaryButton?.href || '#',
      },
      pills: Array.isArray(body?.hero?.pills) ? body.hero.pills.slice(0, 2) : [],
    };

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
    console.error('❌ [API] Failed to save blog page content:', error);
    return NextResponse.json({ error: 'Failed to save blog page content' }, { status: 500 });
  }
}
