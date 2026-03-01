import { NextRequest, NextResponse } from 'next/server';
import { normalizeText } from '@/lib/auth/student-portal-auth';
import { verifySuspendedContactAccess } from '@/lib/auth/suspended-contact';

export const runtime = 'nodejs';

type VerifySuspendedContactBody = {
  token?: string;
  fingerprint?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VerifySuspendedContactBody;
    const token = normalizeText(body?.token);
    const fingerprint = normalizeText(body?.fingerprint);

    const result = await verifySuspendedContactAccess(request, token, fingerprint);
    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          code: result.code,
          msg: result.msg,
        },
        { status: result.status }
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        email: result.email,
        mobile: result.mobile,
        expiresAt: result.expiresAt,
        remainingSeconds: result.remainingSeconds,
        pendingRequest: result.pendingRequest,
      },
    });
  } catch (error) {
    console.error('[auth/suspended-contact/verify] Error:', error);
    return NextResponse.json(
      {
        ok: false,
        msg: 'Unable to verify secure link.',
      },
      { status: 500 }
    );
  }
}