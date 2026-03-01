import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      code: 'ADMIN_ONLY_DEVICE_RESET',
      msg: 'Device reset can only be done by admin.',
    },
    { status: 403 }
  );
}
