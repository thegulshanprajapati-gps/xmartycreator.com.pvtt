import { NextResponse } from 'next/server';
import { getAuthenticatedStudentUser } from '@/lib/student-session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const student = await getAuthenticatedStudentUser();
    if (!student) {
      return NextResponse.json(
        { authenticated: false, user: null },
        {
          // Keep this as 200 so the client can poll session state without noisy
          // browser console "Failed to load resource" logs.
          status: 200,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }

    return NextResponse.json(
      { authenticated: true, user: student },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[auth/student-session] Failed to load session:', error);
    return NextResponse.json(
      { authenticated: false, user: null, message: 'Failed to read session' },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }
}
