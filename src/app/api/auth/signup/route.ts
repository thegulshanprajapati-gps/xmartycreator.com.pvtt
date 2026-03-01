import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db-connection';
import User from '@/lib/models/user';
import {
  TERMS_VERSION,
  generateDeviceToken,
  hashPassword,
  isValidEmail,
  isValidMobile,
  isValidPassword,
  normalizeEmail,
  normalizeMobile,
  normalizeText,
  setDeviceCookie,
  sha256,
} from '@/lib/auth/student-portal-auth';

export const runtime = 'nodejs';

type SignupBody = {
  email?: string;
  password?: string;
  mobile?: string;
  fingerprint?: string;
  termsAccepted?: boolean;
};

function badRequest(msg: string) {
  return NextResponse.json({ ok: false, msg }, { status: 400 });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SignupBody;
    const email = normalizeEmail(body?.email);
    const password = normalizeText(body?.password);
    const mobile = normalizeMobile(body?.mobile);
    const fingerprint = normalizeText(body?.fingerprint);
    const termsAccepted = body?.termsAccepted === true;

    if (!isValidEmail(email)) {
      return badRequest('Invalid email format');
    }
    if (!isValidPassword(password)) {
      return badRequest('Password must be at least 8 characters long');
    }
    if (!isValidMobile(mobile)) {
      return badRequest('Mobile number must be exactly 10 digits');
    }
    if (!fingerprint) {
      return badRequest('Fingerprint is required');
    }
    if (!termsAccepted) {
      return badRequest('Please accept Terms & Conditions');
    }

    await connectDB();

    const existingUser = await User.findOne({
      $or: [{ email }, { mobile }],
    })
      .select('_id email mobile')
      .lean()
      .exec();

    if (existingUser?.email === email) {
      return NextResponse.json({ ok: false, msg: 'Email already registered' }, { status: 409 });
    }
    if (existingUser?.mobile === mobile) {
      return NextResponse.json({ ok: false, msg: 'Mobile already registered' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const deviceToken = generateDeviceToken();
    const now = new Date();

    await User.create({
      email,
      passwordHash,
      mobile,
      deviceTokenHash: sha256(deviceToken),
      fingerprintHash: sha256(fingerprint),
      deviceBoundAt: now,
      lastLoginAt: now,
      failedLoginAttempts: 0,
      lastFailedLoginAt: null,
      isSuspended: false,
      suspendedAt: null,
      suspendedBy: null,
      suspensionReason: null,
      termsAccepted: true,
      termsAcceptedAt: now,
      termsVersion: TERMS_VERSION,
    });

    const response = NextResponse.json({ ok: true, msg: 'Signup success' }, { status: 201 });
    setDeviceCookie(response, deviceToken);
    return response;
  } catch (error) {
    console.error('[auth/signup] Error:', error);
    if (typeof error === 'object' && error && 'code' in error && (error as { code?: number }).code === 11000) {
      return NextResponse.json(
        { ok: false, msg: 'User already exists with same email/mobile' },
        { status: 409 }
      );
    }
    return NextResponse.json({ ok: false, msg: 'Signup failed' }, { status: 500 });
  }
}
