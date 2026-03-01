import type { Metadata } from 'next';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import clientPromise from '@/lib/mongodb';
import { getMongoDbName, normalizeStudentEmail } from '@/lib/student-management';
import StudentNotificationForm from './student-notification-form';
import {
  approveDeviceResetRequest,
  adminSetStudentPassword,
  adminUnsuspendStudent,
  rejectDeviceResetRequest,
} from './actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Students',
};

type StudentSummary = {
  email: string;
  name: string;
  image: string;
  mobile: string;
  views: number;
  shares: number;
  enrollClicks: number;
  totalInteractions: number;
  unreadNotifications: number;
  totalNotifications: number;
  lastActiveAt: Date | null;
  lastLoginAt: Date | null;
  deviceBoundAt: Date | null;
  hasAuthAccount: boolean;
  termsAccepted: boolean;
  failedLoginAttempts: number;
  isSuspended: boolean;
  suspendedAt: Date | null;
  suspensionReason: string;
};

type RecentActivity = {
  id: string;
  studentName: string;
  studentEmail: string;
  activityType: string;
  courseTitle: string;
  createdAt: Date | null;
};

type ActivityMetadata = Record<string, string | number | boolean>;

type StudentPageSummary = {
  id: string;
  courseSlug: string;
  courseTitle: string;
  views: number;
  shares: number;
  enrollClicks: number;
  total: number;
  lastActiveAt: Date | null;
};

type StudentActivityDetail = {
  id: string;
  activityType: string;
  courseTitle: string;
  courseSlug: string;
  createdAt: Date | null;
  metadata: ActivityMetadata;
};

type StudentDetail = {
  email: string;
  name: string;
  image: string;
  mobile: string;
  views: number;
  shares: number;
  enrollClicks: number;
  totalInteractions: number;
  unreadNotifications: number;
  totalNotifications: number;
  lastActiveAt: Date | null;
  lastSeenAt: Date | null;
  lastLoginAt: Date | null;
  deviceBoundAt: Date | null;
  hasAuthAccount: boolean;
  termsAccepted: boolean;
  termsAcceptedAt: Date | null;
  failedLoginAttempts: number;
  isSuspended: boolean;
  suspendedAt: Date | null;
  suspensionReason: string;
  loginCount: number;
  pages: StudentPageSummary[];
  recentActions: StudentActivityDetail[];
};

type DeviceResetRequest = {
  id: string;
  studentEmail: string;
  mobile: string;
  reason: string;
  status: string;
  requestedAt: Date | null;
};

function toDate(value: unknown) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function toNumber(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toMetadata(value: unknown): ActivityMetadata {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      ([, entryValue]) =>
        typeof entryValue === 'string' ||
        typeof entryValue === 'number' ||
        typeof entryValue === 'boolean'
    )
  ) as ActivityMetadata;
}

function formatActivityType(activityType: string) {
  if (activityType === 'course_view') return 'Course View';
  if (activityType === 'course_share') return 'Course Share';
  if (activityType === 'course_enroll_click') return 'Enroll Click';
  return 'Interaction';
}

function formatRelative(date: Date | null) {
  return date ? formatDistanceToNow(date, { addSuffix: true }) : '-';
}

function formatAbsolute(date: Date | null) {
  return date ? date.toLocaleString() : '-';
}

function readSearchParam(value?: string | string[]) {
  if (!value) return '';
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

async function getStudentDashboardData(selectedEmail?: string) {
  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  const normalizedSelectedEmail = normalizeStudentEmail(selectedEmail);
  const hasSelectedStudent = Boolean(normalizedSelectedEmail);

  const detailPromises = hasSelectedStudent
    ? [
        db.collection('students').findOne({ email: normalizedSelectedEmail }),
        db.collection('users').findOne(
          { email: normalizedSelectedEmail },
          {
            projection: {
              email: 1,
              mobile: 1,
              lastLoginAt: 1,
              deviceBoundAt: 1,
              termsAccepted: 1,
              termsAcceptedAt: 1,
              failedLoginAttempts: 1,
              isSuspended: 1,
              suspendedAt: 1,
              suspensionReason: 1,
              updatedAt: 1,
            },
          }
        ),
        db
          .collection('student_activities')
          .aggregate([
            {
              $match: {
                studentEmail: normalizedSelectedEmail,
              },
            },
            {
              $group: {
                _id: {
                  courseSlug: '$courseSlug',
                  courseTitle: '$courseTitle',
                },
                views: {
                  $sum: {
                    $cond: [{ $eq: ['$activityType', 'course_view'] }, 1, 0],
                  },
                },
                shares: {
                  $sum: {
                    $cond: [{ $eq: ['$activityType', 'course_share'] }, 1, 0],
                  },
                },
                enrollClicks: {
                  $sum: {
                    $cond: [
                      { $eq: ['$activityType', 'course_enroll_click'] },
                      1,
                      0,
                    ],
                  },
                },
                total: { $sum: 1 },
                lastActiveAt: { $max: '$createdAt' },
              },
            },
            { $sort: { total: -1, lastActiveAt: -1 } },
            { $limit: 12 },
          ])
          .toArray(),
        db
          .collection('student_activities')
          .find({ studentEmail: normalizedSelectedEmail })
          .sort({ createdAt: -1 })
          .limit(20)
          .project({
            activityType: 1,
            courseTitle: 1,
            courseSlug: 1,
            createdAt: 1,
            metadata: 1,
          })
          .toArray(),
      ]
    : [
        Promise.resolve(null),
        Promise.resolve(null),
        Promise.resolve([]),
        Promise.resolve([]),
      ];

  const [
    studentDocs,
    userDocs,
    activitySummary,
    notificationSummary,
    recentActivityDocs,
    pendingResetRequestDocs,
    selectedStudentDoc,
    selectedUserDoc,
    selectedPageSummary,
    selectedActivityDocs,
  ] = await Promise.all([
    db
      .collection('students')
      .find({ email: { $type: 'string', $ne: '' } })
      .sort({ lastActiveAt: -1, updatedAt: -1 })
      .project({ email: 1, name: 1, image: 1, lastActiveAt: 1, updatedAt: 1 })
      .toArray(),
    db
      .collection('users')
      .find({ email: { $type: 'string', $ne: '' } })
      .project({
        email: 1,
        mobile: 1,
        lastLoginAt: 1,
        deviceBoundAt: 1,
        termsAccepted: 1,
        termsAcceptedAt: 1,
        failedLoginAttempts: 1,
        isSuspended: 1,
        suspendedAt: 1,
        suspensionReason: 1,
        updatedAt: 1,
      })
      .toArray(),
    db
      .collection('student_activities')
      .aggregate([
        {
          $match: {
            studentEmail: { $type: 'string', $ne: '' },
          },
        },
        {
          $group: {
            _id: '$studentEmail',
            studentName: { $last: '$studentName' },
            studentImage: { $last: '$studentImage' },
            views: {
              $sum: {
                $cond: [{ $eq: ['$activityType', 'course_view'] }, 1, 0],
              },
            },
            shares: {
              $sum: {
                $cond: [{ $eq: ['$activityType', 'course_share'] }, 1, 0],
              },
            },
            enrollClicks: {
              $sum: {
                $cond: [{ $eq: ['$activityType', 'course_enroll_click'] }, 1, 0],
              },
            },
            totalInteractions: { $sum: 1 },
            lastActiveAt: { $max: '$createdAt' },
          },
        },
      ])
      .toArray(),
    db
      .collection('student_notifications')
      .aggregate([
        {
          $match: {
            studentEmail: { $type: 'string', $ne: '' },
          },
        },
        {
          $group: {
            _id: '$studentEmail',
            unread: {
              $sum: {
                $cond: [{ $eq: ['$isRead', false] }, 1, 0],
              },
            },
            total: { $sum: 1 },
          },
        },
      ])
      .toArray(),
    db
      .collection('student_activities')
      .find({ studentEmail: { $type: 'string', $ne: '' } })
      .sort({ createdAt: -1 })
      .limit(30)
      .project({
        studentName: 1,
        studentEmail: 1,
        activityType: 1,
        courseTitle: 1,
        createdAt: 1,
      })
      .toArray(),
    db
      .collection('device_reset_requests')
      .find({ status: 'pending' })
      .sort({ requestedAt: 1, createdAt: 1 })
      .limit(100)
      .project({
        studentEmail: 1,
        mobile: 1,
        reason: 1,
        status: 1,
        requestedAt: 1,
      })
      .toArray(),
    ...detailPromises,
  ]);

  const statsByEmail = new Map<string, Partial<StudentSummary>>();

  for (const item of activitySummary as any[]) {
    const email = normalizeStudentEmail(item?._id);
    if (!email) continue;
    statsByEmail.set(email, {
      email,
      name: typeof item.studentName === 'string' ? item.studentName : '',
      image: typeof item.studentImage === 'string' ? item.studentImage : '',
      views: toNumber(item.views),
      shares: toNumber(item.shares),
      enrollClicks: toNumber(item.enrollClicks),
      totalInteractions: toNumber(item.totalInteractions),
      lastActiveAt: toDate(item.lastActiveAt),
    });
  }

  const notificationsByEmail = new Map<
    string,
    { unreadNotifications: number; totalNotifications: number }
  >();

  for (const item of notificationSummary as any[]) {
    const email = normalizeStudentEmail(item?._id);
    if (!email) continue;
    notificationsByEmail.set(email, {
      unreadNotifications: toNumber(item.unread),
      totalNotifications: toNumber(item.total),
    });
  }

  const authByEmail = new Map<
    string,
    {
      mobile: string;
      lastLoginAt: Date | null;
      deviceBoundAt: Date | null;
      termsAccepted: boolean;
      termsAcceptedAt: Date | null;
      failedLoginAttempts: number;
      isSuspended: boolean;
      suspendedAt: Date | null;
      suspensionReason: string;
    }
  >();

  for (const user of userDocs as any[]) {
    const email = normalizeStudentEmail(user?.email);
    if (!email) continue;
    authByEmail.set(email, {
      mobile: typeof user?.mobile === 'string' ? user.mobile : '',
      lastLoginAt: toDate(user?.lastLoginAt) || toDate(user?.updatedAt),
      deviceBoundAt: toDate(user?.deviceBoundAt),
      termsAccepted: Boolean(user?.termsAccepted),
      termsAcceptedAt: toDate(user?.termsAcceptedAt),
      failedLoginAttempts: toNumber(user?.failedLoginAttempts),
      isSuspended: Boolean(user?.isSuspended),
      suspendedAt: toDate(user?.suspendedAt),
      suspensionReason:
        typeof user?.suspensionReason === 'string' ? user.suspensionReason : '',
    });
  }

  for (const student of studentDocs as any[]) {
    const email = normalizeStudentEmail(student?.email);
    if (!email) continue;

    const existing = statsByEmail.get(email) || {};
    statsByEmail.set(email, {
      email,
      name:
        typeof student.name === 'string' && student.name.trim()
          ? student.name
          : (existing.name as string) || email.split('@')[0],
      image:
        typeof student.image === 'string'
          ? student.image
          : (existing.image as string) || '',
      views: toNumber(existing.views),
      shares: toNumber(existing.shares),
      enrollClicks: toNumber(existing.enrollClicks),
      totalInteractions: toNumber(existing.totalInteractions),
      unreadNotifications: 0,
      totalNotifications: 0,
      lastActiveAt:
        toDate(student?.lastActiveAt) ||
        toDate(student?.updatedAt) ||
        toDate(existing.lastActiveAt) ||
        null,
      mobile: typeof existing.mobile === 'string' ? existing.mobile : '',
      lastLoginAt: toDate(existing.lastLoginAt),
      deviceBoundAt: toDate(existing.deviceBoundAt),
      hasAuthAccount: Boolean(existing.hasAuthAccount),
      termsAccepted: Boolean(existing.termsAccepted),
      failedLoginAttempts: toNumber(existing.failedLoginAttempts),
      isSuspended: Boolean(existing.isSuspended),
      suspendedAt: toDate(existing.suspendedAt),
      suspensionReason:
        typeof existing.suspensionReason === 'string'
          ? existing.suspensionReason
          : '',
    });
  }

  for (const [email, auth] of authByEmail.entries()) {
    const existing = statsByEmail.get(email) || {};
    statsByEmail.set(email, {
      email,
      name: (existing.name as string) || email.split('@')[0],
      image: (existing.image as string) || '',
      views: toNumber(existing.views),
      shares: toNumber(existing.shares),
      enrollClicks: toNumber(existing.enrollClicks),
      totalInteractions: toNumber(existing.totalInteractions),
      unreadNotifications: toNumber(existing.unreadNotifications),
      totalNotifications: toNumber(existing.totalNotifications),
      lastActiveAt: toDate(existing.lastActiveAt),
      mobile: auth.mobile,
      lastLoginAt: auth.lastLoginAt,
      deviceBoundAt: auth.deviceBoundAt,
      hasAuthAccount: true,
      termsAccepted: auth.termsAccepted,
      failedLoginAttempts: auth.failedLoginAttempts,
      isSuspended: auth.isSuspended,
      suspendedAt: auth.suspendedAt,
      suspensionReason: auth.suspensionReason,
    });
  }

  const students: StudentSummary[] = Array.from(statsByEmail.values()).map((item) => {
    const email = normalizeStudentEmail(item.email);
    const notifications = notificationsByEmail.get(email);
    return {
      email,
      name: item.name || email.split('@')[0] || 'Student',
      image: item.image || '',
      mobile: typeof item.mobile === 'string' ? item.mobile : '',
      views: toNumber(item.views),
      shares: toNumber(item.shares),
      enrollClicks: toNumber(item.enrollClicks),
      totalInteractions: toNumber(item.totalInteractions),
      unreadNotifications: notifications?.unreadNotifications || 0,
      totalNotifications: notifications?.totalNotifications || 0,
      lastActiveAt: toDate(item.lastActiveAt),
      lastLoginAt: toDate(item.lastLoginAt),
      deviceBoundAt: toDate(item.deviceBoundAt),
      hasAuthAccount: Boolean(item.hasAuthAccount),
      termsAccepted: Boolean(item.termsAccepted),
      failedLoginAttempts: toNumber(item.failedLoginAttempts),
      isSuspended: Boolean(item.isSuspended),
      suspendedAt: toDate(item.suspendedAt),
      suspensionReason:
        typeof item.suspensionReason === 'string' ? item.suspensionReason : '',
    };
  });

  students.sort((a, b) => {
    const aTime = a.lastActiveAt?.getTime() || 0;
    const bTime = b.lastActiveAt?.getTime() || 0;
    return bTime - aTime;
  });

  const recentActivities: RecentActivity[] = (recentActivityDocs as any[]).map((item) => ({
    id: String(item?._id || ''),
    studentName:
      (typeof item.studentName === 'string' && item.studentName.trim()) ||
      normalizeStudentEmail(item.studentEmail).split('@')[0] ||
      'Student',
    studentEmail: normalizeStudentEmail(item.studentEmail),
    activityType: typeof item.activityType === 'string' ? item.activityType : 'interaction',
    courseTitle:
      typeof item.courseTitle === 'string' && item.courseTitle.trim()
        ? item.courseTitle
        : 'Course',
    createdAt: toDate(item.createdAt),
  }));

  const pendingDeviceResetRequests: DeviceResetRequest[] = (
    pendingResetRequestDocs as any[]
  ).map((item) => ({
    id: String(item?._id || ''),
    studentEmail: normalizeStudentEmail(item?.studentEmail),
    mobile: typeof item?.mobile === 'string' ? item.mobile : '',
    reason: typeof item?.reason === 'string' ? item.reason : '',
    status: typeof item?.status === 'string' ? item.status : 'pending',
    requestedAt: toDate(item?.requestedAt) || toDate(item?.createdAt),
  }));

  const totals = students.reduce(
    (acc, student) => {
      acc.views += student.views;
      acc.shares += student.shares;
      acc.enrollClicks += student.enrollClicks;
      acc.interactions += student.totalInteractions;
      acc.unread += student.unreadNotifications;
      return acc;
    },
    { views: 0, shares: 0, enrollClicks: 0, interactions: 0, unread: 0 }
  );

  const selectedDetail: StudentDetail | null = hasSelectedStudent
    ? (() => {
        const selectedSummary = statsByEmail.get(normalizedSelectedEmail) || {};
        const selectedAuth = authByEmail.get(normalizedSelectedEmail) || {
          mobile: '',
          lastLoginAt: null,
          deviceBoundAt: null,
          termsAccepted: false,
          termsAcceptedAt: null,
          failedLoginAttempts: 0,
          isSuspended: false,
          suspendedAt: null,
          suspensionReason: '',
        };
        const selectedNotifications =
          notificationsByEmail.get(normalizedSelectedEmail) || {
            unreadNotifications: 0,
            totalNotifications: 0,
          };

        const selectedName =
          (typeof (selectedStudentDoc as any)?.name === 'string' &&
            String((selectedStudentDoc as any).name).trim()) ||
          (selectedSummary.name as string) ||
          normalizedSelectedEmail.split('@')[0] ||
          'Student';
        const selectedImage =
          (typeof (selectedStudentDoc as any)?.image === 'string' &&
            String((selectedStudentDoc as any).image)) ||
          (selectedSummary.image as string) ||
          '';
        const selectedMobile =
          (typeof (selectedUserDoc as any)?.mobile === 'string' &&
            String((selectedUserDoc as any).mobile)) ||
          selectedAuth.mobile ||
          (selectedSummary.mobile as string) ||
          '';

        const pages: StudentPageSummary[] = (selectedPageSummary as any[]).map(
          (item, index) => {
            const slug =
              typeof item?._id?.courseSlug === 'string' ? item._id.courseSlug : '';
            const title =
              typeof item?._id?.courseTitle === 'string'
                ? item._id.courseTitle
                : '';
            return {
              id: `${slug || 'course'}-${title || 'unknown'}-${index}`,
              courseSlug: slug,
              courseTitle: title,
              views: toNumber(item?.views),
              shares: toNumber(item?.shares),
              enrollClicks: toNumber(item?.enrollClicks),
              total: toNumber(item?.total),
              lastActiveAt: toDate(item?.lastActiveAt),
            };
          }
        );

        const recentActions: StudentActivityDetail[] = (
          selectedActivityDocs as any[]
        ).map((item, index) => ({
          id: String(item?._id || index),
          activityType:
            typeof item?.activityType === 'string'
              ? item.activityType
              : 'interaction',
          courseTitle:
            typeof item?.courseTitle === 'string' && item.courseTitle.trim()
              ? item.courseTitle
              : 'Course',
          courseSlug:
            typeof item?.courseSlug === 'string' ? item.courseSlug : '',
          createdAt: toDate(item?.createdAt),
          metadata: toMetadata(item?.metadata),
        }));

        return {
          email: normalizedSelectedEmail,
          name: selectedName,
          image: selectedImage,
          mobile: selectedMobile,
          views: toNumber(selectedSummary.views),
          shares: toNumber(selectedSummary.shares),
          enrollClicks: toNumber(selectedSummary.enrollClicks),
          totalInteractions: toNumber(selectedSummary.totalInteractions),
          unreadNotifications: toNumber(selectedNotifications.unreadNotifications),
          totalNotifications: toNumber(selectedNotifications.totalNotifications),
          lastActiveAt:
            toDate(selectedSummary.lastActiveAt) ||
            toDate((selectedStudentDoc as any)?.lastActiveAt) ||
            toDate((selectedStudentDoc as any)?.updatedAt),
          lastSeenAt:
            toDate((selectedStudentDoc as any)?.lastSeenAt) ||
            toDate((selectedStudentDoc as any)?.updatedAt),
          lastLoginAt:
            toDate((selectedUserDoc as any)?.lastLoginAt) ||
            toDate(selectedSummary.lastLoginAt) ||
            selectedAuth.lastLoginAt ||
            toDate((selectedStudentDoc as any)?.lastLoginAt),
          deviceBoundAt:
            toDate((selectedUserDoc as any)?.deviceBoundAt) ||
            toDate(selectedSummary.deviceBoundAt) ||
            selectedAuth.deviceBoundAt,
          hasAuthAccount:
            Boolean((selectedUserDoc as any)?.email) ||
            Boolean(selectedSummary.hasAuthAccount),
          termsAccepted:
            typeof (selectedUserDoc as any)?.termsAccepted === 'boolean'
              ? Boolean((selectedUserDoc as any).termsAccepted)
              : Boolean(selectedSummary.termsAccepted) || selectedAuth.termsAccepted,
          termsAcceptedAt:
            toDate((selectedUserDoc as any)?.termsAcceptedAt) ||
            selectedAuth.termsAcceptedAt,
          failedLoginAttempts:
            toNumber((selectedUserDoc as any)?.failedLoginAttempts) ||
            toNumber(selectedSummary.failedLoginAttempts) ||
            selectedAuth.failedLoginAttempts,
          isSuspended:
            typeof (selectedUserDoc as any)?.isSuspended === 'boolean'
              ? Boolean((selectedUserDoc as any).isSuspended)
              : Boolean(selectedSummary.isSuspended) || selectedAuth.isSuspended,
          suspendedAt:
            toDate((selectedUserDoc as any)?.suspendedAt) ||
            toDate(selectedSummary.suspendedAt) ||
            selectedAuth.suspendedAt,
          suspensionReason:
            (typeof (selectedUserDoc as any)?.suspensionReason === 'string'
              ? String((selectedUserDoc as any).suspensionReason)
              : '') ||
            (typeof selectedSummary.suspensionReason === 'string'
              ? selectedSummary.suspensionReason
              : '') ||
            selectedAuth.suspensionReason ||
            '',
          loginCount: toNumber((selectedStudentDoc as any)?.loginCount),
          pages,
          recentActions,
        };
      })()
    : null;

  return {
    students,
    recentActivities,
    pendingDeviceResetRequests,
    totals,
    selectedDetail,
  };
}

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ student?: string | string[] }>;
}) {
  const resolvedSearchParams = (await searchParams) || {};
  const selectedEmail = normalizeStudentEmail(
    readSearchParam(resolvedSearchParams.student)
  );
  const {
    students,
    recentActivities,
    pendingDeviceResetRequests,
    totals,
    selectedDetail,
  } =
    await getStudentDashboardData(selectedEmail);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold md:text-2xl">Students Management</h1>
        <p className="text-sm text-muted-foreground">
          Track student interactions, shares, enroll clicks, and send personal
          notifications.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Students</CardDescription>
            <CardTitle className="text-2xl">{students.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Course Views</CardDescription>
            <CardTitle className="text-2xl">{totals.views}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Course Shares</CardDescription>
            <CardTitle className="text-2xl">{totals.shares}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Enroll Clicks</CardDescription>
            <CardTitle className="text-2xl">{totals.enrollClicks}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Unread Notifications</CardDescription>
            <CardTitle className="text-2xl">{totals.unread}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Reset Requests</CardDescription>
            <CardTitle className="text-2xl">
              {pendingDeviceResetRequests.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>All Students Activity</CardTitle>
            <CardDescription>
              Complete interaction performance by student account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Shares</TableHead>
                  <TableHead>Enroll Clicks</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Auth</TableHead>
                  <TableHead>Notifications</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground">
                      No student data available yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => {
                    const isSelected = selectedEmail === student.email;
                    return (
                    <TableRow key={student.email} className={isSelected ? 'bg-muted/40' : undefined}>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{student.mobile || '-'}</TableCell>
                      <TableCell>{student.views}</TableCell>
                      <TableCell>{student.shares}</TableCell>
                      <TableCell>{student.enrollClicks}</TableCell>
                      <TableCell>{student.totalInteractions}</TableCell>
                      <TableCell>
                        {student.isSuspended ? (
                          <Badge variant="destructive">Suspended</Badge>
                        ) : student.hasAuthAccount ? (
                          <Badge variant={student.termsAccepted ? 'secondary' : 'outline'}>
                            {student.termsAccepted ? 'Auth + Terms' : 'Auth'}
                          </Badge>
                        ) : (
                          <Badge variant="outline">No Auth</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{student.totalNotifications}</span>
                          {student.unreadNotifications > 0 ? (
                            <Badge variant="destructive">
                              {student.unreadNotifications} unread
                            </Badge>
                          ) : (
                            <Badge variant="secondary">All read</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.lastActiveAt
                          ? formatDistanceToNow(student.lastActiveAt, { addSuffix: true })
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          asChild
                          variant={isSelected ? 'secondary' : 'outline'}
                          size="sm"
                        >
                          <Link
                            href={`/admin/dashboard/students?student=${encodeURIComponent(
                              student.email
                            )}`}
                          >
                            {isSelected ? 'Viewing' : 'View details'}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Student Details</CardTitle>
                <CardDescription>
                  Detailed activity, pages, and login insights.
                </CardDescription>
              </div>
              {selectedDetail && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin/dashboard/students">Clear</Link>
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedDetail ? (
                <p className="text-sm text-muted-foreground">
                  Select a student from the table to see page-wise activity,
                  logins, and recent actions.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={selectedDetail.image || ''}
                        alt={selectedDetail.name}
                      />
                      <AvatarFallback>
                        {selectedDetail.name
                          .split(' ')
                          .filter(Boolean)
                          .map((part) => part[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase() || 'ST'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        {selectedDetail.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {selectedDetail.email}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {selectedDetail.mobile || 'No mobile in auth profile'}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                      <p className="text-xs text-muted-foreground">Login Count</p>
                      <p className="text-lg font-semibold">
                        {selectedDetail.loginCount}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                      <p className="text-xs text-muted-foreground">Last Login</p>
                      <p className="text-sm font-semibold">
                        {formatRelative(selectedDetail.lastLoginAt)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatAbsolute(selectedDetail.lastLoginAt)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                      <p className="text-xs text-muted-foreground">Last Active</p>
                      <p className="text-sm font-semibold">
                        {formatRelative(selectedDetail.lastActiveAt)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatAbsolute(selectedDetail.lastActiveAt)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                      <p className="text-xs text-muted-foreground">
                        Total Interactions
                      </p>
                      <p className="text-lg font-semibold">
                        {selectedDetail.totalInteractions}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Views {selectedDetail.views}</Badge>
                    <Badge variant="outline">Shares {selectedDetail.shares}</Badge>
                    <Badge variant="outline">
                      Enroll Clicks {selectedDetail.enrollClicks}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {selectedDetail.totalNotifications} notifications
                    </Badge>
                    {selectedDetail.unreadNotifications > 0 ? (
                      <Badge variant="destructive">
                        {selectedDetail.unreadNotifications} unread
                      </Badge>
                    ) : (
                      <Badge variant="outline">All read</Badge>
                    )}
                  </div>

                  <div className="rounded-lg border border-border/60 bg-background/60 p-3 space-y-3">
                    <div>
                      <p className="text-sm font-semibold">Student Security Controls</p>
                      <p className="text-xs text-muted-foreground">
                        Admin can reset device binding, set password, and unsuspend blocked accounts.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-border/60 p-2.5">
                        <p className="text-xs text-muted-foreground">Mobile</p>
                        <p className="text-sm font-medium">{selectedDetail.mobile || '-'}</p>
                      </div>
                      <div className="rounded-lg border border-border/60 p-2.5">
                        <p className="text-xs text-muted-foreground">Device Bound</p>
                        <p className="text-sm font-medium">
                          {selectedDetail.deviceBoundAt ? formatRelative(selectedDetail.deviceBoundAt) : 'Not bound'}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border/60 p-2.5">
                        <p className="text-xs text-muted-foreground">Terms Accepted</p>
                        <p className="text-sm font-medium">
                          {selectedDetail.termsAccepted ? 'Yes' : 'No'}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border/60 p-2.5">
                        <p className="text-xs text-muted-foreground">Auth Account</p>
                        <p className="text-sm font-medium">
                          {selectedDetail.hasAuthAccount ? 'Enabled' : 'Not linked'}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border/60 p-2.5">
                        <p className="text-xs text-muted-foreground">Failed Login Attempts</p>
                        <p className="text-sm font-medium">
                          {selectedDetail.failedLoginAttempts}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border/60 p-2.5">
                        <p className="text-xs text-muted-foreground">Suspension Status</p>
                        <p className="text-sm font-medium">
                          {selectedDetail.isSuspended ? 'Suspended' : 'Active'}
                        </p>
                        {selectedDetail.suspendedAt && (
                          <p className="text-[11px] text-muted-foreground">
                            Since {formatAbsolute(selectedDetail.suspendedAt)}
                          </p>
                        )}
                        {selectedDetail.suspensionReason ? (
                          <p className="text-[11px] text-muted-foreground">
                            Reason: {selectedDetail.suspensionReason}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedDetail.isSuspended && (
                        <form action={adminUnsuspendStudent}>
                          <input type="hidden" name="studentEmail" value={selectedDetail.email} />
                          <Button type="submit" variant="secondary" size="sm">
                            Unsuspend Student
                          </Button>
                        </form>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Device reset is approved from pending reset requests only.
                    </p>

                    <form action={adminSetStudentPassword} className="space-y-2">
                      <input type="hidden" name="studentEmail" value={selectedDetail.email} />
                      <Label htmlFor="admin-student-password">Set New Password</Label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                          id="admin-student-password"
                          name="newPassword"
                          type="password"
                          minLength={8}
                          required
                          placeholder="Minimum 8 characters"
                          className="sm:max-w-xs"
                        />
                        <Button type="submit" size="sm">Update Password</Button>
                      </div>
                    </form>
                  </div>

                  <div className="rounded-lg border border-border/60">
                    <div className="flex items-center justify-between px-3 py-2">
                      <p className="text-sm font-semibold">Activity by Page</p>
                      <span className="text-xs text-muted-foreground">
                        Top {selectedDetail.pages.length}
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Page</TableHead>
                            <TableHead>Views</TableHead>
                            <TableHead>Shares</TableHead>
                            <TableHead>Enrolls</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Last Active</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedDetail.pages.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                className="text-center text-muted-foreground"
                              >
                                No page activity recorded yet.
                              </TableCell>
                            </TableRow>
                          ) : (
                            selectedDetail.pages.map((page) => {
                              const pageLabel =
                                page.courseTitle || page.courseSlug || 'Course';
                              const pagePath = page.courseSlug
                                ? `/courses/${page.courseSlug}`
                                : '';
                              return (
                                <TableRow key={page.id}>
                                  <TableCell className="max-w-[180px]">
                                    {pagePath ? (
                                      <Link
                                        href={pagePath}
                                        className="font-medium text-primary hover:underline"
                                      >
                                        {pageLabel}
                                      </Link>
                                    ) : (
                                      <span className="font-medium">
                                        {pageLabel}
                                      </span>
                                    )}
                                    {page.courseSlug && (
                                      <p className="text-xs text-muted-foreground">
                                        /courses/{page.courseSlug}
                                      </p>
                                    )}
                                  </TableCell>
                                  <TableCell>{page.views}</TableCell>
                                  <TableCell>{page.shares}</TableCell>
                                  <TableCell>{page.enrollClicks}</TableCell>
                                  <TableCell>{page.total}</TableCell>
                                  <TableCell>
                                    {formatRelative(page.lastActiveAt)}
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Recent Actions</p>
                    {selectedDetail.recentActions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No recent actions yet.
                      </p>
                    ) : (
                      selectedDetail.recentActions.map((activity) => {
                        const metaSource =
                          typeof activity.metadata.source === 'string'
                            ? activity.metadata.source
                            : '';
                        const metaPath =
                          typeof activity.metadata.pathname === 'string'
                            ? activity.metadata.pathname
                            : '';
                        const coursePath = activity.courseSlug
                          ? `/courses/${activity.courseSlug}`
                          : '';
                        return (
                          <div
                            key={activity.id}
                            className="rounded-lg border border-border/70 p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                {coursePath ? (
                                  <Link
                                    href={coursePath}
                                    className="text-sm font-medium text-primary hover:underline"
                                  >
                                    {activity.courseTitle}
                                  </Link>
                                ) : (
                                  <p className="text-sm font-medium">
                                    {activity.courseTitle}
                                  </p>
                                )}
                                {activity.courseSlug && (
                                  <p className="text-xs text-muted-foreground">
                                    /courses/{activity.courseSlug}
                                  </p>
                                )}
                              </div>
                              <Badge variant="outline">
                                {formatActivityType(activity.activityType)}
                              </Badge>
                            </div>
                            {(metaSource || metaPath) && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {metaSource ? `Source: ${metaSource}` : ''}
                                {metaSource && metaPath ? ' • ' : ''}
                                {metaPath ? metaPath : ''}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatRelative(activity.createdAt)}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
            <div className="space-y-6">
              <StudentNotificationForm
                students={students.map((student) => ({
                  email: student.email,
                  name: student.name,
                }))}
              />

              <Card>
                <CardHeader>
                  <CardTitle>Recent Student Interactions</CardTitle>
                  <CardDescription>
                    Latest views, shares, and enroll-click actions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentActivities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No recent student activity yet.
                    </p>
                  ) : (
                    recentActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className="rounded-lg border border-border/70 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">{activity.studentName}</p>
                          <Badge variant="outline">
                            {formatActivityType(activity.activityType)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.studentEmail}
                        </p>
                        <p className="text-sm mt-2">{activity.courseTitle}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.createdAt
                            ? formatDistanceToNow(activity.createdAt, {
                                addSuffix: true,
                              })
                            : '-'}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="xl:sticky xl:top-24 h-fit">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Device Reset Requests</CardTitle>
                  <CardDescription>
                    Student requests that need admin approval before device reset.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingDeviceResetRequests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No pending requests.
                    </p>
                  ) : (
                    pendingDeviceResetRequests.map((request) => (
                      <div
                        key={request.id}
                        className="rounded-lg border border-border/70 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {request.studentEmail || 'Student'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Mobile: {request.mobile || '-'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Requested: {formatRelative(request.requestedAt)}
                            </p>
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {request.status}
                          </Badge>
                        </div>

                        {request.reason ? (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Reason: {request.reason}
                          </p>
                        ) : null}

                        <div className="mt-3 flex flex-wrap gap-2">
                          <form action={approveDeviceResetRequest}>
                            <input type="hidden" name="requestId" value={request.id} />
                            <Button type="submit" size="sm">
                              Approve Reset
                            </Button>
                          </form>
                          <form action={rejectDeviceResetRequest}>
                            <input type="hidden" name="requestId" value={request.id} />
                            <Button type="submit" variant="outline" size="sm">
                              Reject
                            </Button>
                          </form>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
