
'use server';

import { revalidatePath } from 'next/cache';

// A simple lock mechanism to prevent race conditions.
let isWriting = false;

async function readAnalyticsData() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
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
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
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
    if (pathname.startsWith('/admin')) {
        // Do not track admin page views
        return;
    }

  const data = await readAnalyticsData();
  
  data.pageViews[pathname] = (data.pageViews[pathname] || 0) + 1;
  
  await writeAnalyticsData(data);

  revalidatePath('/admin/dashboard/analytics');
}

export async function trackLinkClick(linkName: string) {
  const data = await readAnalyticsData();
  
  data.linkClicks[linkName] = (data.linkClicks[linkName] || 0) + 1;

  await writeAnalyticsData(data);

  revalidatePath('/admin/dashboard/analytics');
}
