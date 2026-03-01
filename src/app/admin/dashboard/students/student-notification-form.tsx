'use client';

import { useActionState, useEffect } from 'react';
import { sendStudentNotification } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type StudentOption = {
  email: string;
  name: string;
};

const initialState = {
  message: '',
  success: false,
};

const STUDENT_NOTIFICATION_CATEGORIES = [
  'general',
  'course',
  'support',
  'reminder',
] as const;

export default function StudentNotificationForm({
  students,
}: {
  students: StudentOption[];
}) {
  const [state, formAction, isPending] = useActionState(
    sendStudentNotification,
    initialState
  );
  const { toast } = useToast();

  useEffect(() => {
    if (!state?.message) return;
    toast({
      title: state.success ? 'Notification Sent' : 'Failed',
      description: state.message,
      variant: state.success ? 'default' : 'destructive',
    });
  }, [state, toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Personal Notification</CardTitle>
        <CardDescription>
          Send one-to-one or broadcast notifications to students.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targetEmail">Target Student</Label>
            <select
              id="targetEmail"
              name="targetEmail"
              defaultValue="all"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Students</option>
              {students.map((student) => (
                <option key={student.email} value={student.email}>
                  {student.name} ({student.email})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              maxLength={120}
              placeholder="Important update"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              name="message"
              maxLength={2000}
              placeholder="Write your message for students..."
              rows={5}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              name="category"
              defaultValue="general"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm capitalize"
            >
              {STUDENT_NOTIFICATION_CATEGORIES.map((category) => (
                <option key={category} value={category} className="capitalize">
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ctaLabel">CTA Label (optional)</Label>
              <Input
                id="ctaLabel"
                name="ctaLabel"
                maxLength={60}
                placeholder="Open Course"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctaHref">CTA Link (optional)</Label>
              <Input
                id="ctaHref"
                name="ctaHref"
                maxLength={300}
                placeholder="/courses/web-development-masterclass"
              />
            </div>
          </div>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? 'Sending...' : 'Send Notification'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
