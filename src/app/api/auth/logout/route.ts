import { NextResponse } from 'next/server';
import { clearCredentialStudentSessionUser } from '@/lib/student-session';

export async function POST() {
  try {
    await clearCredentialStudentSessionUser({ clearAdminAuth: true });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[auth/logout] Failed to clear student session:', error);
    return NextResponse.json(
      { ok: false, msg: 'Logout failed' },
      { status: 500 }
    );
  }
}
