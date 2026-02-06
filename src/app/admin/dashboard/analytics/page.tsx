import type { Metadata } from 'next';
import AnalyticsLiveClient from './analytics-live-client';
import { resolveBaseUrl } from '@/lib/analytics-tracker';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Analytics',
};

async function getAnalyticsData() {
  try {
    const baseUrl = resolveBaseUrl();

    const res = await fetch(`${baseUrl}/api/pages/analytics`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch analytics');
    const data = await res.json();
    return {
        pageViews: data.content?.pageViews || {},
        linkClicks: data.content?.linkClicks || {},
        dailyTotals: data.content?.dailyTotals || [],
        hourlyTotals: data.content?.hourlyTotals || [],
    }
  } catch (error) {
    console.error("Failed to read analytics data:", error);
    return { pageViews: {}, linkClicks: {}, dailyTotals: [], hourlyTotals: [] };
  }
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();
  return <AnalyticsLiveClient initial={data} />;
}
