import { randomBytes } from 'crypto';
import type { NextRequest } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getMongoDbName, normalizeStudentEmail } from '@/lib/student-management';
import {
  DEVICE_COOKIE_NAME,
  normalizeMobile,
  normalizeText,
  sha256,
} from './student-portal-auth';

const SUSPENDED_LINK_TTL_MS = 5 * 60 * 1000;
const SUSPENDED_LINK_COLLECTION = 'suspended_contact_links';

type CreateSuspendedContactLinkInput = {
  email: string;
  mobile: string;
  deviceTokenHash: string | null;
  fingerprintHash: string | null;
  request: NextRequest;
};

export type SuspendedContactVerificationFailureCode =
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  | 'DEVICE_NOT_ALLOWED'
  | 'ACCOUNT_NOT_SUSPENDED';

export type SuspendedContactVerificationResult =
  | {
      ok: true;
      email: string;
      mobile: string;
      expiresAt: string;
      remainingSeconds: number;
      pendingRequest: boolean;
    }
  | {
      ok: false;
      status: number;
      code: SuspendedContactVerificationFailureCode;
      msg: string;
    };

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

function safeUserAgent(request: NextRequest) {
  const value = normalizeText(request.headers.get('user-agent') || '');
  return value.length <= 300 ? value : value.slice(0, 300);
}

function asDate(value: unknown) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function createSuspendedContactLink(
  input: CreateSuspendedContactLinkInput
) {
  const email = normalizeStudentEmail(input.email);
  const mobile = normalizeMobile(input.mobile);

  const token = randomBytes(32).toString('hex');
  const tokenHash = sha256(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SUSPENDED_LINK_TTL_MS);

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  const links = db.collection(SUSPENDED_LINK_COLLECTION);

  await links.updateMany(
    {
      studentEmail: email,
      revokedAt: null,
      expiresAt: { $gt: now },
    },
    {
      $set: {
        revokedAt: now,
        revokedReason: 'ROTATED',
        updatedAt: now,
      },
    }
  );

  await links.insertOne({
    studentEmail: email,
    mobile,
    tokenHash,
    deviceTokenHash:
      typeof input.deviceTokenHash === 'string' && input.deviceTokenHash
        ? input.deviceTokenHash
        : null,
    fingerprintHash:
      typeof input.fingerprintHash === 'string' && input.fingerprintHash
        ? input.fingerprintHash
        : null,
    createdAt: now,
    updatedAt: now,
    expiresAt,
    revokedAt: null,
    revokedReason: '',
    lastVerifiedAt: null,
    createdFromIp: getClientIp(input.request),
    createdFromUserAgent: safeUserAgent(input.request),
  });

  return {
    token,
    expiresAt,
  };
}

export async function verifySuspendedContactAccess(
  request: NextRequest,
  tokenRaw: unknown,
  fingerprintRaw: unknown
): Promise<SuspendedContactVerificationResult> {
  const token = normalizeText(tokenRaw);
  const fingerprint = normalizeText(fingerprintRaw);

  if (!token || token.length < 32) {
    return {
      ok: false,
      status: 400,
      code: 'INVALID_TOKEN',
      msg: 'Invalid secure link.',
    };
  }

  if (!fingerprint) {
    return {
      ok: false,
      status: 400,
      code: 'DEVICE_NOT_ALLOWED',
      msg: 'Device fingerprint is required.',
    };
  }

  const now = new Date();
  const tokenHash = sha256(token);

  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  const links = db.collection(SUSPENDED_LINK_COLLECTION);
  const linkDoc = (await links.findOne({ tokenHash })) as any;

  if (!linkDoc) {
    return {
      ok: false,
      status: 404,
      code: 'INVALID_TOKEN',
      msg: 'Secure link is invalid.',
    };
  }

  if (linkDoc.revokedAt) {
    return {
      ok: false,
      status: 403,
      code: 'INVALID_TOKEN',
      msg: 'Secure link is no longer valid.',
    };
  }

  const expiresAt = asDate(linkDoc.expiresAt);
  if (!expiresAt || expiresAt.getTime() <= now.getTime()) {
    return {
      ok: false,
      status: 403,
      code: 'TOKEN_EXPIRED',
      msg: 'Secure link expired. Please login again.',
    };
  }

  const email = normalizeStudentEmail(linkDoc.studentEmail);
  if (!email) {
    return {
      ok: false,
      status: 403,
      code: 'INVALID_TOKEN',
      msg: 'Secure link is invalid.',
    };
  }

  const user = (await db.collection('users').findOne(
    { email },
    {
      projection: {
        email: 1,
        mobile: 1,
        isSuspended: 1,
        deviceTokenHash: 1,
        fingerprintHash: 1,
      },
    }
  )) as any;

  if (!user?.isSuspended) {
    return {
      ok: false,
      status: 403,
      code: 'ACCOUNT_NOT_SUSPENDED',
      msg: 'Account is not suspended anymore. Login again.',
    };
  }

  const incomingCookieToken = request.cookies.get(DEVICE_COOKIE_NAME)?.value || '';
  const incomingCookieHash = incomingCookieToken ? sha256(incomingCookieToken) : '';
  const incomingFingerprintHash = sha256(fingerprint);

  const expectedCookieHash =
    typeof linkDoc.deviceTokenHash === 'string' && linkDoc.deviceTokenHash
      ? linkDoc.deviceTokenHash
      : typeof user.deviceTokenHash === 'string' && user.deviceTokenHash
      ? user.deviceTokenHash
      : '';

  const expectedFingerprintHash =
    typeof linkDoc.fingerprintHash === 'string' && linkDoc.fingerprintHash
      ? linkDoc.fingerprintHash
      : typeof user.fingerprintHash === 'string' && user.fingerprintHash
      ? user.fingerprintHash
      : '';

  const cookieMatches = Boolean(expectedCookieHash) && incomingCookieHash === expectedCookieHash;
  const fingerprintMatches =
    Boolean(expectedFingerprintHash) && incomingFingerprintHash === expectedFingerprintHash;

  if (!cookieMatches && !fingerprintMatches) {
    return {
      ok: false,
      status: 403,
      code: 'DEVICE_NOT_ALLOWED',
      msg: 'This link works only on your previously bound device.',
    };
  }

  const pendingRequest = Boolean(
    await db.collection('device_reset_requests').findOne(
      {
        studentEmail: email,
        status: 'pending',
      },
      { projection: { _id: 1 } }
    )
  );

  await links.updateOne(
    { _id: linkDoc._id },
    {
      $set: {
        updatedAt: now,
        lastVerifiedAt: now,
        lastVerifiedIp: getClientIp(request),
      },
    }
  );

  return {
    ok: true,
    email,
    mobile:
      normalizeMobile(linkDoc.mobile) ||
      normalizeMobile(user.mobile) ||
      '',
    expiresAt: expiresAt.toISOString(),
    remainingSeconds: Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / 1000)),
    pendingRequest,
  };
}

export function getSuspendedContactTtlSeconds() {
  return Math.floor(SUSPENDED_LINK_TTL_MS / 1000);
}