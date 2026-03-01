'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LargePrice, Money } from '@/components/currency/price';
import { Footer } from '@/components/layout/footer';
import type { Course } from '@/lib/courses';
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Eye,
  GraduationCap,
  ListChecks,
  MousePointerClick,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

type BceceLeCourseClientProps = {
  slug: string;
  initialCourse: Course | null;
};

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/90 px-4 py-3 shadow-[0_16px_42px_-28px_rgba(15,23,42,0.45)] dark:border-slate-700/80 dark:bg-slate-900/80 dark:shadow-none">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-[0.1em]">{label}</span>
      </div>
      <p className="mt-2 text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}

export default function BceceLeCourseClient({
  slug,
  initialCourse,
}: BceceLeCourseClientProps) {
  const [course, setCourse] = useState<Course | null>(initialCourse);
  const [loading, setLoading] = useState(!initialCourse);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const [shareCount, setShareCount] = useState(initialCourse?.shareCount || 0);
  const [viewCount, setViewCount] = useState(initialCourse?.viewsCount || 0);
  const [enrollCount, setEnrollCount] = useState(initialCourse?.enrollClickCount || 0);

  useEffect(() => {
    let cancelled = false;

    const fetchCourse = async () => {
      try {
        const response = await fetch(`/api/courses?slug=${encodeURIComponent(slug)}`, {
          cache: 'no-store',
        });
        if (!response.ok) return;

        const payload = (await response.json()) as Course[] | Course;
        const foundCourse = Array.isArray(payload)
          ? payload.find((item) => item?.slug === slug)
          : payload;

        if (!foundCourse || cancelled) return;
        setCourse(foundCourse);
        setShareCount(foundCourse.shareCount || 0);
        setViewCount(foundCourse.viewsCount || 0);
        setEnrollCount(foundCourse.enrollClickCount || 0);

        if (!foundCourse._id) return;

        const [viewRes, shareRes, enrollRes] = await Promise.all([
          fetch(`/api/courses/${foundCourse._id}/view`, { method: 'POST' }).catch(() => null),
          fetch(`/api/courses/${foundCourse._id}/share`).catch(() => null),
          fetch(`/api/courses/${foundCourse._id}/enroll-click`).catch(() => null),
        ]);

        if (!cancelled && viewRes?.ok) {
          const data = (await viewRes.json()) as { viewsCount?: number };
          setViewCount(data.viewsCount || 0);
        }

        if (!cancelled && shareRes?.ok) {
          const data = (await shareRes.json()) as { shareCount?: number };
          setShareCount(data.shareCount || 0);
        }

        if (!cancelled && enrollRes?.ok) {
          const data = (await enrollRes.json()) as { enrollClickCount?: number };
          setEnrollCount(data.enrollClickCount || 0);
        }
      } catch (error) {
        console.error('[bcece-le] Failed to load course data:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCourse();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleShare = async () => {
    if (!course) return;
    try {
      let shared = false;

      if (navigator.share) {
        try {
          await navigator.share({
            title: course.title,
            text: course.shortDescription,
            url: window.location.href,
          });
          shared = true;
        } catch {
          return;
        }
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Course link copied to clipboard.');
        shared = true;
      }

      if (shared && course._id) {
        const response = await fetch(`/api/courses/${course._id}/share`, { method: 'POST' });
        if (response.ok) {
          const data = (await response.json()) as { shareCount?: number };
          setShareCount(data.shareCount || 0);
        }
      }
    } catch (error) {
      console.error('[bcece-le] Share failed:', error);
    }
  };

  const handleEnroll = async () => {
    if (!course) return;
    if (checkoutLoading) return;
    setCheckoutLoading(true);
    const activeSlug = (course.slug || slug || '').trim();
    let targetUrl = '';

    try {
      if (course._id) {
        const response = await fetch(`/api/courses/${course._id}/enroll-click`, {
          method: 'POST',
        });
        if (response.ok) {
          const data = (await response.json()) as { enrollClickCount?: number };
          setEnrollCount(data.enrollClickCount || 0);
        }
      }
    } catch (error) {
      console.error('[bcece-le] Enroll tracking failed:', error);
    }

    if (activeSlug) {
      try {
        const response = await fetch('/api/checkout-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseSlug: activeSlug,
            source: 'bcece-le',
            ref: 'bcece-le-landing',
          }),
        });
        if (response.ok) {
          const data = (await response.json()) as { checkoutUrl?: string };
          targetUrl = typeof data?.checkoutUrl === 'string' ? data.checkoutUrl : '';
        }
      } catch (error) {
        console.error('[bcece-le] Checkout link generation failed:', error);
      }
    }

    if (!targetUrl) {
      targetUrl = course.enrollRedirectUrl || '';
    }

    if (targetUrl) {
      window.setTimeout(() => {
        window.location.assign(targetUrl);
      }, 450);
      return;
    }

    setCheckoutLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 py-16">
        <div className="container mx-auto max-w-6xl">
          <div className="h-10 w-52 animate-pulse rounded-xl bg-muted/70 dark:bg-slate-800/75" />
          <div className="mt-4 h-14 w-3/4 animate-pulse rounded-xl bg-muted/70 dark:bg-slate-800/75" />
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="h-72 animate-pulse rounded-3xl bg-muted/70 dark:bg-slate-800/75" />
            <div className="h-72 animate-pulse rounded-3xl bg-muted/70 dark:bg-slate-800/75" />
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <>
        <div className="min-h-screen bg-background px-4 py-20 text-center">
          <h1 className="text-3xl font-bold text-foreground">Course Not Found</h1>
          <p className="mt-3 text-muted-foreground">
            BCECE LE course data could not be loaded.
          </p>
        </div>
        <Footer />
      </>
    );
  }

  const enrolledCount = course.studentsEnrolled || course.reviews || 0;
  const numericPrice = Number(course.price) || 0;
  const originalPriceFromDb = Number(course.originalPrice);
  const hasValidOriginal = Number.isFinite(originalPriceFromDb) && originalPriceFromDb > numericPrice;
  const discountFromDb = Number(course.discount) || 0;
  const computedOriginalPrice =
    !hasValidOriginal && discountFromDb > 0 && discountFromDb < 100
      ? Math.round((numericPrice * 100) / (100 - discountFromDb))
      : undefined;
  const displayOriginalPrice = hasValidOriginal ? originalPriceFromDb : computedOriginalPrice;
  const displayDiscount =
    displayOriginalPrice && displayOriginalPrice > numericPrice
      ? Math.round(((displayOriginalPrice - numericPrice) / displayOriginalPrice) * 100)
      : discountFromDb;
  const highlightItems = useMemo(() => {
    const source = course.whatYouLearn.length > 0 ? course.whatYouLearn : course.features;
    return source.slice(0, 6);
  }, [course.features, course.whatYouLearn]);
  const requirementItems =
    course.requirements.length > 0
      ? course.requirements
      : ['Basic diploma-level fundamentals', 'A smartphone or laptop with internet', 'Commitment to daily practice'];

  return (
    <>
      {checkoutLoading && (
        <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm">
          <div className="relative h-28 w-28 animate-pulse md:h-40 md:w-40">
            <Image
              src="/logo/1000010559.png"
              alt="Xmarty Creator Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <p className="mt-6 text-lg font-semibold text-foreground md:text-xl">
            Loading checkout page
          </p>
        </div>
      )}
      <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-100 text-foreground dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <section className="relative overflow-hidden border-b border-cyan-200/70 dark:border-cyan-300/15">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_52%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.25),transparent_55%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.15),transparent_48%)] dark:bg-[radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.15),transparent_52%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,#94a3b8_1px,transparent_1px),linear-gradient(to_bottom,#94a3b8_1px,transparent_1px)] [background-size:34px_34px]" />

          <div className="container relative z-10 mx-auto px-4 py-10 md:px-6 md:py-14">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="space-y-6"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="rounded-full border-cyan-300/70 bg-cyan-100 text-cyan-800 hover:bg-cyan-100 dark:border-cyan-300/35 dark:bg-cyan-500/15 dark:text-cyan-200 dark:hover:bg-cyan-500/22">
                    <Sparkles className="mr-1 h-3.5 w-3.5" />
                    BCECE LE Focus Program
                  </Badge>
                  <Badge className="rounded-full border-amber-300/70 bg-amber-100 text-amber-800 hover:bg-amber-100 dark:border-amber-300/35 dark:bg-amber-500/15 dark:text-amber-200 dark:hover:bg-amber-500/22">
                    {course.level}
                  </Badge>
                </div>

                <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-6xl">
                  {course.title}
                </h1>

                <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
                  {course.shortDescription || course.fullDescription}
                </p>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <StatTile icon={Users} label="Learners" value={enrolledCount.toLocaleString()} />
                  <StatTile icon={Clock3} label="Duration" value={course.duration || 'Self-paced'} />
                  <StatTile icon={Eye} label="Views" value={viewCount.toLocaleString()} />
                  <StatTile
                    icon={MousePointerClick}
                    label="Enroll Clicks"
                    value={enrollCount.toLocaleString()}
                  />
                </div>

                {highlightItems.length > 0 && (
                  <div className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-[0_20px_50px_-34px_rgba(15,23,42,0.4)] dark:border-slate-700/80 dark:bg-slate-900/78 dark:shadow-none">
                    <p className="text-sm font-semibold uppercase tracking-[0.13em] text-muted-foreground">
                      What You Will Master
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {highlightItems.map((item, index) => (
                        <span
                          key={`${item}-${index}`}
                          className="inline-flex items-center rounded-full border border-border/70 bg-muted/60 px-3 py-1 text-xs font-semibold text-foreground dark:border-slate-700/80 dark:bg-slate-900/65"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="h-fit lg:sticky lg:top-24"
              >
                <Card className="overflow-hidden rounded-3xl border border-border/70 bg-card/95 shadow-[0_28px_90px_-54px_rgba(15,23,42,0.55)] dark:border-slate-700/80 dark:bg-slate-900/84 dark:shadow-[0_28px_90px_-48px_rgba(2,6,23,0.85)]">
                  <div className="relative h-56 w-full border-b border-border/70">
                    <Image
                      src={course.coverImage || 'https://picsum.photos/seed/bcece-le-course/1000/700'}
                      alt={course.title}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 35vw, 100vw"
                    />
                    {displayDiscount > 0 && (
                      <span className="absolute right-3 top-3 rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white">
                        {displayDiscount}% OFF
                      </span>
                    )}
                  </div>

                  <CardContent className="space-y-6 p-6">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.11em] text-muted-foreground">
                        Current Admission Fee
                      </p>
                      <LargePrice
                        value={numericPrice}
                        originalValue={displayOriginalPrice}
                        discount={displayDiscount}
                        showDiscount
                      />
                    </div>

                    <div className="space-y-3">
                      <Button
                        onClick={handleEnroll}
                        disabled={checkoutLoading}
                        className="h-12 w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-base font-semibold text-white hover:from-cyan-500 hover:to-blue-500"
                      >
                        Enroll For BCECE LE
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        onClick={handleShare}
                        className="h-11 w-full border-border bg-background text-foreground hover:bg-muted dark:border-slate-700/75 dark:bg-slate-900/65 dark:hover:bg-slate-800/75"
                      >
                        <Share2 className="mr-2 h-4 w-4" />
                        Share ({shareCount})
                      </Button>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-muted/45 p-4 text-sm dark:border-slate-700/75 dark:bg-slate-900/66">
                      <div className="flex items-center justify-between py-1">
                        <span className="text-muted-foreground">Course Level</span>
                        <span className="font-semibold text-foreground">{course.level}</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="font-semibold text-foreground">{course.duration}</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-muted-foreground">Active Learners</span>
                        <span className="font-semibold text-foreground">
                          {enrolledCount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-10 md:px-6 md:py-14">
          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="space-y-6">
              <Card className="rounded-3xl border border-border/70 bg-card/90 dark:border-slate-700/80 dark:bg-slate-900/78">
                <CardContent className="p-6 md:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.11em] text-muted-foreground">
                    About This Course
                  </p>
                  <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                    Deep-Focus Preparation For BCECE LE
                  </h2>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                    {course.fullDescription}
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border border-border/70 bg-card/90 dark:border-slate-700/80 dark:bg-slate-900/78">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center gap-2">
                    <BookOpenCheck className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
                    <h3 className="text-2xl font-bold text-foreground">What You Will Learn</h3>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {(course.whatYouLearn.length ? course.whatYouLearn : course.features).map((item, index) => (
                      <div
                        key={`${item}-${index}`}
                        className="flex items-start gap-2 rounded-xl border border-border/70 bg-muted/45 px-3 py-2.5 dark:border-slate-700/75 dark:bg-slate-900/66"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <p className="text-sm text-foreground">{item}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border border-border/70 bg-card/90 dark:border-slate-700/80 dark:bg-slate-900/78">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                    <h3 className="text-2xl font-bold text-foreground">Course Roadmap</h3>
                  </div>

                  <div className="mt-5 space-y-3">
                    {course.curriculum.length > 0 ? (
                      course.curriculum.map((module, index) => {
                        const moduleId = module.moduleId || `module-${index}`;
                        const isExpanded = expandedModuleId === moduleId;

                        return (
                          <div
                            key={moduleId}
                            className="overflow-hidden rounded-2xl border border-border/70 bg-muted/45 dark:border-slate-700/75 dark:bg-slate-900/66"
                          >
                            <button
                              type="button"
                              className="flex w-full items-center justify-between px-4 py-3 text-left"
                              onClick={() => setExpandedModuleId(isExpanded ? null : moduleId)}
                            >
                              <div>
                                <p className="font-semibold text-foreground">
                                  {module.moduleName || `Module ${index + 1}`}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {module.lessons.length} lessons
                                </p>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </button>

                            {isExpanded && (
                              <div className="space-y-2 border-t border-border/70 px-4 py-3">
                                {module.lessons.map((lesson, lessonIndex) => (
                                  <div
                                    key={lesson.lessonId || `${moduleId}-lesson-${lessonIndex}`}
                                    className="flex items-center justify-between rounded-xl bg-background/85 px-3 py-2 text-sm dark:bg-slate-900/88"
                                  >
                                    <span className="text-foreground">{lesson.title}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {lesson.duration}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                        Curriculum will be updated soon.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
              <Card className="rounded-3xl border border-border/70 bg-card/90 dark:border-slate-700/80 dark:bg-slate-900/78">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                    <h3 className="text-xl font-bold text-foreground">Course Includes</h3>
                  </div>
                  <div className="mt-4 space-y-2.5">
                    {(course.features.length ? course.features : course.whatYouLearn).map((feature, index) => (
                      <div key={`${feature}-${index}`} className="flex items-start gap-2">
                        <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <p className="text-sm text-foreground">{feature}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border border-border/70 bg-card/90 dark:border-slate-700/80 dark:bg-slate-900/78">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                    <h3 className="text-xl font-bold text-foreground">Requirements</h3>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-foreground">
                    {requirementItems.map((item, index) => (
                      <li key={`${item}-${index}`} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {course.instructor?.name && (
          <section className="container mx-auto px-4 pb-10 md:px-6 md:pb-14">
            <Card className="overflow-hidden rounded-3xl border border-border/70 bg-card/90 dark:border-slate-700/80 dark:bg-slate-900/78">
              <CardContent className="p-6 md:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.11em] text-muted-foreground">
                  Instructor
                </p>
                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Image
                    src={course.instructor.image || 'https://picsum.photos/seed/bcece-instructor/120/120'}
                    alt={course.instructor.name}
                    width={96}
                    height={96}
                    className="h-24 w-24 rounded-2xl object-cover ring-2 ring-cyan-300/50 dark:ring-cyan-300/35"
                  />
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">
                      {course.instructor.name}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-cyan-700 dark:text-cyan-300">
                      {course.instructor.title}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {course.instructor.bio}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        <section className="container mx-auto px-4 pb-14 md:px-6 md:pb-20">
          <Card className="rounded-3xl border border-cyan-200 bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_28px_90px_-45px_rgba(2,132,199,0.6)] dark:border-cyan-200/25">
            <CardContent className="flex flex-col items-center px-6 py-10 text-center md:py-14">
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-cyan-100">
                Start Your Attempt
              </p>
              <h2 className="mt-3 max-w-2xl text-3xl font-extrabold leading-tight md:text-5xl">
                Secure Your BCECE LE Seat With Structured Prep
              </h2>
              <p className="mt-4 max-w-2xl text-cyan-100">
                Structured modules, focused problem practice, and exam-driven guidance in one place.
              </p>

              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
                <Button
                  onClick={handleEnroll}
                  disabled={checkoutLoading}
                  className="h-12 bg-white px-8 text-base font-semibold text-blue-700 hover:bg-cyan-100"
                >
                  Enroll Now
                </Button>
                <div className="inline-flex items-center rounded-full border border-cyan-100/50 px-4 py-2 text-sm font-semibold">
                  Current Fee:
                  <span className="ml-1.5">
                    <Money
                      value={numericPrice}
                      size="sm"
                      symbolClassName="!text-white"
                      valueClassName="!text-white"
                    />
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
      <Footer />
    </>
  );
}
