
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, checkIPBlocklist, blockIP, authRateLimiter, getViolationCount } from '@/lib/rate-limit';
import { getSessionFromRequest } from '@/lib/session';
import { redis } from '@/lib/redis-cache';

export const config = {
  matcher: ['/admin/:path*', '/xmartyadmin', '/api/:path*'],
};

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

// Bot detection patterns
const BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /curl/i,
  /wget/i,
  /python/i,
  /java(?!script)/i,
];

function isBot(userAgent: string): boolean {
  return BOT_PATTERNS.some(pattern => pattern.test(userAgent));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = getClientIP(req);
  const userAgent = req.headers.get('user-agent') || '';
  const rateLimitEnabled = process.env.RATE_LIMIT_ENABLED !== 'false';
  const killSwitch = (await redis.get<boolean>('security:kill_switch')) || false;

  // Helper to persist security event
  const logSecurityEvent = async (decision: 'allowed' | 'blocked' | 'throttled', attackType: string) => {
    try {
      const event = {
        ip,
        ua: userAgent,
        route: pathname,
        method: req.method,
        status: decision,
        attackType,
        ts: Date.now(),
      };
      // store recent list (trim to 5000)
      await redis.lpush('security:events', JSON.stringify(event));
      await redis.ltrim('security:events', 0, 4999);
    } catch (e) {
      console.error('[security log] failed', e);
    }
  };

  // 1. Check blocklist
  if (rateLimitEnabled && await checkIPBlocklist(ip)) {
    await logSecurityEvent('blocked', 'blocklist');
    return new NextResponse('Access Denied', { status: 429 });
  }

  // 1b. Kill switch: allow only whitelisted IPs when enabled
  if (killSwitch) {
    const whitelisted = await redis.sismember('security:whitelist', ip);
    if (!whitelisted) {
      await logSecurityEvent('blocked', 'kill-switch');
      return new NextResponse('Service temporarily locked down', { status: 503 });
    }
  }

  // 2. Bot detection
  if (process.env.BOT_DETECTION_ENABLED !== 'false' && isBot(userAgent)) {
    const violations = await getViolationCount(`bot:${ip}`);
    if (violations > 10) {
      await blockIP(ip, 3600);
      await logSecurityEvent('blocked', 'bot');
      return new NextResponse('Access Denied', { status: 403 });
    }
  }

  // 3. Rate limit auth endpoints
  if (pathname === '/xmartyadmin' && req.method === 'POST') {
    const identifier = `auth:${ip}`;
    const limit = await checkRateLimit(identifier, authRateLimiter);
    
    if (!limit.success) {
      const violations = await getViolationCount(ip);
      if (violations > 5) {
        await blockIP(ip, 3600);
      }
      await logSecurityEvent('throttled', 'rate-abuse');
      return new NextResponse('Too Many Login Attempts', { status: 429 });
    }
  }

  // 4. Add client IP to headers for downstream processing
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-client-ip', ip);
  requestHeaders.set('x-is-bot', isBot(userAgent) ? 'true' : 'false');

  // 5. Session validation for admin routes
  if (pathname.startsWith('/admin') || pathname === '/xmartyadmin') {
    const session = await getSessionFromRequest(req);

    // If user is logged in and tries to access login page, redirect to dashboard
    if (session.isLoggedIn && pathname === '/xmartyadmin') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }

    // If user is not logged in and tries to access any admin page
    if (!session.isLoggedIn && pathname.startsWith('/admin')) {
      const loginUrl = new URL('/xmartyadmin', req.url);
      loginUrl.searchParams.set('unauthorized', 'true');
      return NextResponse.redirect(loginUrl);
    }
  }

  await logSecurityEvent('allowed', 'none');

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
