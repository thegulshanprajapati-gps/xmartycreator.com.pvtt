import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis-cache';

function safeParseList(raw: string[]): any[] {
  return raw
    .map((r) => {
      try {
        return typeof r === 'string' ? JSON.parse(r) : null;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

// Poll-based SSE (Upstash REST doesn't support pubsub in edge). Sends last 50 events and then polls every 2s.
export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      let interval: NodeJS.Timer | null = null;
      let heartbeat: NodeJS.Timer | null = null;

      const closeAll = () => {
        if (closed) return;
        closed = true;
        if (interval) clearInterval(interval);
        if (heartbeat) clearInterval(heartbeat);
        try { controller.close(); } catch {}
      };

      async function send(data: any) {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
          closeAll();
        }
      }

      // initial burst
      const initial = await redis.lrange<string>('security:events', 0, 49);
      await send({ type: 'snapshot', events: safeParseList(initial) });

      let cursor = Date.now();
      interval = setInterval(async () => {
        if (closed) return;
        const raw = await redis.lrange<string>('security:events', 0, 49);
        const events = safeParseList(raw);
        const fresh = events.filter((e) => e?.ts >= cursor);
        if (fresh.length) {
          cursor = Date.now();
          await send({ type: 'append', events: fresh });
        }
      }, 2000);

      heartbeat = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(': keep-alive\n\n'));
        } catch (err) {
          closed = true;
          closeAll();
        }
      }, 15000);

      try {
        controller.enqueue(encoder.encode('event: open\ndata: ok\n\n'));
      } catch {
        closeAll();
      }

      return () => {
        closeAll();
      };
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
