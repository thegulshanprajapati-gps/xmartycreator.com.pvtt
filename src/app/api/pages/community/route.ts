import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import clientPromise from '@/lib/mongodb';
import { clearPageCache } from '@/lib/page-content-cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type CommunityContent = {
  hero: { title: string; description: string };
  youtube: { channelId?: string; videoId: string; latestVideoId?: string };
  whatsapp: { title: string; description: string; link: string; buttonText: string };
  app: { title: string; description: string; link: string; buttonText: string };
  telegram: { title: string; description: string; link: string; buttonText: string };
};

const defaultContent: CommunityContent = {
  hero: { title: 'Community', description: 'Join our community' },
  youtube: { channelId: '', videoId: '' },
  whatsapp: { title: 'WhatsApp', description: '', link: '#', buttonText: 'Join' },
  app: { title: 'App', description: '', link: '#', buttonText: 'Download' },
  telegram: { title: 'Telegram', description: '', link: '#', buttonText: 'Join' },
};

const CHANNEL_ID_PATTERN = /(UC[a-zA-Z0-9_-]{22})/;
const VIDEO_ID_PATTERN = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)?([A-Za-z0-9_-]{11})/;

function normalizeChannelId(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return '';
  const match = raw.match(CHANNEL_ID_PATTERN);
  return match?.[1] || '';
}

function normalizeVideoId(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return '';
  if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw;
  const match = raw.match(VIDEO_ID_PATTERN);
  return match?.[1] || '';
}

function normalizeCommunityContent(input: any): CommunityContent {
  return {
    hero: {
      title: input?.hero?.title || defaultContent.hero.title,
      description: input?.hero?.description || defaultContent.hero.description,
    },
    youtube: {
      channelId: normalizeChannelId(input?.youtube?.channelId),
      videoId: normalizeVideoId(input?.youtube?.videoId),
      latestVideoId: normalizeVideoId(input?.youtube?.latestVideoId),
    },
    whatsapp: {
      title: input?.whatsapp?.title || defaultContent.whatsapp.title,
      description: input?.whatsapp?.description || defaultContent.whatsapp.description,
      link: input?.whatsapp?.link || defaultContent.whatsapp.link,
      buttonText: input?.whatsapp?.buttonText || defaultContent.whatsapp.buttonText,
    },
    app: {
      title: input?.app?.title || defaultContent.app.title,
      description: input?.app?.description || defaultContent.app.description,
      link: input?.app?.link || defaultContent.app.link,
      buttonText: input?.app?.buttonText || defaultContent.app.buttonText,
    },
    telegram: {
      title: input?.telegram?.title || defaultContent.telegram.title,
      description: input?.telegram?.description || defaultContent.telegram.description,
      link: input?.telegram?.link || defaultContent.telegram.link,
      buttonText: input?.telegram?.buttonText || defaultContent.telegram.buttonText,
    },
  };
}

function jsonNoStore(body: any, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}

async function getDb() {
  const client = await clientPromise;
  const dbName = 'xmartydb';
  return { db: client.db(dbName), dbName };
}

export async function GET() {
  try {
    const { db, dbName } = await getDb();
    const page = await db.collection('pages').findOne({ slug: 'community' });
    const content = normalizeCommunityContent(page?.content || {});
    return jsonNoStore({ ...content, _meta: { db: dbName } });
  } catch (error) {
    console.error('❌ [API] Failed to load community page content:', error);
    return jsonNoStore({ error: 'Failed to load community page content' }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const content = normalizeCommunityContent(body);
    const { db, dbName } = await getDb();

    await db.collection('pages').updateOne(
      { slug: 'community' },
      {
        $set: {
          slug: 'community',
          content,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    clearPageCache('community');
    revalidatePath('/community');
    revalidatePath('/admin/dashboard/community');

    return jsonNoStore({ ok: true, content, _meta: { db: dbName } });
  } catch (error) {
    console.error('❌ [API] Failed to save community page content:', error);
    return jsonNoStore({ error: 'Failed to save community page content' }, 500);
  }
}
