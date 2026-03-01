import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db-connection';
import User from '@/lib/models/user';
import {
  isValidEmail,
  isValidMobile,
  isValidPassword,
  normalizeEmail,
  normalizeMobile,
  normalizeText,
  verifyPassword,
} from '@/lib/auth/student-portal-auth';
import clientPromise from '@/lib/mongodb';
import { getMongoDbName } from '@/lib/student-management';

export const runtime = 'nodejs';

type DeviceResetRequestBody = {
  email?: string;
  mobile?: string;
  password?: string;
  reason?: string;
};

function badRequest(msg: string) {
  return NextResponse.json({ ok: false, msg }, { status: 400 });
}

function unauthorized(msg = 'Invalid credentials') {
  return NextResponse.json({ ok: false, msg }, { status: 401 });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as DeviceResetRequestBody;
    const email = normalizeEmail(body?.email);
    const mobile = normalizeMobile(body?.mobile);
    const password = normalizeText(body?.password);
    const reasonRaw = normalizeText(body?.reason);
    const reason = reasonRaw.length > 400 ? reasonRaw.slice(0, 400) : reasonRaw;

    if (!isValidEmail(email)) {
      return badRequest('Invalid email format');
    }
    if (!isValidMobile(mobile)) {
      return badRequest('Mobile number must be exactly 10 digits');
    }
    if (!isValidPassword(password)) {
      return badRequest('Password must be at least 8 characters long');
    }

    await connectDB();

    const user = await User.findOne({ email }).exec();
    if (!user) {
      return unauthorized('Invalid email or password');
    }
    if (user.mobile !== mobile) {
      return unauthorized('Invalid email or mobile');
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      return unauthorized('Invalid email or password');
    }

    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const now = new Date();

    const existingPending = await db.collection('device_reset_requests').findOne({
      studentEmail: email,
      status: 'pending',
    });

    if (existingPending) {
      return NextResponse.json({
        ok: true,
        alreadyPending: true,
        msg: 'Device reset request already pending admin approval.',
      });
    }

    await db.collection('device_reset_requests').insertOne({
      studentEmail: email,
      mobile,
      reason: reason || 'Device mismatch during login',
      status: 'pending',
      requestedAt: now,
      reviewedAt: null,
      reviewedBy: '',
      reviewNote: '',
      source: 'student-login',
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      ok: true,
      msg: 'Device reset request sent to admin for approval.',
    });
  } catch (error) {
    console.error('[auth/device-reset-request] Error:', error);
    return NextResponse.json(
      { ok: false, msg: 'Failed to submit reset request' },
      { status: 500 }
    );
  }
}
