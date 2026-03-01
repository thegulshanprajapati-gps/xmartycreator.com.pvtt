import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { buildTestAppUrl, resolveTestAppBaseUrl } from '@/lib/subdomain-links';
import { getMongoDbName } from '@/lib/student-management';
import { getAuthenticatedStudentUser } from '@/lib/student-session';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Student Courses',
  description: 'Courses and tests you enrolled in.',
};

type EnrolledCourse = {
  id: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  enrollClicks: number;
  lastEnrolledAt: Date | null;
  contentType: 'course' | 'test';
};

function asDate(value: unknown) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

async function getEnrolledCourses(email: string): Promise<EnrolledCourse[]> {
  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  const rows = await db
    .collection('student_activities')
    .aggregate([
      {
        $match: {
          studentEmail: email,
          activityType: 'course_enroll_click',
        },
      },
      {
        $group: {
          _id: {
            courseId: '$courseId',
            courseSlug: '$courseSlug',
            courseTitle: '$courseTitle',
          },
          enrollClicks: { $sum: 1 },
          lastEnrolledAt: { $max: '$createdAt' },
        },
      },
      { $sort: { lastEnrolledAt: -1 } },
    ])
    .toArray();

  const rowList = rows as any[];
  const courseObjectIds = rowList
    .map((item) =>
      typeof item?._id?.courseId === 'string' &&
      ObjectId.isValid(item._id.courseId)
        ? new ObjectId(item._id.courseId)
        : null
    )
    .filter((value): value is ObjectId => Boolean(value));

  const courseDocs =
    courseObjectIds.length > 0
      ? await db
          .collection('courses')
          .find({ _id: { $in: courseObjectIds } })
          .project({ _id: 1, slug: 1, title: 1, contentType: 1 })
          .toArray()
      : [];

  const courseById = new Map(
    (courseDocs as any[]).map((doc) => [String(doc?._id || ''), doc])
  );

  return rowList.map((item, index) => {
    const courseId =
      typeof item?._id?.courseId === 'string' ? item._id.courseId : '';
    const courseDoc = courseById.get(courseId);
    const rowSlug =
      typeof item?._id?.courseSlug === 'string' ? item._id.courseSlug : '';
    const rowTitle =
      typeof item?._id?.courseTitle === 'string' ? item._id.courseTitle : '';
    const docSlug = typeof courseDoc?.slug === 'string' ? courseDoc.slug : '';
    const docTitle = typeof courseDoc?.title === 'string' ? courseDoc.title : '';
    const rawType = courseDoc?.contentType;
    const contentType: 'course' | 'test' = rawType === 'test' ? 'test' : 'course';

    return {
      id: courseId || `${rowSlug || 'course'}-${index}`,
      courseId,
      courseSlug: rowSlug || docSlug,
      courseTitle: (rowTitle || docTitle || 'Course').trim(),
      enrollClicks: Number.isFinite(Number(item?.enrollClicks))
        ? Number(item.enrollClicks)
        : 0,
      lastEnrolledAt: asDate(item?.lastEnrolledAt),
      contentType,
    };
  });
}

export default async function StudentCoursesPage() {
  const student = await getAuthenticatedStudentUser();
  const email = student?.email || '';

  if (!email) {
    redirect('/login?callbackUrl=%2Fstudent%2Fcourses');
  }

  const enrolledCourses = await getEnrolledCourses(email);
  const courseRows = enrolledCourses.filter((item) => item.contentType === 'course');
  const testRows = enrolledCourses.filter((item) => item.contentType === 'test');
  const host = (await headers()).get('host') || '';
  const testStoreUrl = buildTestAppUrl(
    '/student/courses-enrolled',
    resolveTestAppBaseUrl(host)
  );

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8 md:py-10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Courses / Tests You Enrolled</h1>
          <p className="text-sm text-muted-foreground">
            Your enrolled courses and test interactions from the portal.
          </p>
          <div className="mt-3">
            <Button asChild size="sm">
              <Link href={testStoreUrl}>Go to Test Store</Link>
            </Button>
            <p className="mt-1 text-xs text-muted-foreground">
              This opens the test subdomain and requires student login.
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-border/70 bg-background/70 px-4 py-3 text-sm">
          <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
            Student Profile
          </p>
          <p className="font-semibold">{student?.name || email}</p>
          <p className="text-xs text-muted-foreground">{email}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Enrolled Courses</CardTitle>
          <CardDescription>
            Based on your latest enroll actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {courseRows.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                No enrolled courses found yet.
              </p>
              <Button asChild size="sm">
                <Link href="/courses">Browse Courses</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Enroll Clicks</TableHead>
                    <TableHead>Last Enrolled</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courseRows.map((course) => {
                    const href = course.courseSlug
                      ? `/courses/${course.courseSlug}`
                      : '/courses';
                    return (
                      <TableRow key={course.id}>
                        <TableCell>
                          <p className="font-medium">{course.courseTitle}</p>
                          {course.courseSlug ? (
                            <p className="text-xs text-muted-foreground">
                              /courses/{course.courseSlug}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{course.enrollClicks}</Badge>
                        </TableCell>
                        <TableCell>
                          {course.lastEnrolledAt
                            ? formatDistanceToNow(course.lastEnrolledAt, {
                                addSuffix: true,
                              })
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Button asChild size="sm" variant="outline">
                            <Link href={href}>Open Course</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Enrolled Tests</CardTitle>
          <CardDescription>
            Tests where you have enroll interaction.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {testRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No enrolled tests found yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test</TableHead>
                    <TableHead>Enroll Clicks</TableHead>
                    <TableHead>Last Enrolled</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testRows.map((test) => {
                    return (
                      <TableRow key={test.id}>
                        <TableCell>
                          <p className="font-medium">{test.courseTitle}</p>
                          {test.courseSlug ? (
                            <p className="text-xs text-muted-foreground">
                              /courses/{test.courseSlug}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{test.enrollClicks}</Badge>
                        </TableCell>
                        <TableCell>
                          {test.lastEnrolledAt
                            ? formatDistanceToNow(test.lastEnrolledAt, {
                                addSuffix: true,
                              })
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Button asChild size="sm" variant="outline">
                            <Link href={testStoreUrl}>Go to Test Store</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
