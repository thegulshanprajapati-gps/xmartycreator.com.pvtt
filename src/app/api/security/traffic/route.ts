import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis-cache';

function parseEvents(raw: string[]): any[] {
  return raw
    .map((r) => {
      try { return JSON.parse(r); } catch { return null; }
    })
    .filter(Boolean);
}

export async function GET() {
  const windowMs = 15 * 60 * 1000; // last 15 minutes
  const since = Date.now() - windowMs;
  const raw = await redis.lrange<string>('security:events', 0, 2000);
  const events = parseEvents(raw).filter((e) => e.ts >= since);

  const byRoute: Record<string, number> = {};
  events.forEach((e) => {
    const key = e.route || 'unknown';
    byRoute[key] = (byRoute[key] || 0) + 1;
  });

  const routes = Object.entries(byRoute)
    .map(([route, count]) => ({ route, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  return NextResponse.json({ routes, total: events.length });
}
