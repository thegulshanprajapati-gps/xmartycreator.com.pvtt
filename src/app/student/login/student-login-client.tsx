'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  KeyRound,
  Loader2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function StudentLoginClient({
  googleConfigured,
}: {
  googleConfigured: boolean;
}) {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/courses';
  const prefersReducedMotion = useReducedMotion();

  const isLoading = status === 'loading';
  const canSignIn = googleConfigured && !isLoading;
  const statusCopy = isLoading
    ? 'Checking your session...'
    : 'Sign in with Google to continue.';

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(callbackUrl);
    }
  }, [callbackUrl, router, status]);

  const handleGoogleSignIn = async () => {
    if (!googleConfigured) return;
    await signIn('google', { callbackUrl });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: prefersReducedMotion
        ? { duration: 0 }
        : { duration: 0.6, staggerChildren: 0.12 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: prefersReducedMotion ? { duration: 0 } : { duration: 0.55, ease: 'easeOut' },
    },
  };

  const featureList = [
    {
      icon: BookOpen,
      title: 'Courses Dashboard',
      description: 'Resume lessons and track progress from one place.',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Sign-In',
      description: 'Google OAuth keeps your account protected.',
    },
    {
      icon: Sparkles,
      title: 'Smart Updates',
      description: 'Get the latest lessons and community news fast.',
    },
    {
      icon: KeyRound,
      title: 'One-Click Access',
      description: 'No passwords. Just tap and start learning.',
    },
  ];

  return (
    <motion.main
      className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.12),_transparent_45%)] dark:bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.25),_transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_70%,_rgba(236,72,153,0.18),_transparent_45%)] dark:bg-[radial-gradient(circle_at_20%_70%,_rgba(236,72,153,0.26),_transparent_45%)]" />
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-pink-400/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-gradient-to-br from-emerald-400/20 via-cyan-400/10 to-blue-500/20 blur-3xl" />
      </div>

      <div className="container mx-auto grid min-h-[calc(100vh-4rem)] items-center gap-10 px-4 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
        <motion.section className="relative z-10 space-y-8" variants={itemVariants}>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4" />
            Student Portal
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-headline font-semibold text-foreground md:text-5xl">
              Welcome back. Let's get you learning.
            </h1>
            <p className="max-w-xl text-base text-muted-foreground md:text-lg">
              Everything you need as a student, from your latest lessons to
              community updates, is waiting inside.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {featureList.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-border/60 bg-background/70 p-4 shadow-sm backdrop-blur hover-lift"
                >
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Secure Google OAuth
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1">
              <KeyRound className="h-4 w-4 text-primary" />
              No password needed
            </span>
          </div>
        </motion.section>

        <motion.section className="relative z-10" variants={itemVariants}>
          <Card className="w-full border-border/60 bg-background/85 shadow-xl backdrop-blur">
            <CardHeader className="space-y-2">
              <CardTitle className="text-3xl font-headline">Student Login</CardTitle>
              <CardDescription>
                {statusCopy} Your student profile is created automatically on
                first sign in.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Button
                type="button"
                size="lg"
                className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleGoogleSignIn}
                disabled={!canSignIn}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking session...
                  </>
                ) : (
                  <>
                    Continue with Google
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">New to Xmarty?</p>
                <p className="mt-1">
                  Your account is created automatically after the first Google
                  sign in.
                </p>
              </div>

              {!googleConfigured && (
                <p className="text-sm text-destructive">
                  Google OAuth is not configured. Add `GOOGLE_CLIENT_ID` and
                  `GOOGLE_CLIENT_SECRET` in `.env`.
                </p>
              )}

              <p className="text-xs text-muted-foreground">
                By continuing, you agree to our{' '}
                <Link className="font-semibold text-primary hover:underline" href="/terms-of-service">
                  Terms
                </Link>{' '}
                and{' '}
                <Link className="font-semibold text-primary hover:underline" href="/privacy-policy">
                  Privacy Policy
                </Link>
                .
              </p>
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </motion.main>
  );
}
