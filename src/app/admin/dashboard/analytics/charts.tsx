
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ChartProps {
    pageVisitsData: { name: string; visits: number }[];
    linkClicksData: { name: string; clicks: number }[];
    dailyTotals: { date: string; pageViews: number; linkClicks: number }[];
    hourlyTotals: { hour: string; pageViews: number; linkClicks: number }[];
}

export function AnalyticsCharts({ pageVisitsData, linkClicksData, dailyTotals, hourlyTotals }: ChartProps) {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Page Visits Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Page Visits</CardTitle>
          <CardDescription>Number of visits per page.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pageVisitsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="visits" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Link Clicks Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Link Clicks</CardTitle>
          <CardDescription>Number of clicks per key link.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
              <LineChart data={linkClicksData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="clicks" stroke="hsl(var(--destructive))" strokeWidth={2} />
              </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Hourly totals */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Hourly Trend</CardTitle>
          <CardDescription>Last 24 hours of activity (UTC)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={hourlyTotals}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="pageViews" stroke="hsl(var(--primary))" strokeWidth={2} name="Page Views" />
              <Line type="monotone" dataKey="linkClicks" stroke="hsl(var(--destructive))" strokeWidth={2} name="Link Clicks" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Daily totals */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Daily Trend</CardTitle>
          <CardDescription>Visits and link clicks over time (selected range)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={dailyTotals}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="pageViews" stroke="hsl(var(--primary))" strokeWidth={2} name="Page Views" />
              <Line type="monotone" dataKey="linkClicks" stroke="hsl(var(--destructive))" strokeWidth={2} name="Link Clicks" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
