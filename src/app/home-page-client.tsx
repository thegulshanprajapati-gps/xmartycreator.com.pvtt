
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Award,
  BookMarked,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  FileText,
  FlaskConical,
  GraduationCap,
  Laptop,
  MessageCircleQuestion,
  Milestone,
  NotebookPen,
  Users,
  UsersRound,
  Video,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { useState, useEffect, useRef, useMemo } from 'react';
import { trackLinkClick } from '@/app/analytics/actions';
import { Footer } from '@/components/layout/footer';
import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";
import DynamicHeroSection from '@/components/hero/dynamic-hero';

export type Review = {
    name: string;
    role: string;
    testimonial: string;
    rating: number;
    avatar: string;
    gender?: 'male' | 'female';
};

type BannerAnimation = 'slide' | 'pulse' | 'bounce';

type ImagePlaceholder = {
  id: string;
  imageUrl: string;
  description?: string;
  title?: string;
  imageHint?: string;
};

type HomeContent = {
    hero: {
        title: string;
        description: string;
        buttons: {
            primary: { text: string; link: string };
            secondary: { text: string; link: string };
        };
        background: {
            useImage: boolean;
            imageId: string;
            image?: ImagePlaceholder;
        };
    };
    scrollingBanner: {
        enabled: boolean;
        text: string;
        linkText: string;
        linkHref: string;
        imageId: string;
        animation: BannerAnimation;
        image?: ImagePlaceholder;
    };
    quickAccess: {
        title: string;
        description: string;
        columns: 3 | 4;
        items: { title: string; description: string; imageId: string; link: string }[];
    };
    whyChooseUs: {
        title: string;
        description: string;
        features: { title: string; description: string }[];
    };
    testimonials: {
        title: string;
        description: string;
        reviews: Review[];
    };
    achievements: {
        badge: string;
        title: string;
        description: string;
        stats: { value: number; suffix: string; label: string }[];
    };
};

type QuickLink = HomeContent['quickAccess']['items'][number] & { icon: LucideIcon };

const quickAccessIconHints: { keyword: string; icon: LucideIcon }[] = [
  { keyword: 'note', icon: FileText },
  { keyword: 'syllabus', icon: GraduationCap },
  { keyword: 'book', icon: BookMarked },
  { keyword: 'reference', icon: BookMarked },
  { keyword: 'pyq', icon: ClipboardList },
  { keyword: 'question', icon: ClipboardList },
  { keyword: 'practical', icon: FlaskConical },
  { keyword: 'lab', icon: FlaskConical },
  { keyword: 'team', icon: UsersRound },
  { keyword: 'group', icon: UsersRound },
];

const quickAccessFallbackIcons: LucideIcon[] = [
  FileText,
  GraduationCap,
  BookOpen,
  FlaskConical,
  ClipboardList,
  Users,
  NotebookPen,
];

const normalizeReviewGender = (value: unknown): 'male' | 'female' =>
  value === 'female' ? 'female' : 'male';

const getReviewAvatar = (name: string, gender: 'male' | 'female') => {
  const safeSeed = encodeURIComponent((name || 'user').replace(/\s/g, '') || 'user');
  const style = gender === 'female' ? 'lorelei' : 'adventurer';
  return `https://api.dicebear.com/8.x/${style}/svg?seed=${safeSeed}`;
};

const resolveQuickAccessIcon = (title: string, index: number): LucideIcon => {
  const normalizedTitle = (title || '').toLowerCase();
  const match = quickAccessIconHints.find(({ keyword }) => normalizedTitle.includes(keyword));
  return match ? match.icon : quickAccessFallbackIcons[index % quickAccessFallbackIcons.length];
};

const normalizeBannerAnimation = (value: unknown): BannerAnimation =>
  value === 'pulse' || value === 'bounce' ? value : 'slide';

const getBannerAnimationClass = (animation: BannerAnimation) => {
  if (animation === 'pulse') return 'animate-pulse';
  if (animation === 'bounce') return 'animate-bounce';
  return '';
};

interface HomePageClientProps {
  initialHomeContent: HomeContent;
  hideHeroSection?: boolean;
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};


const AnimatedCounter = ({ value, suffix = '' }: { value: number; suffix?: string }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, latest => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLParagraphElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, { duration: 2.5, ease: "easeOut" });
      return controls.stop;
    }
  }, [isInView, count, value]);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (latest) => {
      setDisplayValue(latest);
    });
    return () => unsubscribe();
  }, [rounded]);

  return (
    <p ref={ref} className="text-5xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
      {displayValue.toLocaleString()}{suffix}
    </p>
  );
};

export default function HomePageClient({ initialHomeContent, hideHeroSection = false }: HomePageClientProps) {
  const rawQuickAccessItems = Array.isArray(initialHomeContent?.quickAccess?.items)
    ? initialHomeContent!.quickAccess.items
    : [];
  const quickLinks: QuickLink[] = rawQuickAccessItems
    .filter((item): item is HomeContent['quickAccess']['items'][number] => !!item && typeof item === 'object')
    .map((course, index) => ({
      ...course,
      title: course.title || '',
      description: course.description || '',
      imageId: course.imageId || '',
      link: course.link || '',
      icon: resolveQuickAccessIcon(course.title || '', index),
    }));
  const quickAccessColumns = Number(initialHomeContent?.quickAccess?.columns) === 4 ? 4 : 3;
  const quickAccessGridClass = quickAccessColumns === 4
    ? 'mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6'
    : 'mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8';

  const bannerAnimation = normalizeBannerAnimation(initialHomeContent?.scrollingBanner?.animation);
  const bannerImage = initialHomeContent?.scrollingBanner?.image;
  const bannerContent = {
    enabled: initialHomeContent?.scrollingBanner?.enabled === true,
    text: (initialHomeContent?.scrollingBanner?.text || '').trim(),
    linkText: (initialHomeContent?.scrollingBanner?.linkText || 'Learn more').trim() || 'Learn more',
    linkHref: (initialHomeContent?.scrollingBanner?.linkHref || '#').trim() || '#',
    imageUrl: bannerImage?.imageUrl || '',
    imageAlt: bannerImage?.title || bannerImage?.description || 'Banner image',
    animation: bannerAnimation,
  };
  const showScrollingBanner = bannerContent.enabled && !!bannerContent.text;
  const bannerAnimationClass = getBannerAnimationClass(bannerContent.animation);

  const heroHeading =
    (initialHomeContent?.hero?.title || '').replace(/<[^>]*>/g, '').trim() ||
    'BCECE LE 2026 Admissions Open';
  const heroSubheading =
    (initialHomeContent?.hero?.description || '').replace(/<[^>]*>/g, '').trim() ||
    'Limited Seats \u2022 Batch Starting Soon \u2022 Expert Faculty';
  const heroPrimaryText = (initialHomeContent?.hero?.buttons?.primary?.text || '').trim() || 'Enroll Now';
  const heroPrimaryLink = (initialHomeContent?.hero?.buttons?.primary?.link || '').trim() || '/courses';
  const heroSecondaryText =
    (initialHomeContent?.hero?.buttons?.secondary?.text || '').trim() || 'Download Syllabus';
  const heroSecondaryLink = (initialHomeContent?.hero?.buttons?.secondary?.link || '').trim() || '#';
  const heroBackgroundUseImage = initialHomeContent?.hero?.background?.useImage === true;
  const heroBackgroundImageUrl = (initialHomeContent?.hero?.background?.image?.imageUrl || '').trim();
  const heroBackgroundImageAlt =
    initialHomeContent?.hero?.background?.image?.title
    || initialHomeContent?.hero?.background?.image?.description
    || 'Hero background';
  const dynamicHeroFallback = useMemo(
    () => ({
      heading: heroHeading,
      subheading: heroSubheading,
      primaryButtonText: heroPrimaryText,
      primaryButtonLink: heroPrimaryLink,
      secondaryButtonText: heroSecondaryText,
      secondaryButtonLink: heroSecondaryLink,
      isActive: true,
    }),
    [
      heroHeading,
      heroSubheading,
      heroPrimaryText,
      heroPrimaryLink,
      heroSecondaryText,
      heroSecondaryLink,
    ]
  );

  // Debug logging
  useEffect(() => {
    console.log('🎯 [Home Page Client] Quick Access items:', {
      total: quickLinks.length,
      items: quickLinks.map(c => ({ title: c.title, imageId: c.imageId }))
    });
  }, [quickLinks]);

  const rawWhyChooseUs = Array.isArray(initialHomeContent?.whyChooseUs?.features)
    ? initialHomeContent!.whyChooseUs.features
    : [];
  const whyChooseUs = rawWhyChooseUs
    .filter((feature): feature is HomeContent['whyChooseUs']['features'][number] => !!feature && typeof feature === 'object')
    .map((feature, index) => {
    const icons = [<Laptop className="h-6 w-6" />, <MessageCircleQuestion className="h-6 w-6" />, <Milestone className="h-6 w-6" />, <Award className="h-6 w-6" />];
    return {
      ...feature,
      title: feature.title || '',
      description: feature.description || '',
      icon: icons[index]
    }
  });
  
  const rawReviews = Array.isArray(initialHomeContent?.testimonials?.reviews)
    ? initialHomeContent!.testimonials.reviews
    : [];
  const initialReviews = rawReviews
    .filter((review): review is Review => !!review && typeof review === 'object')
    .map((r) => {
      const safeName = r.name || 'Anonymous';
      const gender = normalizeReviewGender((r as any).gender);
      return {
        ...r,
        name: safeName,
        role: r.role || '',
        testimonial: r.testimonial || '',
        rating: Number.isFinite(r.rating) ? Math.max(1, Math.min(5, r.rating)) : 5,
        gender,
        avatar: r.avatar || getReviewAvatar(safeName, gender),
      };
    });
  const [testimonials] = useState<Review[]>(initialReviews);

  useEffect(() => {
    console.log('?? [Home Page] Testimonials loaded', {
      title: initialHomeContent?.testimonials?.title || '',
      description: initialHomeContent?.testimonials?.description || '',
      count: initialReviews.length,
      reviews: initialReviews,
    });
  }, [initialHomeContent, initialReviews.length]);

  const defaultAchievements = {
    badge: "Proven Track Record",
    title: "Our Impact by the Numbers",
    description: "Join thousands of learners who are transforming their careers and skills",
    stats: [
      { value: 50000, label: "Happy Students", suffix: "+" },
      { value: 50, label: "Expert Courses", suffix: "+" },
      { value: 1000, label: "Hours of Content", suffix: "+" },
      { value: 20, label: "Awards Won", suffix: "+" },
    ],
  };

  const achievementsContent = {
    badge: initialHomeContent?.achievements?.badge || defaultAchievements.badge,
    title: initialHomeContent?.achievements?.title || defaultAchievements.title,
    description: initialHomeContent?.achievements?.description || defaultAchievements.description,
    stats: Array.isArray(initialHomeContent?.achievements?.stats)
      ? initialHomeContent.achievements.stats
      : defaultAchievements.stats,
  };

  const achievementIcons: LucideIcon[] = [Users, BookOpen, Video, Award];
  const achievementDefaults = defaultAchievements.stats;
  const achievements = (achievementsContent.stats.length > 0
    ? achievementsContent.stats
    : achievementDefaults
  ).slice(0, 4).map((item, index) => ({
    icon: achievementIcons[index % achievementIcons.length],
    value: Number.isFinite(Number(item?.value)) ? Number(item.value) : achievementDefaults[index]?.value || 0,
    label: (item?.label || achievementDefaults[index]?.label || "").trim(),
    suffix: (item?.suffix || achievementDefaults[index]?.suffix || "").trim(),
  }));

  return (
    <>
      <div className="flex min-h-screen flex-col overflow-x-clip">
        {/* ===== HERO SECTION ===== */}
        {hideHeroSection && (
          <DynamicHeroSection
            useDefaultFallback
            fallbackContent={dynamicHeroFallback}
          />
        )}
        {!hideHeroSection && (
        <section className="relative mx-auto flex h-[calc(100vh-4rem)] min-h-[calc(100vh-4rem)] w-full max-w-full items-center justify-center overflow-hidden py-8 min-[320px]:h-[calc(100dvh-4rem)] min-[320px]:min-h-[calc(100dvh-4rem)] sm:py-10 lg:h-[calc(100vh-10rem)] lg:min-h-[calc(100vh-10rem)]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#051236] via-[#020617] to-[#000000]" />

          {heroBackgroundUseImage && heroBackgroundImageUrl ? (
            <>
              <Image
                src={heroBackgroundImageUrl}
                alt={heroBackgroundImageAlt}
                fill
                sizes="100vw"
                priority
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(3,7,18,0.84),rgba(7,10,30,0.62),rgba(10,8,25,0.88))]" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(147,51,234,0.28),transparent_62%)]" />
            </>
          ) : (
            <>
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.34),transparent_45%),radial-gradient(circle_at_80%_75%,rgba(236,72,153,0.24),transparent_48%)]" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(56,189,248,0.12),transparent_70%)]" />
            </>
          )}

          <div className="container relative z-10 mx-auto flex h-full min-h-full items-center justify-center px-4 sm:px-6">
            <motion.div
              className="w-full max-w-6xl rounded-[18px] border border-white/10 bg-white/[0.08] px-4 py-6 shadow-[0_35px_120px_-65px_rgba(168,85,247,0.9)] backdrop-blur-[12px] sm:px-6 sm:py-8 md:px-8 md:py-10"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: [0, -8, 0] }}
              transition={{
                opacity: { duration: 0.6, ease: 'easeOut' },
                y: { duration: 9, repeat: Infinity, ease: 'easeInOut' },
              }}
            >
              <div className="grid items-center gap-8 md:grid-cols-2 md:gap-10">
                <div className="order-2 text-center md:order-1 md:text-left">
                  <div className="relative inline-block">
                    <div className="pointer-events-none absolute inset-x-6 -inset-y-4 rounded-full bg-fuchsia-400/30 blur-2xl" />
                    <h1 className="relative text-3xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
                      {heroHeading}
                    </h1>
                  </div>

                  <p className="mx-auto mt-4 max-w-3xl text-sm font-medium text-slate-200/90 sm:text-base md:mx-0 md:mt-5 md:text-xl">
                    {heroSubheading}
                  </p>

                  <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:mt-10 sm:w-auto sm:flex-row sm:items-center md:justify-start">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        asChild
                        size="lg"
                        className="h-12 w-full rounded-xl border border-white/20 bg-gradient-to-r from-violet-600 to-pink-500 px-8 text-base font-semibold text-white shadow-[0_16px_46px_-18px_rgba(236,72,153,0.95)] transition-all hover:from-violet-500 hover:to-pink-400 sm:w-auto"
                        onClick={() => trackLinkClick('Hero-CTA')}
                      >
                        <Link href={heroPrimaryLink}>
                          {heroPrimaryText}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </motion.div>

                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="h-12 w-full rounded-xl border border-white/60 bg-transparent px-8 text-base font-semibold text-white transition-colors hover:bg-white/10 hover:text-white sm:w-auto"
                      onClick={() => trackLinkClick('Hero-Secondary')}
                    >
                      <Link href={heroSecondaryLink}>{heroSecondaryText}</Link>
                    </Button>
                  </div>
                </div>

                <div className="order-1 md:order-2">
                  <div className="relative mx-auto w-full max-w-md">
                    <div className="pointer-events-none absolute inset-0 rounded-[26px] bg-[radial-gradient(circle_at_50%_35%,rgba(167,139,250,0.35),rgba(59,130,246,0.05),transparent_75%)] blur-2xl" />

                    <motion.div
                      className="relative rounded-[22px] border border-white/15 bg-white/[0.08] p-5 backdrop-blur-sm sm:p-6"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-200/80">
                        Learning Highlights
                      </p>

                      <div className="mt-4 grid grid-cols-1 gap-3 min-[430px]:grid-cols-2">
                        <div className="rounded-xl border border-white/15 bg-white/10 p-3 text-left">
                          <GraduationCap className="h-5 w-5 text-violet-200" />
                          <p className="mt-2 text-sm font-semibold text-white">Expert Faculty</p>
                        </div>
                        <div className="rounded-xl border border-white/15 bg-white/10 p-3 text-left">
                          <BookOpen className="h-5 w-5 text-sky-200" />
                          <p className="mt-2 text-sm font-semibold text-white">Smart Notes</p>
                        </div>
                        <div className="rounded-xl border border-white/15 bg-white/10 p-3 text-left">
                          <Award className="h-5 w-5 text-amber-200" />
                          <p className="mt-2 text-sm font-semibold text-white">Top Results</p>
                        </div>
                        <div className="rounded-xl border border-white/15 bg-white/10 p-3 text-left">
                          <ClipboardList className="h-5 w-5 text-pink-200" />
                          <p className="mt-2 text-sm font-semibold text-white">Practice Sets</p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      className="absolute -left-3 top-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-[#0f1b42]/85 px-3 py-1.5 text-xs font-semibold text-white shadow-lg"
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <GraduationCap className="h-4 w-4 text-violet-200" />
                      Faculty
                    </motion.div>

                    <motion.div
                      className="absolute -right-3 top-14 inline-flex items-center gap-2 rounded-full border border-white/20 bg-[#1b1438]/85 px-3 py-1.5 text-xs font-semibold text-white shadow-lg"
                      animate={{ y: [0, 10, 0] }}
                      transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                    >
                      <BookOpen className="h-4 w-4 text-sky-200" />
                      Books
                    </motion.div>

                    <motion.div
                      className="absolute -bottom-3 right-10 inline-flex items-center gap-2 rounded-full border border-white/20 bg-[#3a1534]/85 px-3 py-1.5 text-xs font-semibold text-white shadow-lg"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
                    >
                      <Award className="h-4 w-4 text-amber-200" />
                      Prize
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
        )}

        {showScrollingBanner && (
          <section className="relative w-full overflow-hidden border-y border-cyan-200/70 bg-gradient-to-r from-sky-50 via-cyan-50 to-indigo-50 dark:border-indigo-300/20 dark:bg-gradient-to-r dark:from-[#070d24] dark:via-[#0a1438] dark:to-[#120c2b]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,116,144,0.18),transparent_55%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(129,140,248,0.18),transparent_58%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.14),transparent_55%)] dark:bg-[radial-gradient(circle_at_bottom_right,rgba(236,72,153,0.13),transparent_58%)]" />
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-sky-50 dark:from-[#070d24] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-indigo-50 dark:from-[#120c2b] to-transparent" />

            <motion.div
              className="relative flex w-max items-center py-3 md:py-3.5"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
            >
              {[0, 1].map((copyIndex) => (
                <div key={`banner-copy-${copyIndex}`} className="flex shrink-0 items-center gap-8 pr-8 md:gap-10 md:pr-10">
                  {Array.from({ length: 3 }).map((_, itemIndex) => (
                    <div
                      key={`banner-item-${copyIndex}-${itemIndex}`}
                      className="inline-flex items-center gap-3 whitespace-nowrap rounded-full border border-cyan-300/55 bg-white/90 px-3 py-1.5 text-slate-900 shadow-[0_10px_28px_-20px_rgba(15,23,42,0.32)] backdrop-blur-sm dark:border-white/20 dark:bg-white/10 dark:text-white dark:shadow-none"
                    >
                      {bannerContent.imageUrl && (
                        <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-cyan-300/60 dark:border-white/45">
                          <Image
                            src={bannerContent.imageUrl}
                            alt={bannerContent.imageAlt}
                            fill
                            sizes="28px"
                            className="object-cover"
                          />
                        </div>
                      )}

                      <p className={`text-sm font-semibold text-slate-800 md:text-[15px] dark:text-white ${bannerAnimationClass}`}>
                        {bannerContent.text}
                      </p>

                      <Link
                        href={bannerContent.linkHref}
                        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-pink-500 px-3 py-1 text-xs font-semibold text-white shadow-[0_10px_30px_-18px_rgba(236,72,153,0.95)] transition-transform hover:scale-105"
                        onClick={() => trackLinkClick('Scrolling-Banner')}
                      >
                        {bannerContent.linkText}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  ))}
                </div>
              ))}
            </motion.div>
          </section>
        )}

        {/* ===== QUICK ACCESS SECTION ===== */}
        <motion.section 
          className="w-full py-16 md:py-24 relative overflow-hidden"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeIn}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-900/70 dark:via-slate-900/40 dark:to-slate-950" />
          <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl dark:bg-cyan-500/12" />
          <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl dark:bg-blue-500/10" />
          
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <motion.div 
              className="type-rhythm text-center max-w-3xl mx-auto space-y-3"
              variants={fadeIn}
            >
              <h2 className="type-h2 inline-block text-slate-900 dark:text-white">
                {initialHomeContent?.quickAccess?.title || 'Quick Access'}
              </h2>
              
              {initialHomeContent?.quickAccess?.description && (
                <p className="type-body text-slate-600 dark:text-slate-300 leading-relaxed">
                  {initialHomeContent.quickAccess.description}
                </p>
              )}
            </motion.div>
            
            {quickLinks.length > 0 ? (
              <div className={quickAccessGridClass}>
                {quickLinks.map((item, index) => {
                  const Icon = item.icon;
                  const isFourColumn = quickAccessColumns === 4;
                  return (
                    <motion.div 
                      key={`${item.title}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      viewport={{ once: true }}
                      whileHover={{ y: -6 }}
                      className="group h-full"
                    >
                      <Link
                        href={item.link?.trim() ? item.link : '#'}
                        className="block h-full"
                        aria-label={`${item.title} quick access`}
                      >
                        <div
                          className={
                            isFourColumn
                              ? 'h-full rounded-2xl border border-cyan-200/70 bg-gradient-to-br from-white via-sky-50/90 to-cyan-50/85 shadow-[0_20px_58px_-38px_rgba(15,23,42,0.35)] backdrop-blur-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_28px_72px_-36px_rgba(8,145,178,0.35)] dark:border-cyan-400/30 dark:bg-gradient-to-br dark:from-[#09183f] dark:via-[#061334] dark:to-[#040c24] dark:shadow-[0_24px_68px_-34px_rgba(2,6,23,0.9)] dark:group-hover:shadow-[0_22px_66px_-34px_rgba(34,211,238,0.35)]'
                              : 'h-full rounded-2xl border border-cyan-50 bg-sky-50/90 shadow-[0_15px_50px_-30px_rgba(0,0,0,0.5)] backdrop-blur-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl dark:border-slate-700/80 dark:bg-slate-900/90 dark:shadow-[0_24px_64px_-40px_rgba(2,6,23,0.92)]'
                          }
                        >
                          <div className={isFourColumn ? 'flex flex-col gap-3 px-5 py-6' : 'flex flex-col items-center text-center gap-4 px-8 py-10'}>
                            <div
                              className={
                                isFourColumn
                                  ? 'h-11 w-11 rounded-xl bg-cyan-500/12 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300'
                                  : 'h-12 w-12 rounded-xl bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300'
                              }
                            >
                              <Icon className={isFourColumn ? 'h-5 w-5' : 'h-6 w-6'} />
                            </div>
                            <div className={isFourColumn ? 'space-y-1 text-left' : 'space-y-2'}>
                              <h3 className={isFourColumn ? 'text-lg font-semibold text-slate-900 dark:text-slate-100' : 'text-xl font-semibold text-slate-900 dark:text-slate-100'}>
                                {item.title}
                              </h3>
                              <p className={isFourColumn ? 'text-sm text-slate-600 dark:text-slate-200/90 leading-relaxed' : 'text-sm text-slate-600 dark:text-slate-200/90 leading-relaxed'}>
                                {item.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-12 text-center bg-white/80 dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-12">
                <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">No quick access items yet</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Add items in Home Page settings to show them here.</p>
              </div>
            )}
          </div>
        </motion.section>

        {/* ===== ACHIEVEMENTS SECTION ===== */}
        <motion.section 
          className="w-full py-20 md:py-28 relative overflow-hidden"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeIn}
        >
          {/* Background + glows */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
          <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-blue-400/20 dark:bg-blue-500/20 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-1/3 h-80 w-80 rounded-full bg-purple-400/20 dark:bg-purple-500/25 blur-3xl" />
          <div className="pointer-events-none absolute left-1/3 bottom-0 h-72 w-72 rounded-full bg-cyan-400/20 dark:bg-cyan-500/20 blur-3xl" />

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            {/* Header */}
            <motion.div 
              className="type-rhythm flex flex-col items-center justify-center space-y-4 text-center mb-14"
              variants={fadeIn}
            >
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-sm bg-emerald-50 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-500/10 dark:border-emerald-400/40 dark:text-emerald-200">
                <Award className="h-4 w-4" />
                {achievementsContent.badge}
              </div>
              
              <h2 className="type-h2 type-heading-accent inline-block text-slate-900 dark:text-white">
                {achievementsContent.title}
              </h2>
              
              <p className="type-body max-w-[800px] text-slate-600 dark:text-slate-200/80 leading-relaxed">
                {achievementsContent.description}
              </p>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -6 }}
                  className="group"
                >
                  <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900/70 dark:via-slate-900/40 dark:to-slate-800/60 shadow-[0_25px_80px_-60px_rgba(59,130,246,0.35)] px-6 py-8 backdrop-blur">
                    <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-purple-400/70 via-blue-400/70 to-cyan-400/70" />
                    <div className="flex items-center justify-center">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500/25 to-blue-500/25 dark:from-purple-500/30 dark:to-blue-500/30 flex items-center justify-center text-blue-700 dark:text-blue-100 border border-slate-200/50 dark:border-white/10 shadow-inner shadow-blue-500/10">
                        <achievement.icon className="h-6 w-6" />
                      </div>
                    </div>

                    <div className="mt-6 text-center space-y-2">
                      <p className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-rose-500 via-fuchsia-500 to-blue-500 bg-clip-text text-transparent dark:drop-shadow-[0_0_18px_rgba(236,72,153,0.45)]">
                        <AnimatedCounter value={achievement.value} suffix={achievement.suffix} />
                      </p>
                      <p className="text-sm uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300/80">
                        {achievement.label}
                      </p>
                    </div>

                    <div className="absolute inset-0 rounded-2xl border border-white/5 pointer-events-none" />
                    <div className="absolute -bottom-12 left-1/2 h-24 w-24 -translate-x-1/2 bg-blue-400/10 dark:bg-blue-500/15 blur-2xl" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ===== WHY CHOOSE US SECTION ===== */}
        {initialHomeContent?.whyChooseUs?.title && (
          <motion.section 
            className="w-full py-20 md:py-28 relative overflow-hidden"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeIn}
          >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/30 dark:to-background" />
            
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/2 right-0 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl opacity-30" />
            </div>

            <div className="container mx-auto px-4 md:px-6 relative z-10">
              {/* Header */}
              <motion.div 
                className="type-rhythm flex flex-col items-center justify-center space-y-4 text-center mb-16"
                variants={fadeIn}
              >
                <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-200/50 dark:border-amber-800/50 rounded-full px-4 py-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    Why We Stand Out
                  </span>
                </div>

                <h2 className="type-h2 type-heading-accent inline-block">
                  {initialHomeContent?.whyChooseUs?.title}
                </h2>
                
                <p className="type-body max-w-[800px] text-muted-foreground leading-relaxed">
                  {initialHomeContent?.whyChooseUs?.description}
                </p>
              </motion.div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {whyChooseUs.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -8 }}
                    className="group"
                  >
                    <div className="relative p-8 rounded-2xl bg-white dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                      {/* Background glow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                      
                      <div className="relative">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 p-3 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                            {feature.icon && (
                              <div className="text-primary">
                                {feature.icon}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-foreground mb-2">
                              {feature.title}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* ===== TESTIMONIALS SECTION ===== */}
        {(initialHomeContent?.testimonials?.title || testimonials.length > 0) && (
          <motion.section 
            className="w-full py-20 md:py-28 relative overflow-hidden"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeIn}
          >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-background to-slate-50 dark:to-slate-900/30" />
            
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl opacity-30" />
              <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl opacity-30" />
            </div>

            <div className="container mx-auto px-4 md:px-6 relative z-10">
              {/* Header */}
              <motion.div 
                className="type-rhythm flex flex-col items-center justify-center space-y-4 text-center mb-16"
                variants={fadeIn}
              >
                <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-200/50 dark:border-pink-800/50 rounded-full px-4 py-2">
                  <Users className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                  <span className="text-sm font-medium text-pink-600 dark:text-pink-400">
                    Real Success Stories
                  </span>
                </div>

                <h2 className="type-h2 type-heading-accent inline-block">
                  {initialHomeContent?.testimonials?.title || 'What Students Say'}
                </h2>
                
                <p className="type-body max-w-[800px] text-muted-foreground leading-relaxed">
                  {initialHomeContent?.testimonials?.description || 'Real feedback from learners who leveled up with Xmarty Creator.'}
                </p>
              </motion.div>

              {/* Testimonials Carousel */}
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full select-none"
              >
              <CarouselContent className="py-3 select-none">
                {testimonials.map((testimonial, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        viewport={{ once: true }}
                      >
                        <Card className="group relative h-full select-none overflow-hidden border border-slate-200/70 bg-gradient-to-br from-white/95 via-slate-50 to-slate-100/80 shadow-[0_25px_80px_-60px_rgba(59,130,246,0.55)] hover-lift hover-sheen dark:border-white/10 dark:from-slate-900/70 dark:via-slate-900/40 dark:to-slate-800/60">
                          <div className="pointer-events-none absolute inset-0">
                            <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-purple-400/15 blur-3xl" />
                            <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl" />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.10),transparent_55%)]" />
                          </div>

                          {/* Star rating */}
                          <div className="relative flex items-center justify-between px-6 pt-6">
                            <div className="flex gap-1">
                              {Array.from({ length: testimonial.rating }).map((_, i) => (
                                <motion.span 
                                  key={i} 
                                  className="text-yellow-400 text-lg drop-shadow-sm"
                                  initial={{ scale: 0 }}
                                  whileInView={{ scale: 1 }}
                                  transition={{ delay: i * 0.08 }}
                                >
                                  &#9733;
                                </motion.span>
                              ))}
                            </div>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                              Rated {testimonial.rating}/5
                            </span>
                          </div>

                          {/* Testimonial */}
                          <CardContent className="relative px-6 py-6">
                            <span
                              aria-hidden="true"
                              className="absolute -top-2 left-6 text-5xl font-black text-slate-200/80 dark:text-white/10"
                            >
                              &ldquo;
                            </span>
                            <p className="text-base md:text-lg leading-relaxed text-slate-700 dark:text-slate-200 italic">
                              &ldquo;{testimonial.testimonial}&rdquo;
                            </p>
                          </CardContent>

                          {/* Author */}
                          <CardFooter className="relative flex items-center justify-between p-6 pt-0 mt-auto">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12 border-2 border-primary/30 shadow-md">
                                <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                                <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="space-y-1">
                                <p className="font-semibold text-foreground">{testimonial.name}</p>
                                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 rounded-full bg-white/80 dark:bg-white/5 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-white/10">
                              <span className="h-2 w-2 rounded-full bg-emerald-400" />
                              Verified
                            </div>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="flex gap-2 justify-center mt-8">
                  <CarouselPrevious className="border-2 hover:bg-primary/10" />
                  <CarouselNext className="border-2 hover:bg-primary/10" />
                </div>
              </Carousel>
            </div>
          </motion.section>
        )}

        {/* ===== CTA SECTION ===== */}
        <motion.section 
          className="w-full py-20 md:py-28 relative overflow-hidden"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeIn}
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-5" />
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-slate-50 dark:to-slate-900/50" />

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 md:p-16 text-center border-2 border-blue-400/30 shadow-2xl">
              <motion.h2 
                className="type-h2 !text-white mb-6"
                variants={fadeIn}
              >
                Ready to <span className="type-keyword type-glow">Transform</span> Your Learning?
              </motion.h2>
              
              <motion.p 
                className="type-body max-w-[600px] !text-blue-50 mx-auto mb-8"
                variants={fadeIn}
              >
                Join our community of learners and start your journey to success today.
              </motion.p>

              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center"
                whileHover={{ scale: 1.02 }}
              >
                <Button 
                  asChild 
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50 font-bold shadow-lg"
                >
                  <Link href="/courses">
                    Get Started Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.section>
      </div>

      <Footer />
    </>
  );
}
