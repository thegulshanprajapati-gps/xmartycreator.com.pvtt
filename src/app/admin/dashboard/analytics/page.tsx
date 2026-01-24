import type { Metadata } from 'next';
import { Eye, Users, MousePointerClick, BookOpen, Share2, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalyticsClientWrapper } from './analytics-client-wrapper';
import { CourseAnalyticsClient } from './course-analytics-client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Analytics',
};

async function getAnalyticsData() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/pages/analytics`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch analytics');
    const data = await res.json();
    return {
        pageViews: data.content?.pageViews || {},
        linkClicks: data.content?.linkClicks || {}
    }
  } catch (error) {
    console.error("Failed to read analytics data:", error);
    return { pageViews: {}, linkClicks: {} };
  }
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();
  
  const pageVisitsData = Object.entries(data.pageViews)
    .map(([name, visits]) => ({ name, visits: visits as number }))
    .sort((a, b) => b.visits - a.visits);

  const linkClicksData = Object.entries(data.linkClicks)
    .map(([name, clicks]) => ({ name, clicks: clicks as number }))
    .sort((a, b) => b.clicks - a.clicks);

  const totalVisits = pageVisitsData.reduce((acc, curr) => acc + curr.visits, 0);
  const uniquePageCount = pageVisitsData.length;
  const totalLinkClicks = linkClicksData.reduce((acc, curr) => acc + curr.clicks, 0);

  return (
    <>
      <div className="space-y-8">
        {/* Website Analytics Header */}
        <div>
          <h1 className="text-lg font-semibold md:text-2xl mb-4">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground">Live realtime metrics for your platform</p>
        </div>
        
        {/* Website Analytics */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Website Analytics
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Page Visits</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalVisits.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Across all pages</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Pages Visited</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{uniquePageCount.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total number of tracked pages</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Link Clicks</CardTitle>
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalLinkClicks.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Across all tracked links</p>
              </CardContent>
            </Card>
          </div>

          <AnalyticsClientWrapper
            pageVisitsData={pageVisitsData}
            linkClicksData={linkClicksData}
          />
        </div>

        {/* Course Analytics */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Course Analytics
            <span className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-700 dark:text-green-400 text-xs font-semibold animate-pulse">
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              Live
            </span>
          </h2>
          <CourseAnalyticsClient />
        </div>
      </div>
    </>
  );
}
