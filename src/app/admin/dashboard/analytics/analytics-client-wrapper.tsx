'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Share2, MousePointerClick, BookOpen, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const AnalyticsCharts = dynamic(() => import('./charts').then(mod => mod.AnalyticsCharts), {
  ssr: false,
  loading: () => (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Page Visits</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Link Clicks</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    </div>
  ),
});

interface AnalyticsClientWrapperProps {
  pageVisitsData: { name: string; visits: number }[];
  linkClicksData: { name: string; clicks: number }[];
}

interface CourseMetric {
  _id: string;
  title: string;
  slug: string;
  shareCount: number;
  enrollClickCount: number;
  viewsCount: number;
}

interface AnalyticsSummary {
  totalCourses: number;
  totalEnrollClicks: number;
  totalShares: number;
  mostPopularCourse: CourseMetric | null;
  conversionRate: string | number;
}

export function AnalyticsClientWrapper({ pageVisitsData, linkClicksData }: AnalyticsClientWrapperProps) {
  const [courseAnalytics, setCourseAnalytics] = useState<AnalyticsSummary | null>(null);
  const [courses, setCourses] = useState<CourseMetric[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const fetchCourseAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics/courses');
      if (res.ok) {
        const data = await res.json();
        setCourseAnalytics(data.summary);
        setCourses(data.courses);
      }
    } catch (error) {
      console.error('Error fetching course analytics:', error);
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  useEffect(() => {
    fetchCourseAnalytics();
    const interval = setInterval(fetchCourseAnalytics, 5000);
    return () => clearInterval(interval);
  }, [fetchCourseAnalytics]);

  return (
    <div className="space-y-8">
      {/* Page Analytics */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Website Analytics</h2>
        <AnalyticsCharts pageVisitsData={pageVisitsData} linkClicksData={linkClicksData} />
      </div>

      {/* Course Analytics */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Course Analytics</h2>
          {!loadingCourses && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30">
              <Activity className="h-3 w-3 text-green-500 animate-pulse" />
              <span className="text-xs text-green-600 font-medium">Live • Updates every 5s</span>
            </div>
          )}
        </div>

        {loadingCourses ? (
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Course Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
                <Card className="backdrop-blur-md bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                    <BookOpen className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{courseAnalytics?.totalCourses || 0}</div>
                    <p className="text-xs text-muted-foreground">Active courses</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="backdrop-blur-md bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Enroll Clicks</CardTitle>
                    <MousePointerClick className="h-4 w-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{courseAnalytics?.totalEnrollClicks || 0}</div>
                    <p className="text-xs text-muted-foreground">Total clicks</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="backdrop-blur-md bg-gradient-to-br from-pink-500/10 to-pink-600/5 border-pink-500/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Shares</CardTitle>
                    <Share2 className="h-4 w-4 text-pink-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{courseAnalytics?.totalShares || 0}</div>
                    <p className="text-xs text-muted-foreground">Total shares</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="backdrop-blur-md bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conv. Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{courseAnalytics?.conversionRate}%</div>
                    <p className="text-xs text-muted-foreground">Enroll/Share ratio</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Course Performance Breakdown */}
            {courses.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="backdrop-blur-md bg-gradient-to-br from-slate-800/30 to-slate-900/30 border-slate-700/50">
                  <CardHeader>
                    <CardTitle>Course Performance Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {courses.map((course, index) => (
                        <div key={course._id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/40 hover:bg-slate-900/60 transition-colors">
                          <div className="flex items-center gap-3 flex-1">
                            <Badge variant="outline" className="text-xs">{index + 1}</Badge>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{course.title}</p>
                              <p className="text-xs text-muted-foreground">/{course.slug}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 text-sm font-medium">
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Enrolls</p>
                              <p>{course.enrollClickCount}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Shares</p>
                              <p>{course.shareCount}</p>
                            </div>
                            <div className="text-right w-16">
                              <p className="text-xs text-muted-foreground">Rate</p>
                              <p className="text-green-400">
                                {course.shareCount > 0 
                                  ? ((course.enrollClickCount / course.shareCount) * 100).toFixed(0)
                                  : 0}%
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
