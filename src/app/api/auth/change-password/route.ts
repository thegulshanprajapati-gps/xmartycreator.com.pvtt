import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db-connection';
import User from '@/lib/models/user';
import {
  hashPassword,
  isValidEmail,
  isValidMobile,
  isValidPassword,
  normalizeEmail,
  normalizeMobile,
  normalizeText,
  verifyPassword,
} from '@/lib/auth/student-portal-auth';

export const runtime = 'nodejs';

type ChangePasswordBody = {
  email?: string;
  mobile?: string;
  currentPassword?: string;
  newPassword?: string;
};

function badRequest(msg: string) {
  return NextResponse.json({ ok: false, msg }, { status: 400 });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChangePasswordBody;
    const email = normalizeEmail(body?.email);
    const mobile = normalizeMobile(body?.mobile);
    const currentPassword = normalizeText(body?.currentPassword);
    const newPassword = normalizeText(body?.newPassword);

    if (!isValidEmail(email)) {
      return badRequest('Invalid email format');
    }
    if (!isValidMobile(mobile)) {
      return badRequest('Mobile number must be exactly 10 digits');
    }
    if (!isValidPassword(currentPassword)) {
      return badRequest('Current password must be at least 8 characters long');
    }
    if (!isValidPassword(newPassword)) {
      return badRequest('New password must be at least 8 characters long');
    }
    if (currentPassword === newPassword) {
      return badRequest('New password must be different from current password');
    }

    await connectDB();

    const user = await User.findOne({ email }).exec();
    if (!user) {
      return NextResponse.json({ ok: false, msg: 'Invalid credentials' }, { status: 401 });
    }
    if (user.mobile !== mobile) {
      return NextResponse.json({ ok: false, msg: 'Invalid credentials' }, { status: 401 });
    }

    const currentPasswordValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!currentPasswordValid) {
      return NextResponse.json({ ok: false, msg: 'Invalid credentials' }, { status: 401 });
    }

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    return NextResponse.json({ ok: true, msg: 'Password updated successfully' });
  } catch (error) {
    console.error('[auth/change-password] Error:', error);
    return NextResponse.json({ ok: false, msg: 'Password update failed' }, { status: 500 });
  }
}

