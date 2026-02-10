'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eye, Users, MousePointerClick, BookOpen, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalyticsClientWrapper } from './analytics-client-wrapper';
import { CourseAnalyticsClient } from './course-analytics-client';

type AnalyticsData = {
  pageViews: Record<string, number>;
  linkClicks: Record<string, number>;
  dailyTotals?: { date: string; pageViews: number; linkClicks: number }[];
  hourlyTotals?: { hour: string; pageViews: number; linkClicks: number }[];
};

const toSafeNumber = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function AnalyticsLiveClient({ initial }: { initial: AnalyticsData }) {
  const [data, setData] = useState<AnalyticsData>(initial);
  const [range, setRange] = useState<'today' | '7d' | '30d' | 'all'>('7d');
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    setLastUpdated(Date.now());
  }, []);

  // Poll backend every 5s for live analytics
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/pages/analytics?range=${range}`, { cache: 'no-store' });
        if (!res.ok) {
          console.error('Analytics fetch failed with status', res.status);
          return;
        }
        const json = await res.json();
        if (mounted) {
          setData({
            pageViews: json.content?.pageViews || {},
            linkClicks: json.content?.linkClicks || {},
            dailyTotals: json.content?.dailyTotals || [],
            hourlyTotals: json.content?.hourlyTotals || [],
          });
          setLastUpdated(Date.now());
        }
      } catch (err) {
        console.error('Analytics poll error', err);
      }
    };
    fetchData();
    const id = setInterval(fetchData, 5000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [range]);

  const pageVisitsData = useMemo(
    () =>
      Object.entries(data.pageViews)
        .map(([name, visits]) => ({ name, visits: toSafeNumber(visits) }))
        .filter(({ visits }) => visits > 0)
        .sort((a, b) => b.visits - a.visits),
    [data.pageViews]
  );

  const linkClicksData = useMemo(
    () =>
      Object.entries(data.linkClicks)
        .map(([name, clicks]) => ({ name, clicks: toSafeNumber(clicks) }))
        .filter(({ clicks }) => clicks > 0)
        .sort((a, b) => b.clicks - a.clicks),
    [data.linkClicks]
  );

  const totalVisits = pageVisitsData.reduce((acc, curr) => acc + curr.visits, 0);
  const uniquePageCount = pageVisitsData.length;
  const totalLinkClicks = linkClicksData.reduce((acc, curr) => acc + curr.clicks, 0);
  const topPages = pageVisitsData.slice(0, 5);
  const topLinks = linkClicksData.slice(0, 5);
  const dailyTotals = data.dailyTotals || [];
  const hourlyTotals = data.hourlyTotals || [];

  return (
    <div className="space-y-8">
      {/* Website Analytics Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold md:text-2xl">Analytics Dashboard</h1>
            <p className="text-sm text-muted-foreground">Live realtime metrics for your platform</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <div className="flex gap-1">
              {(['today','7d','30d','all'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setRange(opt)}
                  className={`px-3 py-1 rounded-full border text-xs transition ${
                    range === opt
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-muted-foreground/20 hover:border-primary/50'
                  }`}
                >
                  {opt === 'all' ? 'All time' : opt === '7d' ? '7 days' : opt === '30d' ? '30 days' : 'Today'}
                </button>
              ))}
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
            {hydrated && lastUpdated && (
              <span className="text-muted-foreground">
                Updated {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </div>
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
          dailyTotals={dailyTotals}
          hourlyTotals={hourlyTotals}
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

      {/* Top Pages / Links quick glance */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/70 bg-card/70">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Top Pages (last poll)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topPages.length === 0 && (
              <div className="text-sm text-muted-foreground">No page visits yet.</div>
            )}
            {topPages.map((p) => (
              <div key={p.name} className="flex items-center justify-between text-sm">
                <span className="truncate max-w-[220px]">{p.name}</span>
                <span className="font-semibold">{p.visits}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/70">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MousePointerClick className="h-4 w-4" />
              Top Links (last poll)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topLinks.length === 0 && (
              <div className="text-sm text-muted-foreground">No link clicks yet.</div>
            )}
            {topLinks.map((l) => (
              <div key={l.name} className="flex items-center justify-between text-sm">
                <span className="truncate max-w-[220px]">{l.name}</span>
                <span className="font-semibold">{l.clicks}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
