'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { Loader2, ShieldCheck, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FormState = {
  email: string;
  password: string;
  mobile: string;
  termsAccepted: boolean;
};

type FormErrors = Partial<Record<'email' | 'password' | 'mobile' | 'terms' | 'fingerprint', string>>;

function validate(form: FormState, fingerprint: string, fingerprintError: string): FormErrors {
  const nextErrors: FormErrors = {};

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

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    email: '',
    password: '',
    mobile: '',
    termsAccepted: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [fingerprint, setFingerprint] = useState('');
  const [fingerprintError, setFingerprintError] = useState('');
  const [loadingFingerprint, setLoadingFingerprint] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

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
        console.error('[signup] fingerprint error', error);
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

  const isDisabled = useMemo(
    () => submitting || loadingFingerprint,
    [submitting, loadingFingerprint]
  );

  const onChange = (field: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field === 'termsAccepted' ? 'terms' : field]: undefined }));
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

      const response = await fetch('/api/auth/signup', {
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
        setMessage(data?.msg || 'Signup failed.');
        return;
      }

      setMessage('Signup successful. Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 700);
    } catch (error) {
      console.error('[signup] submit error', error);
      setMessage('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(168,85,247,0.14),transparent_40%)] dark:bg-[radial-gradient(circle_at_20%_10%,rgba(168,85,247,0.22),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_90%,rgba(56,189,248,0.16),transparent_42%)] dark:bg-[radial-gradient(circle_at_80%_90%,rgba(56,189,248,0.18),transparent_42%)]" />
      </div>

      <div className="relative mx-auto grid w-full max-w-5xl items-center gap-8 lg:grid-cols-2">
        <section className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Student Portal Security
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Create your student account
          </h1>
          <p className="max-w-md text-sm text-muted-foreground sm:text-base">
            Email + password login with same-device security and terms acceptance.
          </p>
          <div className="rounded-2xl border border-border/70 bg-card/70 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">What happens on signup</p>
            <p className="mt-2">
              Your device gets bound securely using an httpOnly token + browser fingerprint.
            </p>
          </div>
        </section>

        <Card className="border-border/70 bg-card/85 shadow-xl backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <UserPlus className="h-5 w-5 text-primary" />
              Signup
            </CardTitle>
            <CardDescription>Create a secure student account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="student@example.com"
                  value={form.email}
                  onChange={(e) => onChange('email', e.target.value)}
                  autoComplete="email"
                />
                {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={(e) => onChange('password', e.target.value)}
                  autoComplete="new-password"
                />
                {errors.password ? <p className="text-xs text-destructive">{errors.password}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-mobile">Mobile Number</Label>
                <Input
                  id="signup-mobile"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10 digit mobile"
                  value={form.mobile}
                  onChange={(e) => onChange('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  autoComplete="tel"
                />
                {errors.mobile ? <p className="text-xs text-destructive">{errors.mobile}</p> : null}
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="signup-terms"
                    checked={form.termsAccepted}
                    onCheckedChange={(checked) => onChange('termsAccepted', checked === true)}
                  />
                  <Label htmlFor="signup-terms" className="cursor-pointer text-sm leading-5">
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

              <Button type="submit" className="w-full" disabled={isDisabled}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Login
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
