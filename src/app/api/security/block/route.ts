import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis-cache';

export async function POST(req: Request) {
  try {
    const { ip } = await req.json();
    if (!ip) return NextResponse.json({ error: 'ip required' }, { status: 400 });
    await redis.sadd('security:blocklist', ip);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const ip = url.searchParams.get('ip');
  if (!ip) return NextResponse.json({ error: 'ip required' }, { status: 400 });
  await redis.srem('security:blocklist', ip);
  return NextResponse.json({ ok: true });
}
