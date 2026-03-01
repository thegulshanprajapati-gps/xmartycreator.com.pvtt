import { NextRequest, NextResponse } from 'next/server';
import { createTimeLimitedCheckoutLink, normalizeCourseSlug } from '@/lib/checkout-link';

type CheckoutLinkRequestBody = {
  courseSlug?: unknown;
  slug?: unknown;
  source?: unknown;
  ref?: unknown;
};

const normalizeText = (value: unknown, maxLength = 120): string =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as CheckoutLinkRequestBody | null;
    const requestedSlug = normalizeCourseSlug(body?.courseSlug ?? body?.slug);

    if (!requestedSlug) {
      return NextResponse.json(
        { error: 'Valid "courseSlug" is required.' },
        { status: 400 }
      );
    }

    const source = normalizeText(body?.source) || 'course-preview';
    const reference = normalizeText(body?.ref);
    const link = createTimeLimitedCheckoutLink({
      courseSlug: requestedSlug,
      hostname: request.nextUrl.hostname,
      source,
      reference,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: link.url,
      courseSlug: link.courseSlug,
      expiresAt: link.expiresAt,
      expiresInSeconds: link.expiresInSeconds,
      baseUrl: link.baseUrl,
      signatureAttached: Boolean(link.signature),
      version: link.version,
    });
  } catch (error) {
    console.error('Error creating checkout link:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to create checkout link';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
