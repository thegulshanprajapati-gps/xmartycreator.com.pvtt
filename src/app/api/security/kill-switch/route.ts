import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis-cache';

export async function POST(req: Request) {
  try {
    const { on } = await req.json();
    const value = Boolean(on);
    await redis.set('security:kill_switch', value);
    return NextResponse.json({ ok: true, killSwitch: value });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}

export async function GET() {
  const val = await redis.get<boolean>('security:kill_switch');
  return NextResponse.json({ killSwitch: !!val });
}
