'use client';

import { Suspense, useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { AlertTriangle, Loader2, LogIn, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type LoginFormState = {
  email: string;
  password: string;
  mobile: string;
  termsAccepted: boolean;
};

type LoginErrors = Partial<Record<'email' | 'password' | 'mobile' | 'terms' | 'fingerprint', string>>;

function isAllowedCallbackHost(hostname: string) {
  if (!hostname) return false;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
  if (hostname === 'xmartycreator.com' || hostname.endsWith('.xmartycreator.com')) return true;
  return false;
}

function navigateToCallback(callbackUrl: string, router: ReturnType<typeof useRouter>) {
  const nextValue = callbackUrl.trim();
  if (!nextValue) {
    router.push('/');
    return;
  }

  // Keep in-app navigation for relative paths.
  if (!/^https?:\/\//i.test(nextValue)) {
    if (nextValue.startsWith('//')) {
      router.push('/');
      return;
    }
    router.push(nextValue.startsWith('/') ? nextValue : `/${nextValue}`);
    return;
  }

  if (typeof window === 'undefined') {
    return;
  }

  try {
    const parsed = new URL(nextValue);
    if (!isAllowedCallbackHost(parsed.hostname)) {
      router.push('/');
      return;
    }
    window.location.assign(parsed.toString());
  } catch {
    router.push('/');
  }
}

function validate(form: LoginFormState, fingerprint: string, fingerprintError: string): LoginErrors {
  const nextErrors: LoginErrors = {};

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    nextErrors.email = 'Enter a valid email address.';
  }
  if (form.password.trim().length < 8) {
    nextErrors.password = 'Password must be at least 8 characters.';
  }
  if (!/^\d{10}$/.test(form.mobile.trim())) {
    nextErrors.mobile = 'Mobile number must be exactly 10 digits.';
  }
  if (!form.termsAccepted) {
    nextErrors.terms = 'Please accept Terms & Conditions.';
  }
  if (fingerprintError || !fingerprint) {
    nextErrors.fingerprint = 'Device fingerprint is not ready. Refresh and try again.';
  }

  return nextErrors;
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [form, setForm] = useState<LoginFormState>({
    email: '',
    password: '',
    mobile: '',
    termsAccepted: false,
  });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [fingerprint, setFingerprint] = useState('');
  const [fingerprintError, setFingerprintError] = useState('');
  const [loadingFingerprint, setLoadingFingerprint] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sendingResetRequest, setSendingResetRequest] = useState(false);
  const [message, setMessage] = useState('');
  const [deviceMismatch, setDeviceMismatch] = useState(false);
  const [accountSuspended, setAccountSuspended] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadFingerprint = async () => {
      try {
        setLoadingFingerprint(true);
        const agent = await FingerprintJS.load();
        const result = await agent.get();
        if (!mounted) return;
        setFingerprint(result.visitorId);
      } catch (error) {
        console.error('[login] fingerprint error', error);
        if (!mounted) return;
        setFingerprintError('Unable to initialize fingerprint.');
      } finally {
        if (mounted) {
          setLoadingFingerprint(false);
        }
      }
    };

    loadFingerprint();
    return () => {
      mounted = false;
    };
  }, []);

  const isSubmitDisabled = useMemo(
    () => submitting || loadingFingerprint,
    [submitting, loadingFingerprint]
  );

  const onChange = (field: keyof LoginFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field === 'termsAccepted' ? 'terms' : field]: undefined }));
  };

  const handleLogin = async () => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: form.email.trim(),
        password: form.password,
        mobile: form.mobile.trim(),
        fingerprint,
        termsAccepted: form.termsAccepted,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data?.ok) {
      const code = typeof data?.code === 'string' ? data.code : '';
      if (
        code === 'ACCOUNT_SUSPENDED_REDIRECT' &&
        typeof data?.redirectUrl === 'string' &&
        data.redirectUrl
      ) {
        setDeviceMismatch(false);
        setAccountSuspended(true);
        setMessage('Account suspended. Opening secure admin contact page...');
        if (typeof window !== 'undefined') {
          window.location.assign(data.redirectUrl);
        }
        return { ok: false };
      }
      setDeviceMismatch(code === 'DEVICE_MISMATCH' || code === 'OWN_DEVICE_REQUIRED');
      setAccountSuspended(code === 'ACCOUNT_SUSPENDED');
      setMessage(data?.msg || 'Login failed.');
      return { ok: false };
    }

    setDeviceMismatch(false);
    setAccountSuspended(false);
    setMessage('Login successful. Opening your student profile session...');
    if (typeof window !== 'undefined') {
      localStorage.setItem('student_portal_token', data.token);
    }
    navigateToCallback(callbackUrl, router);
    return { ok: true };
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    const validationErrors = validate(form, fingerprint, fingerprintError);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setSubmitting(true);
      await handleLogin();
    } catch (error) {
      console.error('[login] submit error', error);
      setMessage('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendResetRequest = async () => {
    setMessage('');
    try {
      setSendingResetRequest(true);
      const response = await fetch('/api/auth/device-reset-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email.trim(),
          mobile: form.mobile.trim(),
          password: form.password,
          reason: 'Login failed due to device mismatch',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.ok) {
        setMessage(data?.msg || 'Failed to send request to admin.');
        return;
      }

      setMessage(data?.msg || 'Request sent to admin for approval.');
    } catch (error) {
      console.error('[login] failed to send reset request', error);
      setMessage('Failed to send request to admin.');
    } finally {
      setSendingResetRequest(false);
    }
  };

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.14),transparent_40%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.22),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_85%,rgba(236,72,153,0.14),transparent_42%)] dark:bg-[radial-gradient(circle_at_80%_85%,rgba(236,72,153,0.2),transparent_42%)]" />
      </div>

      <div className="relative mx-auto grid w-full max-w-5xl items-center gap-8 lg:grid-cols-2">
        <section className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Same Device Login
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Welcome back, student
          </h1>
          <p className="max-w-md text-sm text-muted-foreground sm:text-base">
            Login using email and password. Access is restricted to your bound device.
          </p>
          {accountSuspended ? (
            <div className="rounded-2xl border border-red-300/60 bg-red-50/70 p-4 text-sm text-red-900 dark:border-red-500/40 dark:bg-red-950/25 dark:text-red-100">
              <p className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4" />
                Account suspended
              </p>
              <p className="mt-1">
                Too many failed attempts. Login from your bound device to open secure admin contact page.
              </p>
            </div>
          ) : deviceMismatch ? (
            <div className="rounded-2xl border border-amber-300/60 bg-amber-50/70 p-4 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/25 dark:text-amber-100">
              <p className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4" />
                Device mismatch detected
              </p>
              <p className="mt-1">
                Use your own device for logging in. If device needs reset, contact admin.
              </p>
            </div>
          ) : null}
        </section>

        <Card className="border-border/70 bg-card/85 shadow-xl backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <LogIn className="h-5 w-5 text-primary" />
              Login
            </CardTitle>
            <CardDescription>Secure access for student portal.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="student@example.com"
                  value={form.email}
                  onChange={(e) => onChange('email', e.target.value)}
                  autoComplete="email"
                />
                {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Your password"
                  value={form.password}
                  onChange={(e) => onChange('password', e.target.value)}
                  autoComplete="current-password"
                />
                {errors.password ? <p className="text-xs text-destructive">{errors.password}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-mobile">Mobile Number</Label>
                <Input
                  id="login-mobile"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10 digit mobile"
                  value={form.mobile}
                  onChange={(e) =>
                    onChange('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))
                  }
                  autoComplete="tel"
                />
                {errors.mobile ? <p className="text-xs text-destructive">{errors.mobile}</p> : null}
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="login-terms"
                    checked={form.termsAccepted}
                    onCheckedChange={(checked) => onChange('termsAccepted', checked === true)}
                  />
                  <Label htmlFor="login-terms" className="cursor-pointer text-sm leading-5">
                    I accept the Terms &amp; Conditions
                  </Label>
                </div>
                {errors.terms ? <p className="text-xs text-destructive">{errors.terms}</p> : null}
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                {loadingFingerprint ? 'Initializing device fingerprint...' : 'Device fingerprint ready.'}
              </div>
              {errors.fingerprint ? <p className="text-xs text-destructive">{errors.fingerprint}</p> : null}

              {message ? (
                <p
                  className={
                    message.toLowerCase().includes('success')
                      ? 'text-sm text-emerald-600'
                      : 'text-sm text-destructive'
                  }
                >
                  {message}
                </p>
              ) : null}

              <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging In...
                  </>
                ) : (
                  'Login'
                )}
              </Button>

              {deviceMismatch && !accountSuspended ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleSendResetRequest}
                  disabled={sendingResetRequest}
                >
                  {sendingResetRequest ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Request...
                    </>
                  ) : (
                    'Send Reset Request To Admin'
                  )}
                </Button>
              ) : null}
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              New student?{' '}
              <Link href="/signup" className="font-semibold text-primary hover:underline">
                Create account
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
