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
  const since = Date.now() - 24 * 60 * 60 * 1000;
  const raw = await redis.lrange<string>('security:events', 0, 2000);
  const events = parseEvents(raw).filter((e) => e.ts >= since);

  const total = events.length;
  const blocked = events.filter((e) => e.status === 'blocked').length;
  const throttled = events.filter((e) => e.status === 'throttled').length;
  const bots = events.filter((e) => e.attackType === 'bot').length;
  const suspicious = events.filter((e) => e.attackType && e.attackType !== 'none').length;
  const uniqueIPs = new Set(events.map((e) => e.ip)).size;

  return NextResponse.json({
    total,
    blocked,
    throttled,
    bots,
    suspicious,
    uniqueIPs,
  });
}
