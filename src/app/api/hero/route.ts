import { NextResponse } from 'next/server';
import connectDB from '@/lib/db-connection';
import Hero from '@/lib/models/hero';
import clientPromise from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const HERO_CACHE_CONTROL = 'public, max-age=30, s-maxage=120, stale-while-revalidate=300';

type HeroApiPayload = {
  heading: string;
  subheading: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  isActive: boolean;
};

function toSafeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeHeroPayload(input: Partial<HeroApiPayload>): HeroApiPayload | null {
  const heading = toSafeText(input.heading);
  const subheading = toSafeText(input.subheading);
  const primaryButtonText = toSafeText(input.primaryButtonText);
  const primaryButtonLink = toSafeText(input.primaryButtonLink);
  const secondaryButtonText = toSafeText(input.secondaryButtonText);
  const secondaryButtonLink = toSafeText(input.secondaryButtonLink);

  if (
    !heading
    || !subheading
    || !primaryButtonText
    || !primaryButtonLink
    || !secondaryButtonText
    || !secondaryButtonLink
  ) {
    return null;
  }

  return {
    heading,
    subheading,
    primaryButtonText,
    primaryButtonLink,
    secondaryButtonText,
    secondaryButtonLink,
    isActive: true,
  };
}

async function getLegacyHomeHeroPayload(): Promise<HeroApiPayload | null> {
  const client = await clientPromise;
  const dbName = process.env.MONGO_DB || process.env.MONGODB_DB || 'xmartydb';
  const db = client.db(dbName);

  const pageDoc = await db.collection('pages').findOne(
    { slug: 'home' },
    { projection: { content: 1, hero: 1 } }
  );

  const rawHero = pageDoc?.content?.hero || pageDoc?.hero || pageDoc?.content?.content?.hero;
  if (!rawHero || typeof rawHero !== 'object') {
    return null;
  }

  return normalizeHeroPayload({
    heading: rawHero?.title,
    subheading: rawHero?.description,
    primaryButtonText: rawHero?.buttons?.primary?.text,
    primaryButtonLink: rawHero?.buttons?.primary?.link,
    secondaryButtonText: rawHero?.buttons?.secondary?.text,
    secondaryButtonLink: rawHero?.buttons?.secondary?.link,
  });
}

export async function GET() {
  try {
    await connectDB();

    const activeHero = await Hero.findOne({ isActive: true })
      .sort({ updatedAt: -1, createdAt: -1 })
      .select(
        'heading subheading primaryButtonText primaryButtonLink secondaryButtonText secondaryButtonLink isActive'
      )
      .lean()
      .exec();

    const normalizedActiveHero = activeHero
      ? normalizeHeroPayload({
          heading: activeHero.heading,
          subheading: activeHero.subheading,
          primaryButtonText: activeHero.primaryButtonText,
          primaryButtonLink: activeHero.primaryButtonLink,
          secondaryButtonText: activeHero.secondaryButtonText,
          secondaryButtonLink: activeHero.secondaryButtonLink,
          isActive: true,
        })
      : null;

    if (normalizedActiveHero) {
      return NextResponse.json(normalizedActiveHero, {
        status: 200,
        headers: { 'Cache-Control': HERO_CACHE_CONTROL },
      });
    }

    // Backward compatibility: admin dashboard currently stores home hero under pages.home.content.hero
    const legacyHero = await getLegacyHomeHeroPayload();
    if (legacyHero) {
      return NextResponse.json(legacyHero, {
        status: 200,
        headers: {
          'Cache-Control': HERO_CACHE_CONTROL,
          'X-Hero-Source': 'pages-home-legacy',
        },
      });
    }

    // Keep successful response to avoid noisy 404 resource errors in frontend.
    return NextResponse.json(
      { message: 'No active hero content found', data: null },
      {
        status: 200,
        headers: { 'Cache-Control': HERO_CACHE_CONTROL },
      }
    );
  } catch (error) {
    console.error('Hero GET error:', error);
    const details = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: 'Failed to fetch hero content', details },
      { status: 500 }
    );
  }
}
