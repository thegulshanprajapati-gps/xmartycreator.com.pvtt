
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';

export const config = {
  matcher: ['/admin/:path*', '/xmartyadmin'],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
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
