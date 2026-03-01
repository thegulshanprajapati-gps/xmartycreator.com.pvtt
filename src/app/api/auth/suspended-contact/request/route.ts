import { NextRequest, NextResponse } from 'next/server';
import {
  normalizeText,
  sha256,
} from '@/lib/auth/student-portal-auth';
import { verifySuspendedContactAccess } from '@/lib/auth/suspended-contact';
import clientPromise from '@/lib/mongodb';
import { getMongoDbName } from '@/lib/student-management';

export const runtime = 'nodejs';

type SuspendedContactRequestBody = {
  token?: string;
  fingerprint?: string;
  reason?: string;
};

function cleanReason(value: unknown, max = 400) {
  const text = normalizeText(value);
  return text.length <= max ? text : text.slice(0, max);
}

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SuspendedContactRequestBody;
    const token = normalizeText(body?.token);
    const fingerprint = normalizeText(body?.fingerprint);
    const reason = cleanReason(body?.reason);

    const accessResult = await verifySuspendedContactAccess(request, token, fingerprint);
    if (!accessResult.ok) {
      return NextResponse.json(
        {
          ok: false,
          code: accessResult.code,
          msg: accessResult.msg,
        },
        { status: accessResult.status }
      );
    }

    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const now = new Date();

    const existingPending = await db.collection('device_reset_requests').findOne(
      {
        studentEmail: accessResult.email,
        status: 'pending',
      },
      { projection: { _id: 1 } }
    );

    if (existingPending) {
      return NextResponse.json({
        ok: true,
        alreadyPending: true,
        msg: 'Your request is already pending admin approval.',
      });
    }

    await db.collection('device_reset_requests').insertOne({
      studentEmail: accessResult.email,
      mobile: accessResult.mobile,
      reason: reason || 'Suspended account access request',
      status: 'pending',
      requestedAt: now,
      reviewedAt: null,
      reviewedBy: '',
      reviewNote: '',
      source: 'suspended-contact-link',
      createdAt: now,
      updatedAt: now,
      security: {
        requestIp: getClientIp(request),
        userAgent: normalizeText(request.headers.get('user-agent') || '').slice(0, 300),
      },
    });

    await db.collection('suspended_contact_links').updateOne(
      { tokenHash: sha256(token) },
      {
        $set: {
          requestSubmittedAt: now,
          updatedAt: now,
        },
      }
    );

    return NextResponse.json({
      ok: true,
      msg: 'Request sent. Admin will review and approve device reset/unsuspend.',
    });
  } catch (error) {
    console.error('[auth/suspended-contact/request] Error:', error);
    return NextResponse.json(
      {
        ok: false,
        msg: 'Failed to send request to admin.',
      },
      { status: 500 }
    );
  }
}