import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';

export const dynamic = 'force-dynamic';

const normalizeOrigin = (value?: string) => {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  if (!/^https?:\/\//i.test(trimmed)) return '';
  return trimmed.replace(/\/+$/, '');
};

const allowedOrigins = new Set(
  [
    process.env.NEXT_PUBLIC_TEST_APP_URL,
    process.env.TEST_APP_BASE_URL,
    process.env.TEST_APP_LOCAL_URL,
    process.env.NEXT_PUBLIC_TEST_APP_LOCAL_URL,
    process.env.NEXT_PUBLIC_URL,
    process.env.NEXTAUTH_URL,
    'https://test.xmartycreator.com',
    'https://xmartycreator.com',
    'http://localhost:3011',
    'http://localhost:3000',
  ]
    .map(normalizeOrigin)
    .filter(Boolean)
);

const getCorsOrigin = (request: NextRequest) => {
  const origin = normalizeOrigin(request.headers.get('origin') || '');
  if (origin && allowedOrigins.has(origin)) {
    return origin;
  }
  return '';
};

const withCors = (response: NextResponse, origin: string) => {
  if (!origin) return response;
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  response.headers.set('Vary', 'Origin');
  return response;
};

export async function OPTIONS(request: NextRequest) {
  const origin = getCorsOrigin(request);
  const response = new NextResponse(null, { status: 204 });
  return withCors(response, origin);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    const student = session.student;
    const studentEmail =
      typeof student?.email === 'string' ? student.email.trim().toLowerCase() : '';

    if (studentEmail) {
      const response = NextResponse.json(
        {
          authenticated: true,
          role: 'STUDENT',
          student: {
            id: student?.id || null,
            email: studentEmail,
            name: student?.name || null,
            mobile: student?.mobile || null,
          },
        },
        { headers: { 'Cache-Control': 'no-store' } }
      );
      return withCors(response, getCorsOrigin(request));
    }

    if (session.isLoggedIn) {
      const response = NextResponse.json(
        {
          authenticated: true,
          role: 'ADMIN',
          username: session.username || null,
        },
        { headers: { 'Cache-Control': 'no-store' } }
      );
      return withCors(response, getCorsOrigin(request));
    }

    const response = NextResponse.json(
      { authenticated: false, role: null },
      { headers: { 'Cache-Control': 'no-store' } }
    );
    return withCors(response, getCorsOrigin(request));
  } catch (error) {
    console.error('[auth/shared-session] Failed to load session:', error);
    const response = NextResponse.json(
      { authenticated: false, role: null, message: 'Failed to read session' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
    return withCors(response, getCorsOrigin(request));
  }
}
