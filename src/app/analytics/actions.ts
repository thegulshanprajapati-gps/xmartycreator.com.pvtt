
'use server';

import { revalidatePath } from 'next/cache';

// A simple lock mechanism to prevent race conditions.
let isWriting = false;

const resolveBaseUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:9002');

async function readAnalyticsData() {
  try {
    const baseUrl = resolveBaseUrl();
    const res = await fetch(`${baseUrl}/api/pages/analytics`, {
      cache: 'no-store',
    });
    if (!res.ok) return { pageViews: {}, linkClicks: {} };
    const data = await res.json();
    return data.content || { pageViews: {}, linkClicks: {} };
  } catch (error) {
    console.error("Error reading analytics data:", error);
    return { pageViews: {}, linkClicks: {} };
  }
}

async function writeAnalyticsData(data: any) {
  if (isWriting) {
    return;
  }
  
  isWriting = true;
  try {
    const baseUrl = resolveBaseUrl();
    const res = await fetch(`${baseUrl}/api/pages/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: 'analytics', content: data }),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to save analytics');
  } catch (error) {
    console.error("Error writing analytics data:", error);
  } finally {
    isWriting = false;
  }
}

export async function trackPageView(pathname: string) {
    // if (pathname.startsWith('/admin')) {
    //     // Do not track admin page views
    //     return;
    // }

  const baseUrl = resolveBaseUrl();
  try {
    await fetch(`${baseUrl}/api/pages/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ type: 'pageview', pathname }),
    });
  } catch (error) {
    console.error("Error tracking page view:", error);
  }

  revalidatePath('/admin/dashboard/analytics');
}

export async function trackLinkClick(linkName: string) {
  const baseUrl = resolveBaseUrl();
  try {
    await fetch(`${baseUrl}/api/pages/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ type: 'link', linkName }),
    });
  } catch (error) {
    console.error("Error tracking link click:", error);
  }

  revalidatePath('/admin/dashboard/analytics');
}
