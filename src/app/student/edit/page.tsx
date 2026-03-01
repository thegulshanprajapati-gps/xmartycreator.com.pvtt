'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { buildTestAppUrl, resolveTestAppBaseUrl } from '@/lib/subdomain-links';

type AccountForm = {
  email: string;
  mobile: string;
  currentPassword: string;
  newPassword: string;
};

type StudentProfile = {
  email: string;
  mobile: string;
  name: string;
  image: string;
};

export default function StudentEditPage() {
  const router = useRouter();
  const [loadingSession, setLoadingSession] = useState(true);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState<AccountForm>({
    email: '',
    mobile: '',
    currentPassword: '',
    newPassword: '',
  });

  useEffect(() => {
    let mounted = true;

    const loadStudentSession = async () => {
      try {
        setLoadingSession(true);
        const response = await fetch('/api/auth/student-session', {
          cache: 'no-store',
        });

        if (!mounted) return;
        if (!response.ok) {
          router.replace('/login?callbackUrl=%2Fstudent%2Fedit');
          return;
        }

        const data = await response.json();
        const user = data?.user;
        if (!data?.authenticated || typeof user?.email !== 'string') {
          router.replace('/login?callbackUrl=%2Fstudent%2Fedit');
          return;
        }

        const profile: StudentProfile = {
          email: user.email,
          mobile: typeof user.mobile === 'string' ? user.mobile : '',
          name: typeof user.name === 'string' ? user.name : user.email,
          image: typeof user.image === 'string' ? user.image : '',
        };

        setStudentProfile(profile);
        setForm((prev) => ({
          ...prev,
          email: prev.email || profile.email,
          mobile: prev.mobile || profile.mobile,
        }));
      } catch (error) {
        console.error('[student/edit] failed to load student session', error);
        if (mounted) {
          router.replace('/login?callbackUrl=%2Fstudent%2Fedit');
        }
      } finally {
        if (mounted) {
          setLoadingSession(false);
        }
      }
    };

    void loadStudentSession();

    return () => {
      mounted = false;
    };
  }, [router]);

  const updateField = (field: keyof AccountForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    try {
      setSubmittingPassword(true);
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          mobile: form.mobile.trim(),
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });

      const data = await response.json();
      setMessage(data?.msg || (response.ok ? 'Password updated successfully' : 'Password update failed'));
    } catch (error) {
      console.error('[student/edit] change-password error', error);
      setMessage('Password update failed');
    } finally {
      setSubmittingPassword(false);
    }
  };

  const handleGoToTests = () => {
    const testBaseUrl = resolveTestAppBaseUrl(window.location.hostname);
    const testsUrl = buildTestAppUrl('/student/courses-enrolled', testBaseUrl);
    window.location.assign(testsUrl);
  };

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8 md:py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Student Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile and password. Device reset is handled by admin.
        </p>
      </div>
      {loadingSession ? (
        <div className="mb-6 rounded-lg border border-border/60 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
          Loading student profile...
        </div>
      ) : studentProfile ? (
        <div className="mb-6 rounded-lg border border-border/60 bg-background/70 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
            Student Profile
          </p>
          <p className="text-sm font-semibold">{studentProfile.name}</p>
          <p className="text-xs text-muted-foreground">{studentProfile.email}</p>
          <p className="text-xs text-muted-foreground">
            Mobile: {studentProfile.mobile || 'Not saved in profile'}
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your current password securely.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handlePasswordUpdate}>
              <div className="space-y-1.5">
                <Label htmlFor="edit-email-password">Email</Label>
                <Input
                  id="edit-email-password"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-mobile-password">Mobile</Label>
                <Input
                  id="edit-mobile-password"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  required
                  value={form.mobile}
                  onChange={(e) => updateField('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-current-password">Current Password</Label>
                <Input
                  id="edit-current-password"
                  type="password"
                  required
                  minLength={8}
                  value={form.currentPassword}
                  onChange={(e) => updateField('currentPassword', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-new-password">New Password</Label>
                <Input
                  id="edit-new-password"
                  type="password"
                  required
                  minLength={8}
                  value={form.newPassword}
                  onChange={(e) => updateField('newPassword', e.target.value)}
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                className="w-full"
                disabled={loadingSession || submittingPassword}
              >
                {submittingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {message ? (
        <p className="mt-4 text-sm text-foreground/80">{message}</p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild variant="ghost">
          <Link href="/student/courses">Go To Courses Enrolled</Link>
        </Button>
        <Button type="button" variant="ghost" onClick={handleGoToTests}>
          Go To Tests Enrolled
        </Button>
      </div>
    </main>
  );
}
