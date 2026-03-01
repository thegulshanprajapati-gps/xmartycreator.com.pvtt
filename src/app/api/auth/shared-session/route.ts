import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    const student = session.student;
    const studentEmail =
      typeof student?.email === 'string' ? student.email.trim().toLowerCase() : '';

    if (studentEmail) {
      return NextResponse.json(
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
    }

    if (session.isLoggedIn) {
      return NextResponse.json(
        {
          authenticated: true,
          role: 'ADMIN',
          username: session.username || null,
        },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    return NextResponse.json(
      { authenticated: false, role: null },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[auth/shared-session] Failed to load session:', error);
    return NextResponse.json(
      { authenticated: false, role: null, message: 'Failed to read session' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
