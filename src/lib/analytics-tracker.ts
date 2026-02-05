/**
 * Lightweight page-view/link-click tracker that can run in both
 * Edge (middleware) and Node runtimes without importing server actions.
 * It forwards an increment request to the existing `/api/pages/analytics`
 * endpoint which persists counts in MongoDB.
 */
const resolveBaseUrl = (origin?: string) => {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    origin ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:9002')
  );
};

type TrackKind = 'pageview' | 'link';

async function sendIncrement(kind: TrackKind, name: string, origin?: string) {
  // Guard against empty or server/asset paths
  if (!name || name.startsWith('/_next') || name.startsWith('/api')) return;

  const baseUrl = resolveBaseUrl(origin);
  try {
    await fetch(`${baseUrl}/api/pages/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify(
        kind === 'pageview'
          ? { type: 'pageview', pathname: name }
          : { type: 'link', linkName: name }
      ),
    });
  } catch (err) {
    // swallow errors to avoid breaking the response pipeline
    console.error('[analytics-tracker] failed to send increment', err);
  }
}

export async function trackPageView(pathname: string, origin?: string) {
  await sendIncrement('pageview', pathname, origin);
}

export async function trackLinkClick(linkName: string, origin?: string) {
  await sendIncrement('link', linkName, origin);
}

export { resolveBaseUrl };
