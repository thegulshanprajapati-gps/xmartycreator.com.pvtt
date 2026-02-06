import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, checkIPBlocklist, blockIP, authRateLimiter, aggressiveRateLimiter, getViolationCount } from '@/lib/rate-limit';
import { detectBot, getBotFingerprint } from '@/lib/bot-detection';
import { trackPageView } from '@/lib/analytics-tracker';
import { redis } from '@/lib/redis-cache';

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
    '/blog/:path*',
    '/xmartyadmin',
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};

interface RateLimitHeaders {
  'X-RateLimit-Limit': string;
  'X-RateLimit-Remaining': string;
  'X-RateLimit-Reset': string;
}

// Get client IP
function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

// Get cache key identifier
function getCacheIdentifier(req: NextRequest, ip: string): string {
  // Use combination of IP and User-Agent for better tracking
  const ua = req.headers.get('user-agent') || 'unknown';
  return `${ip}:${btoa(ua).substring(0, 16)}`;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = getClientIP(req);
  const userAgent = req.headers.get('user-agent') || '';
  const isHighTrafficMode = process.env.HIGH_TRAFFIC_MODE === 'true';
  const rateLimitEnabled = process.env.RATE_LIMIT_ENABLED !== 'false';
  const botDetectionEnabled = process.env.BOT_DETECTION_ENABLED !== 'false';
  const edgeCacheEnabled = process.env.EDGE_CACHE_ENABLED === 'true';

  const logVisit = async () => {
    try {
      const visit = {
        ip,
        route: pathname,
        method: req.method,
        ua: userAgent,
        ts: Date.now(),
      };
      await redis.lpush('security:visits', JSON.stringify(visit));
      await redis.ltrim('security:visits', 0, 4999);
    } catch (err) {
      console.error('[security visit] log failed', err);
    }
  };

  // PART 1: Check IP Blocklist
  if (rateLimitEnabled && await checkIPBlocklist(ip)) {
    return new NextResponse('Access Denied', { status: 429 });
  }

  // PART 2: Bot Detection
  if (botDetectionEnabled && req.method !== 'GET') {
    const botResult = detectBot(req);
    if (botResult.isBot || botResult.score >= 50) {
      const violations = await getViolationCount(ip);
      if (violations > 5) {
        await blockIP(ip, 3600); // Block for 1 hour
        return new NextResponse('Access Denied - Bot Detection', { status: 403 });
      }
      console.warn(`[Bot Detection] Score: ${botResult.score}, Reasons:`, botResult.reasons);
    }
  }

  // PART 3: Rate Limiting
  let rateLimitResponse: NextResponse | null = null;

  if (rateLimitEnabled) {
    const identifier = getCacheIdentifier(req, ip);
    let limiter = authRateLimiter;

    // Determine which limiter to use
    if (pathname.includes('/admin') || pathname.includes('/auth')) {
      limiter = authRateLimiter;
    } else if (detectBot(req).score >= 50) {
      limiter = aggressiveRateLimiter;
    }

    const rateLimitResult = await checkRateLimit(identifier, limiter);

    if (!rateLimitResult.success) {
      rateLimitResponse = new NextResponse('Rate Limit Exceeded', { status: 429 });
    }

    // Add rate limit headers
    const headers: RateLimitHeaders = {
      'X-RateLimit-Limit': String(rateLimitResult.limit),
      'X-RateLimit-Remaining': String(Math.max(0, rateLimitResult.remaining)),
      'X-RateLimit-Reset': String(Math.ceil(rateLimitResult.reset.getTime() / 1000)),
    };

    if (rateLimitResponse) {
      Object.entries(headers).forEach(([key, value]) => {
        rateLimitResponse!.headers.set(key, value);
      });
      return rateLimitResponse;
    }
  }

  // PART 4: Content Caching Headers (Edge Cache)
  const response = NextResponse.next();

  if (edgeCacheEnabled) {
    // Cache static pages aggressively
    if (pathname === '/' || pathname === '/blog' || pathname === '/courses') {
      response.headers.set(
        'Cache-Control',
        'public, s-maxage=3600, stale-while-revalidate=86400'
      );
    }

    // Cache API responses based on path
    if (pathname.startsWith('/api/blog') && req.method === 'GET') {
      response.headers.set(
        'Cache-Control',
        'public, s-maxage=1800, stale-while-revalidate=86400'
      );
    }

    if (pathname.startsWith('/api/courses') && req.method === 'GET') {
      response.headers.set(
        'Cache-Control',
        'public, s-maxage=3600, stale-while-revalidate=86400'
      );
    }
  } else {
    // Disable edge caching so DB changes show up immediately
    if (
      pathname === '/' ||
      pathname === '/blog' ||
      pathname === '/courses' ||
      (pathname.startsWith('/api/courses') && req.method === 'GET') ||
      (pathname.startsWith('/api/pages') && req.method === 'GET')
    ) {
      response.headers.set('Cache-Control', 'no-store');
    }
  }

  // Don't cache admin or user-specific content
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    response.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0');
  }

  // PART 5: High Traffic Mode Protection
  if (isHighTrafficMode && req.method === 'POST') {
    // During traffic spikes, only allow essential writes
    const essentialPaths = ['/api/blog', '/api/admin/dashboard'];
    const isEssentialWrite = essentialPaths.some(path => pathname.startsWith(path));

    if (!isEssentialWrite) {
      return new NextResponse('Service Temporarily Busy', { status: 503 });
    }
  }

  // PART 6: Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // PART 7: Passive analytics (edge-safe). Fire-and-forget to avoid slowing response.
  if (
    req.method === 'GET' &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/admin')
  ) {
    // Don't await; background increment only
    trackPageView(pathname, req.nextUrl.origin).catch(() => {});
    logVisit().catch(() => {});
  }

  return response;
}
