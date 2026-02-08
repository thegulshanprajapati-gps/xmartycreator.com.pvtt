import { NextRequest, NextResponse } from 'next/server';

const CHANNEL_ID_PATTERN = /(UC[a-zA-Z0-9_-]{22})/;
const VIDEO_ID_TAG_PATTERN = /<yt:videoId>([^<]+)<\/yt:videoId>/i;
const VIDEO_ID_FALLBACK_PATTERN = /<id>yt:video:([^<]+)<\/id>/i;

const CACHE_TTL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 4500;

type LatestVideoCacheEntry = {
  videoId: string;
  expiresAt: number;
};

const latestVideoCache = new Map<string, LatestVideoCacheEntry>();

function extractChannelId(input: string): string {
  const raw = (input || '').trim();
  if (!raw) return '';
  const match = raw.match(CHANNEL_ID_PATTERN);
  return match?.[1] || '';
}

function extractLatestVideoIdFromFeed(xml: string): string {
  if (!xml) return '';
  const primaryMatch = xml.match(VIDEO_ID_TAG_PATTERN);
  if (primaryMatch?.[1]) return primaryMatch[1].trim();

  const fallbackMatch = xml.match(VIDEO_ID_FALLBACK_PATTERN);
  if (fallbackMatch?.[1]) return fallbackMatch[1].trim();

  return '';
}

function getResponseHeaders() {
  return {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800',
  };
}

export async function GET(request: NextRequest) {
  const rawChannelId = request.nextUrl.searchParams.get('channelId') || '';
  const channelId = extractChannelId(rawChannelId);

  if (!channelId) {
    return NextResponse.json(
      { error: 'Invalid channelId. Use a YouTube channel ID like UCxxxxxxxxxxxxxxxxxxxxxx' },
      { status: 400, headers: getResponseHeaders() }
    );
  }

  const now = Date.now();
  const cached = latestVideoCache.get(channelId);
  if (cached && cached.expiresAt > now) {
    return NextResponse.json(
      {
        channelId,
        videoId: cached.videoId,
        source: 'cache',
      },
      { status: 200, headers: getResponseHeaders() }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
    const response = await fetch(feedUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `YouTube feed request failed with status ${response.status}` },
        { status: 502, headers: getResponseHeaders() }
      );
    }

    const xml = await response.text();
    const latestVideoId = extractLatestVideoIdFromFeed(xml);

    if (!latestVideoId) {
      return NextResponse.json(
        { error: 'No latest video found for this channel.' },
        { status: 404, headers: getResponseHeaders() }
      );
    }

    latestVideoCache.set(channelId, {
      videoId: latestVideoId,
      expiresAt: now + CACHE_TTL_MS,
    });

    return NextResponse.json(
      {
        channelId,
        videoId: latestVideoId,
        source: 'live',
      },
      { status: 200, headers: getResponseHeaders() }
    );
  } catch (error) {
    const message =
      error instanceof Error && error.name === 'AbortError'
        ? 'YouTube request timed out.'
        : 'Failed to fetch latest YouTube video.';

    return NextResponse.json(
      { error: message },
      { status: 504, headers: getResponseHeaders() }
    );
  } finally {
    clearTimeout(timeout);
  }
}
