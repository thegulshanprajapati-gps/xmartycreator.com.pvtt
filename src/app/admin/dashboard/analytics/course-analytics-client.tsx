'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Share2, MousePointerClick, TrendingUp, Eye } from 'lucide-react';

interface CourseMetric {
  _id: string;
  title: string;
  slug: string;
  enrollClickCount: number;
  shareCount: number;
  viewsCount: number;
}

interface CourseAnalyticsData {
  totalCourses: number;
  totalEnrollClicks: number;
  totalShares: number;
  totalViewsCount: number;
  conversionRate: string;
  courses: CourseMetric[];
}

export function CourseAnalyticsClient() {
  const [analytics, setAnalytics] = useState<CourseAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCourseAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics/courses');
      if (!response.ok) throw new Error('Failed to fetch course analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching course analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseAnalytics();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchCourseAnalytics, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading || !analytics) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-300">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-200">{analytics.totalCourses}</div>
            <p className="text-xs text-blue-700 dark:text-blue-400">Active courses</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-300">Enroll Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-200">{(analytics?.totalEnrollClicks || 0).toLocaleString()}</div>
            <p className="text-xs text-purple-700 dark:text-purple-400">Total clicks</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-950/30 dark:to-pink-900/20 border-pink-200 dark:border-pink-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-pink-900 dark:text-pink-300">Shares</CardTitle>
            <Share2 className="h-4 w-4 text-pink-600 dark:text-pink-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-900 dark:text-pink-200">{(analytics?.totalShares || 0).toLocaleString()}</div>
            <p className="text-xs text-pink-700 dark:text-pink-400">Total shares</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900 dark:text-green-300">Conv. Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-200">{analytics.conversionRate}</div>
            <p className="text-xs text-green-700 dark:text-green-400">Enroll/Share ratio</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-950/30 dark:to-cyan-900/20 border-cyan-200 dark:border-cyan-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-cyan-900 dark:text-cyan-300">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-900 dark:text-cyan-200">{(analytics?.totalViewsCount || 0).toLocaleString()}</div>
            <p className="text-xs text-cyan-700 dark:text-cyan-400">Course page views</p>
          </CardContent>
        </Card>
      </div>

      {/* Courses Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Course Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Course</th>
                  <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Enroll Clicks</th>
                  <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Shares</th>
                  <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Views</th>
                  <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Conv. Rate</th>
                </tr>
              </thead>
              <tbody>
                {analytics.courses.map((course) => {
                  const convRate =
                    course.viewsCount > 0
                      ? ((course.enrollClickCount / course.viewsCount) * 100).toFixed(1)
                      : '0.0';
                  return (
                    <tr
                      key={course._id}
                      className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <p className="font-medium">{course.title}</p>
                          <p className="text-xs text-muted-foreground">/{course.slug}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-semibold text-purple-600 dark:text-purple-400">
                          {course.enrollClickCount.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-semibold text-pink-600 dark:text-pink-400">
                          {course.shareCount.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-muted-foreground">{course.viewsCount.toLocaleString()}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-semibold text-green-600 dark:text-green-400">{convRate}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {analytics.courses.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No courses found. Create a course to start tracking analytics.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
