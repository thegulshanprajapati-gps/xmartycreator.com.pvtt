
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

function resolveSessionCookieDomain() {
  const explicit = (process.env.SESSION_COOKIE_DOMAIN || '').trim();
  if (explicit) return explicit;

  const configuredBaseUrl = (process.env.NEXT_PUBLIC_URL || '').trim();
  if (!configuredBaseUrl) return '';

  try {
    const hostname = new URL(configuredBaseUrl).hostname.toLowerCase();
    if (hostname === 'xmartycreator.com' || hostname.endsWith('.xmartycreator.com')) {
      return '.xmartycreator.com';
    }
  } catch {
    return '';
  }

  return '';
}

const sessionCookieDomain = resolveSessionCookieDomain();

export const sessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD as string,
  cookieName: 'xmarty-creator-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    ...(sessionCookieDomain ? { domain: sessionCookieDomain } : {}),
  },
};

export type StudentPortalSession = {
  id?: string;
  email: string;
  mobile?: string;
  name?: string;
  image?: string;
  source?: 'credentials' | 'google';
  lastLoginAt?: string;
};

export interface SessionData {
  isLoggedIn?: boolean;
  username?: string;
  student?: StudentPortalSession;
}

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function getSessionFromRequest(request: NextRequest) {
  return getIronSession<SessionData>(request.cookies as any, sessionOptions);
}
