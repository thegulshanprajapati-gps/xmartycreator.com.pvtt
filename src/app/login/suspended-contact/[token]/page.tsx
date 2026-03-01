'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import {
  AlertTriangle,
  ArrowLeft,
  Clock3,
  Loader2,
  MailCheck,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type VerifyData = {
  email: string;
  mobile: string;
  expiresAt: string;
  remainingSeconds: number;
  pendingRequest: boolean;
};

type VerifyApiResponse = {
  ok: boolean;
  msg?: string;
  code?: string;
  data?: VerifyData;
};

type RequestApiResponse = {
  ok: boolean;
  msg?: string;
  alreadyPending?: boolean;
};

const LINK_TTL_SECONDS = 300;

function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0] || '*'}***@${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

function maskMobile(mobile: string) {
  if (!mobile) return 'Not available';
  if (mobile.length < 4) return '****';
  return `******${mobile.slice(-4)}`;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = Math.max(0, seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
}

export default function SuspendedContactPage() {
  const params = useParams();
  const token = useMemo(() => {
    const raw = params?.token;
    if (Array.isArray(raw)) return raw[0] || '';
    return typeof raw === 'string' ? raw : '';
  }, [params]);

  const [fingerprint, setFingerprint] = useState('');
  const [fingerprintError, setFingerprintError] = useState('');
  const [loadingFingerprint, setLoadingFingerprint] = useState(true);

  const [verifying, setVerifying] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [accessData, setAccessData] = useState<VerifyData | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const [reason, setReason] = useState(
    'My account is suspended. Please verify my profile and approve unsuspend/reset.'
  );
  const [submitting, setSubmitting] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestSuccess, setRequestSuccess] = useState(false);

  const verifySecureLink = useCallback(async () => {
    if (!token || !fingerprint) return;

    try {
      setVerifying(true);
      setVerifyError('');
      setVerifyCode('');

      const response = await fetch('/api/auth/suspended-contact/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, fingerprint }),
      });

      const payload = (await response.json()) as VerifyApiResponse;
      if (!response.ok || !payload.ok || !payload.data) {
        setAccessData(null);
        setSecondsLeft(0);
        setVerifyCode(payload?.code || 'VERIFY_FAILED');
        setVerifyError(payload?.msg || 'Secure link verification failed.');
        return;
      }

      setAccessData(payload.data);
      setSecondsLeft(Math.max(0, Number(payload.data.remainingSeconds || 0)));
      setRequestMessage('');
      setRequestSuccess(false);
    } catch (error) {
      console.error('[suspended-contact] verify failed', error);
      setAccessData(null);
      setSecondsLeft(0);
      setVerifyCode('VERIFY_FAILED');
      setVerifyError('Secure link verification failed. Please retry.');
    } finally {
      setVerifying(false);
    }
  }, [fingerprint, token]);

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
        console.error('[suspended-contact] fingerprint init failed', error);
        if (!mounted) return;
        setFingerprintError('Unable to initialize this device fingerprint.');
      } finally {
        if (mounted) {
          setLoadingFingerprint(false);
        }
      }
    };

    void loadFingerprint();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setVerifyCode('INVALID_TOKEN');
      setVerifyError('Secure link is invalid. Login again from student login page.');
      return;
    }
    if (loadingFingerprint) return;
    if (fingerprintError) {
      setVerifyCode('DEVICE_NOT_ALLOWED');
      setVerifyError(fingerprintError);
      return;
    }
    void verifySecureLink();
  }, [fingerprintError, loadingFingerprint, token, verifySecureLink]);

  useEffect(() => {
    if (!accessData?.expiresAt) return;

    const expiryTime = new Date(accessData.expiresAt).getTime();
    if (Number.isNaN(expiryTime)) {
      setSecondsLeft(0);
      return;
    }

    const updateRemaining = () => {
      const remaining = Math.max(0, Math.ceil((expiryTime - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };

    updateRemaining();
    const timer = window.setInterval(updateRemaining, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [accessData?.expiresAt]);

  const isExpired = secondsLeft <= 0;
  const progressValue = Math.max(0, Math.min(100, (secondsLeft / LINK_TTL_SECONDS) * 100));

  const handleSendRequest = async () => {
    if (!token || !fingerprint || !accessData || isExpired) return;

    try {
      setSubmitting(true);
      setRequestMessage('');
      setRequestSuccess(false);

      const response = await fetch('/api/auth/suspended-contact/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          fingerprint,
          reason,
        }),
      });

      const payload = (await response.json()) as RequestApiResponse;
      if (!response.ok || !payload?.ok) {
        setRequestMessage(payload?.msg || 'Unable to send request to admin.');
        setRequestSuccess(false);
        return;
      }

      setRequestMessage(payload?.msg || 'Request sent to admin.');
      setRequestSuccess(true);
      setAccessData((prev) =>
        prev
          ? {
              ...prev,
              pendingRequest: true,
            }
          : prev
      );
    } catch (error) {
      console.error('[suspended-contact] request failed', error);
      setRequestMessage('Unable to send request to admin.');
      setRequestSuccess(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background px-4 py-8 sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(56,189,248,0.22),transparent_36%)] dark:bg-[radial-gradient(circle_at_10%_10%,rgba(56,189,248,0.3),transparent_36%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_18%,rgba(244,63,94,0.18),transparent_34%)] dark:bg-[radial-gradient(circle_at_88%_18%,rgba(244,63,94,0.28),transparent_34%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.15),transparent_36%)] dark:bg-[radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.24),transparent_36%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-5xl">
        <div className="mb-5 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure Suspended Access
          </div>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/login">
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </Button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-border/70 bg-card/80 shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl">Contact Admin for Unsuspend</CardTitle>
              <CardDescription>
                This secure page works only for your bound device and expires in 5 minutes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingFingerprint || verifying ? (
                <div className="rounded-xl border border-border/70 bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying secure link and device fingerprint...
                  </p>
                </div>
              ) : null}

              {verifyError ? (
                <div className="rounded-xl border border-red-300/60 bg-red-50/80 px-3 py-3 text-sm text-red-900 dark:border-red-500/40 dark:bg-red-950/25 dark:text-red-100">
                  <p className="flex items-center gap-2 font-semibold">
                    <AlertTriangle className="h-4 w-4" />
                    Access blocked
                  </p>
                  <p className="mt-1">{verifyError}</p>
                  {verifyCode === 'TOKEN_EXPIRED' ? (
                    <p className="mt-1 text-xs text-red-700 dark:text-red-200">
                      Login again to generate a new secure link.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {accessData ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-border/70 bg-muted/35 p-3">
                      <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Student</p>
                      <p className="mt-1 text-sm font-semibold">{maskEmail(accessData.email)}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-muted/35 p-3">
                      <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Mobile</p>
                      <p className="mt-1 text-sm font-semibold">{maskMobile(accessData.mobile)}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-muted/35 p-3">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="inline-flex items-center gap-2 font-semibold">
                        <Clock3 className="h-4 w-4" />
                        Link expires in
                      </span>
                      <span className={isExpired ? 'font-semibold text-destructive' : 'font-semibold'}>
                        {formatTime(secondsLeft)}
                      </span>
                    </div>
                    <Progress className="mt-2 h-2" value={progressValue} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-request-reason">Message for admin</Label>
                    <Textarea
                      id="admin-request-reason"
                      value={reason}
                      onChange={(event) => setReason(event.target.value.slice(0, 400))}
                      className="min-h-[120px]"
                      placeholder="Write your request details for admin"
                    />
                    <p className="text-xs text-muted-foreground">{reason.length}/400 characters</p>
                  </div>

                  {requestMessage ? (
                    <p className={requestSuccess ? 'text-sm text-emerald-600' : 'text-sm text-destructive'}>
                      {requestMessage}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      className="gap-2"
                      disabled={submitting || isExpired || accessData.pendingRequest}
                      onClick={handleSendRequest}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : accessData.pendingRequest ? (
                        <>
                          <MailCheck className="h-4 w-4" />
                          Request Already Pending
                        </>
                      ) : (
                        <>
                          <MailCheck className="h-4 w-4" />
                          Contact Admin
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                      disabled={verifying || loadingFingerprint || !fingerprint}
                      onClick={() => {
                        void verifySecureLink();
                      }}
                    >
                      <RefreshCw className={verifying ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                      Refresh Status
                    </Button>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/80 shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xl">Security Rules</CardTitle>
              <CardDescription>Why this page is protected</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-xl border border-border/70 bg-muted/35 p-3">
                <p className="font-semibold text-foreground">Dynamic secure link</p>
                <p className="mt-1">Every suspended-login attempt creates a new secure link.</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/35 p-3">
                <p className="font-semibold text-foreground">Bound-device lock</p>
                <p className="mt-1">
                  Only your previously bound device fingerprint can open this page.
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/35 p-3">
                <p className="font-semibold text-foreground">Admin approval required</p>
                <p className="mt-1">
                  Student cannot reset device directly. Admin must approve pending request.
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/35 p-3">
                <p className="font-semibold text-foreground">Hard expiry</p>
                <p className="mt-1">Link automatically expires after 5 minutes.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
