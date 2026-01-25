
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, checkIPBlocklist, blockIP, authRateLimiter, getViolationCount } from '@/lib/rate-limit';
import { detectBot } from '@/lib/bot-detection';
import { getSessionFromRequest } from '@/lib/session';

export const config = {
  matcher: ['/admin/:path*', '/xmartyadmin'],
};

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = getClientIP(req);
  const rateLimitEnabled = process.env.RATE_LIMIT_ENABLED !== 'false';

  // Check blocklist
  if (rateLimitEnabled && await checkIPBlocklist(ip)) {
    return new NextResponse('Access Denied', { status: 429 });
  }

  // Rate limit auth endpoints
  if (pathname === '/xmartyadmin' && req.method === 'POST') {
    const identifier = `auth:${ip}`;
    const limit = await checkRateLimit(identifier, authRateLimiter);
    
    if (!limit.success) {
      const violations = await getViolationCount(ip);
      if (violations > 5) {
        await blockIP(ip, 3600);
      }
      return new NextResponse('Too Many Login Attempts', { status: 429 });
    }
  }

  // Session validation
  const session = await getSessionFromRequest(req);

  // If user is logged in and tries to access login page, redirect to dashboard
  if (session.isLoggedIn && pathname === '/xmartyadmin') {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url));
  }

  // If user is not logged in and tries to access any admin page (except the login page itself)
  if (!session.isLoggedIn && pathname.startsWith('/admin')) {
    const loginUrl = new URL('/xmartyadmin', req.url);
    loginUrl.searchParams.set('unauthorized', 'true');
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
