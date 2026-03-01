'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Clock3,
  GraduationCap,
  type LucideIcon,
  Medal,
  NotebookPen,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DEFAULT_HERO_FALLBACK_CONTENT,
  fetchHeroContent,
  type HeroContent,
} from '@/lib/api/hero-service';

type DynamicHeroProps = {
  useDefaultFallback?: boolean;
  fallbackContent?: HeroContent;
  className?: string;
};

type RightPanelMetric = {
  label: string;
  value: number;
  suffix?: string;
  progress: number;
  Icon: LucideIcon;
};

const hardcodedRightPanel = {
  badge: 'Learning Snapshot',
  title: 'This Week at Xmarty',
  subtitle: 'Live classes and fast mentor support.',
  spotlight: {
    label: 'Next Live Class',
    value: 'Aptitude Sprint | 8:00 PM',
  },
  metrics: [
    {
      label: 'Mock Coverage',
      value: 78,
      suffix: '%',
      progress: 78,
      Icon: Target,
    },
    {
      label: 'Doubt Resolution',
      value: 93,
      suffix: '%',
      progress: 93,
      Icon: ShieldCheck,
    },
  ] satisfies RightPanelMetric[],
  chips: [
    '24h mentor reply',
    'Interview drills',
  ],
};

const floatingIcons = [
  { Icon: GraduationCap, top: '12%', left: '7%', delay: 0 },
  { Icon: BookOpen, top: '20%', right: '8%', delay: 0.35 },
  { Icon: Medal, top: '52%', left: '3%', delay: 0.7 },
  { Icon: NotebookPen, bottom: '20%', right: '10%', delay: 1.05 },
  { Icon: Trophy, bottom: '14%', left: '14%', delay: 1.4 },
];

function safeHref(href: string) {
  const value = href.trim();
  if (!value) return '#';
  if (value.startsWith('/') || value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  return '#';
}

function useAnimatedValue(target: number, durationMs = 1400) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frameId = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / durationMs, 1);
      setValue(target * progress);
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [durationMs, target]);

  return value;
}

function AnimatedStatValue({ value, suffix = '' }: { value: number; suffix?: string }) {
  const animated = useAnimatedValue(value);
  const formatted = Number.isInteger(value) ? Math.round(animated).toLocaleString() : animated.toFixed(1);
  return <span>{formatted}{suffix}</span>;
}

function HeroLoadingState() {
  return (
    <section className="relative flex h-[calc(100vh-4rem)] min-h-[calc(100vh-4rem)] w-full items-center overflow-hidden bg-slate-100 dark:bg-[#090d24] min-[320px]:h-[calc(100dvh-4rem)] min-[320px]:min-h-[calc(100dvh-4rem)] lg:h-[calc(100vh-10rem)] lg:min-h-[calc(100vh-10rem)]">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-indigo-50 to-rose-100 dark:from-[#040910] dark:via-[#0a1728] dark:to-[#102437]" />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="h-12 w-3/4 animate-pulse rounded-xl bg-slate-300/60 dark:bg-white/20" />
            <div className="h-5 w-full animate-pulse rounded-lg bg-slate-300/50 dark:bg-white/15" />
            <div className="h-5 w-2/3 animate-pulse rounded-lg bg-slate-300/50 dark:bg-white/15" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 animate-pulse rounded-2xl bg-slate-300/50 dark:bg-white/15" />
            <div className="h-24 animate-pulse rounded-2xl bg-slate-300/50 dark:bg-white/15" />
            <div className="h-24 animate-pulse rounded-2xl bg-slate-300/50 dark:bg-white/15" />
            <div className="h-24 animate-pulse rounded-2xl bg-slate-300/50 dark:bg-white/15" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function DynamicHeroSection({
  useDefaultFallback = true,
  fallbackContent = DEFAULT_HERO_FALLBACK_CONTENT,
  className = '',
}: DynamicHeroProps) {
  const [heroContent, setHeroContent] = useState<HeroContent | null>(null);
  const [requestCompleted, setRequestCompleted] = useState(false);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, 3000);

    const loadContent = async () => {
      setRequestCompleted(false);
      try {
        const apiContent = await fetchHeroContent(controller.signal);
        if (!mounted) return;

        if (apiContent) {
          setHeroContent(apiContent);
        } else {
          setHeroContent(null);
        }
      } catch {
        if (!mounted) return;
        if (!useDefaultFallback) {
          setHeroContent(null);
        }
      } finally {
        window.clearTimeout(timeoutId);
        if (mounted) {
          setRequestCompleted(true);
        }
      }
    };

    loadContent();
    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [useDefaultFallback]);

  const leftContent = useMemo(
    () => heroContent || (useDefaultFallback ? fallbackContent : null),
    [fallbackContent, heroContent, useDefaultFallback]
  );

  if (!leftContent && !requestCompleted) {
    return <HeroLoadingState />;
  }

  if (!leftContent) {
    return null;
  }

  return (
    <section className={`relative flex h-[calc(100vh-4rem)] min-h-[calc(100vh-4rem)] w-full items-center overflow-hidden min-[320px]:h-[calc(100dvh-4rem)] min-[320px]:min-h-[calc(100dvh-4rem)] lg:h-[calc(100vh-10rem)] lg:min-h-[calc(100vh-10rem)] ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-indigo-50 to-rose-100 dark:from-[#040910] dark:via-[#0a1728] dark:to-[#102437]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(37,99,235,0.18),transparent_42%),radial-gradient(circle_at_82%_74%,rgba(168,85,247,0.14),transparent_40%)] dark:bg-[radial-gradient(circle_at_18%_22%,rgba(34,211,238,0.2),transparent_46%),radial-gradient(circle_at_84%_76%,rgba(59,130,246,0.22),transparent_44%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_55%_42%,rgba(255,255,255,0.58),transparent_66%)] dark:bg-[radial-gradient(circle_at_52%_45%,rgba(148,163,184,0.14),transparent_62%)]" />

      {floatingIcons.map((item, index) => (
        <motion.div
          key={`floating-icon-only-${index}`}
          className="pointer-events-none absolute z-10 text-indigo-600/30 [filter:drop-shadow(0_0_14px_rgba(79,70,229,0.2))] dark:text-cyan-100/30 dark:[filter:drop-shadow(0_0_14px_rgba(56,189,248,0.24))]"
          style={{ top: item.top, left: item.left, right: item.right, bottom: item.bottom }}
          animate={{ y: [0, -14, 0], rotate: [0, 3, 0, -3, 0] }}
          transition={{
            duration: 5.8,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: item.delay,
          }}
        >
          <item.Icon className="h-8 w-8 sm:h-10 sm:w-10" />
        </motion.div>
      ))}

      <div className="relative z-20 mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <motion.div
          className="grid items-center gap-6 rounded-[22px] border border-slate-200/80 bg-white/[0.72] p-4 shadow-[0_30px_80px_-60px_rgba(59,130,246,0.45)] backdrop-blur-[10px] dark:border-white/15 dark:bg-[#0d132f]/75 dark:shadow-[0_48px_100px_-70px_rgba(8,15,40,0.92)] sm:p-6 lg:grid-cols-2"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            opacity: { duration: 0.55, ease: 'easeOut' },
          }}
        >
          <div className="space-y-4 text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
              {leftContent.heading}
            </h1>
            <p className="text-base leading-relaxed text-slate-700 dark:text-slate-100/90 sm:text-lg">
              {leftContent.subheading}
            </p>
            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:justify-center lg:justify-start">
              <Button
                asChild
                size="lg"
                className="h-11 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 px-6 text-sm font-semibold text-white hover:from-sky-500 hover:to-cyan-400"
              >
                <Link href={safeHref(leftContent.primaryButtonLink)}>{leftContent.primaryButtonText}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="h-11 rounded-xl border border-slate-300/80 bg-white/80 px-6 text-sm font-semibold text-slate-700 hover:bg-white dark:border-slate-200/25 dark:bg-slate-100/10 dark:text-slate-100 dark:hover:bg-slate-100/15"
              >
                <Link href={safeHref(leftContent.secondaryButtonLink)}>{leftContent.secondaryButtonText}</Link>
              </Button>
            </div>
          </div>

          <div className="group hover-lift relative overflow-hidden rounded-3xl border border-indigo-200/80 bg-gradient-to-br from-white via-indigo-50/90 to-fuchsia-50/80 p-4 shadow-[0_26px_84px_-58px_rgba(168,85,247,0.38)] backdrop-blur-md transition-all duration-300 hover:border-fuchsia-300/80 hover:shadow-[0_34px_95px_-58px_rgba(217,70,239,0.38)] dark:border-sky-300/25 dark:bg-gradient-to-br dark:from-[#0e1a2d] dark:via-[#12263c] dark:to-[#103247] dark:shadow-[0_34px_90px_-58px_rgba(2,8,23,0.9)] dark:hover:border-cyan-300/45 dark:hover:shadow-[0_44px_108px_-64px_rgba(2,8,23,0.94)] sm:p-5">
            <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-fuchsia-300/30 blur-3xl dark:bg-cyan-300/[0.16]" />
            <div className="pointer-events-none absolute -bottom-14 -left-14 h-36 w-36 rounded-full bg-violet-200/38 blur-3xl dark:bg-sky-300/[0.12]" />
            <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-violet-300/80 via-fuchsia-400/80 to-sky-300/75 opacity-90 dark:from-cyan-200/70 dark:via-sky-300/75 dark:to-emerald-200/65" />

            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-700/95 dark:text-cyan-100/95">
                    {hardcodedRightPanel.badge}
                  </p>
                  <p className="mt-1.5 text-xl font-semibold leading-tight text-slate-900 dark:text-slate-50">
                    {hardcodedRightPanel.title}
                  </p>
                </div>
                <div className="rounded-lg border border-violet-200/75 bg-slate-100/[0.92] p-2 text-violet-700 transition-colors duration-300 dark:border-slate-700/70 dark:bg-slate-800/[0.76] dark:text-cyan-100">
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>

              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200/90">{hardcodedRightPanel.subtitle}</p>

              <div className="mt-3.5 rounded-xl border border-slate-200/80 bg-slate-100/[0.92] p-3 transition-colors duration-300 dark:border-slate-700/70 dark:bg-slate-800/[0.76]">
                <div className="flex items-center gap-2 text-violet-700 dark:text-cyan-100">
                  <Clock3 className="h-4 w-4" />
                  <span className="text-[11px] font-medium uppercase tracking-[0.12em]">
                    {hardcodedRightPanel.spotlight.label}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-slate-50 sm:text-base">
                  {hardcodedRightPanel.spotlight.value}
                </p>
              </div>

              <div className="mt-3.5 space-y-2.5">
                {hardcodedRightPanel.metrics.map((metric) => (
                  <div key={metric.label} className="rounded-xl border border-slate-200/80 bg-slate-100/[0.92] p-3 transition-colors duration-300 dark:border-slate-700/70 dark:bg-slate-800/[0.76]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-violet-100 p-1.5 text-violet-700 dark:bg-cyan-300/16 dark:text-cyan-100">
                          <metric.Icon className="h-4 w-4" />
                        </span>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{metric.label}</p>
                      </div>
                      <p className="text-sm font-semibold text-violet-700 dark:text-cyan-100">
                        <AnimatedStatValue value={metric.value} suffix={metric.suffix} />
                      </p>
                    </div>

                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-violet-200/45 dark:bg-slate-200/16">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 dark:from-cyan-300 dark:via-sky-300 dark:to-emerald-300"
                        initial={{ width: 0 }}
                        animate={{ width: `${metric.progress}%` }}
                        transition={{ duration: 1.1, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3.5 grid gap-2 sm:grid-cols-2">
                {hardcodedRightPanel.chips.map((note) => (
                  <p
                    key={note}
                    className="rounded-lg border border-violet-200/80 bg-violet-50/95 px-3 py-1.5 text-xs font-medium text-violet-800 transition-colors duration-300 dark:border-cyan-200/20 dark:bg-slate-900/[0.76] dark:text-cyan-100"
                  >
                    {note}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
