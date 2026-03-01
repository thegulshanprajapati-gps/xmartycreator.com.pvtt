import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import clientPromise from '@/lib/mongodb';
import {
  getMongoDbName,
} from '@/lib/student-management';
import { getAuthenticatedStudentUser } from '@/lib/student-session';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { markAllNotificationsAsRead, markNotificationAsRead } from './actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Student Notifications',
  description: 'Personal notifications from Xmarty Creator admin.',
};

type StudentNotification = {
  id: string;
  title: string;
  message: string;
  category: string;
  ctaLabel: string;
  ctaHref: string;
  isRead: boolean;
  createdAt: Date | null;
};

function asDate(value: unknown) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

async function getStudentNotifications(email: string): Promise<StudentNotification[]> {
  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  const docs = await db
    .collection('student_notifications')
    .find({ studentEmail: email })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  return docs.map((doc: any) => ({
    id: String(doc?._id || ''),
    title: typeof doc.title === 'string' ? doc.title : 'Notification',
    message: typeof doc.message === 'string' ? doc.message : '',
    category: typeof doc.category === 'string' ? doc.category : 'general',
    ctaLabel: typeof doc.ctaLabel === 'string' ? doc.ctaLabel : '',
    ctaHref: typeof doc.ctaHref === 'string' ? doc.ctaHref : '',
    isRead: Boolean(doc.isRead),
    createdAt: asDate(doc.createdAt),
  }));
}

export default async function StudentNotificationsPage() {
  const student = await getAuthenticatedStudentUser();
  const email = student?.email || '';

  if (!email) {
    redirect('/login?callbackUrl=%2Fstudent%2Fnotifications');
  }

  const notifications = await getStudentNotifications(email);
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8 md:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Personal Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Messages sent by admin to your student account.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Student Profile: {student?.name || email} ({email})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={unreadCount > 0 ? 'destructive' : 'secondary'}>
            {unreadCount} unread
          </Badge>
          {unreadCount > 0 && (
            <form action={markAllNotificationsAsRead}>
              <Button type="submit" variant="outline" size="sm">
                Mark All As Read
              </Button>
            </form>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Notifications Yet</CardTitle>
            <CardDescription>
              You will see personal updates from admin here.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={notification.isRead ? 'opacity-80' : 'border-primary/40'}
            >
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-lg">{notification.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {notification.category}
                    </Badge>
                    <Badge variant={notification.isRead ? 'secondary' : 'destructive'}>
                      {notification.isRead ? 'Read' : 'Unread'}
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  {notification.createdAt
                    ? formatDistanceToNow(notification.createdAt, { addSuffix: true })
                    : 'Recently'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">{notification.message}</p>

                <div className="flex flex-wrap items-center gap-2">
                  {notification.ctaLabel && notification.ctaHref && (
                    <Button asChild size="sm">
                      <Link href={notification.ctaHref}>{notification.ctaLabel}</Link>
                    </Button>
                  )}

                  {!notification.isRead && (
                    <form action={markNotificationAsRead}>
                      <input type="hidden" name="id" value={notification.id} />
                      <Button type="submit" variant="outline" size="sm">
                        Mark As Read
                      </Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
