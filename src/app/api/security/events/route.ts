import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis-cache';

function parseEvents(raw: string[]): any[] {
  return raw
    .map((r) => {
      try { return JSON.parse(r); } catch { return null; }
    })
    .filter(Boolean);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '200', 10), 500);
  const raw = await redis.lrange<string>('security:events', 0, limit - 1);
  const events = parseEvents(raw);
  return NextResponse.json({ events });
}
