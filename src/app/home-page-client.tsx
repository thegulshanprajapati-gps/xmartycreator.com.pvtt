
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
  Target,
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
import HeroSection from '@/components/HeroSection';

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
    'Build a Smarter Future Together';
  const heroSubheading =
    (initialHomeContent?.hero?.description || '').replace(/<[^>]*>/g, '').trim() ||
    'A premium edtech landing experience built for focused learners who want fast progress and clear outcomes.';
  const heroPrimaryText = (initialHomeContent?.hero?.buttons?.primary?.text || '').trim() || 'Join Our Community';
  const heroPrimaryLink = (initialHomeContent?.hero?.buttons?.primary?.link || '').trim() || '/community';
  const heroSecondaryText =
    (initialHomeContent?.hero?.buttons?.secondary?.text || '').trim() || 'About Us';
  const heroSecondaryLink = (initialHomeContent?.hero?.buttons?.secondary?.link || '').trim() || '/about';
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
          <HeroSection />
        )}

        {showScrollingBanner && (
          <section className="relative w-full overflow-hidden border-y border-zinc-200 bg-white dark:border-white/10 dark:bg-black">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,59,48,0.05),transparent_55%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(255,59,48,0.03),transparent_55%)]" />
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-white dark:from-black to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-white dark:from-black to-transparent" />

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
                      className="inline-flex items-center gap-3 whitespace-nowrap rounded-full border border-zinc-200 bg-white/90 px-3 py-1.5 text-slate-900 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                    >
                      {bannerContent.imageUrl && (
                        <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-red-500/20">
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
                        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-[0_10px_30px_-18px_rgba(255,59,48,0.5)] transition-transform hover:scale-105"
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
          className="w-full py-20 md:py-32 relative overflow-hidden"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeIn}
        >
          <div className="absolute inset-0 bg-white dark:bg-black" />
          <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-red-500/5 blur-3xl dark:bg-red-500/10" />
          <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-red-500/5 blur-3xl dark:bg-red-500/5" />
          
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <motion.div 
              className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16"
              variants={fadeIn}
            >
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] bg-red-500/10 text-red-600 border border-red-500/20 mb-6">
                <Target className="h-4 w-4" />
                Your Success Roadmap
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-zinc-900 dark:text-zinc-50 leading-tight mb-6">
                {initialHomeContent?.quickAccess?.title || 'Our Mastery Ecosystem'}
              </h2>
              
              <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl font-medium">
                {initialHomeContent?.quickAccess?.description || 'Explore our specialized learning tracks designed to take you from beginner to professional.'}
              </p>
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
                          className="h-full group/card relative rounded-[2.5rem] border border-zinc-200 bg-white p-10 shadow-xl transition-all duration-700 hover:-translate-y-3 hover:shadow-[0_40px_100px_-40px_rgba(220,38,38,0.2)] hover:border-red-500/40 dark:border-white/5 dark:bg-zinc-900 overflow-hidden"
                        >
                          {/* Animated Background Decor */}
                          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-red-500/5 blur-3xl transition-all duration-700 group-hover/card:bg-red-500/10 group-hover/card:scale-125 opacity-0 group-hover/card:opacity-100" />
                          
                          <div className="relative z-10 flex flex-col h-full">
                            <div className="mb-8 flex items-center justify-between">
                              <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-red-500/10 text-red-600 transition-all duration-700 group-hover/card:scale-110 group-hover/card:rotate-[10deg] group-hover/card:bg-red-600 group-hover/card:text-white dark:bg-red-500/20 dark:text-red-400">
                                <Icon className="h-8 w-8" />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 dark:text-zinc-500 group-hover/card:text-red-500 transition-colors">
                                Core Track
                              </span>
                            </div>
                            
                            <div className="space-y-4">
                              <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight transition-colors group-hover/card:text-red-600 dark:group-hover/card:text-red-400">
                                {item.title}
                              </h3>
                              <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-3 font-medium">
                                {item.description}
                              </p>
                            </div>

                            <div className="mt-auto pt-10 flex items-center gap-3 text-sm font-black uppercase tracking-widest text-red-600 dark:text-red-500 opacity-0 -translate-x-4 transition-all duration-500 group-hover/card:opacity-100 group-hover/card:translate-x-0">
                              Choose This Path
                              <ArrowRight className="h-5 w-5" />
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
          className="w-full py-20 md:py-32 relative overflow-hidden"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeIn}
        >
          {/* Background + glows */}
          <div className="absolute inset-0 bg-white dark:bg-black" />
          <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-red-500/5 dark:bg-red-500/10 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-1/3 h-80 w-80 rounded-full bg-red-500/5 dark:bg-red-500/5 blur-3xl" />
          <div className="pointer-events-none absolute left-1/3 bottom-0 h-72 w-72 rounded-full bg-red-500/5 dark:bg-red-500/5 blur-3xl" />

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            {/* Header */}
            <motion.div 
              className="flex flex-col items-center text-center max-w-4xl mx-auto mb-20"
              variants={fadeIn}
            >
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.25em] bg-red-500/10 text-red-600 border border-red-500/20 mb-6">
                <Award className="h-4 w-4" />
                Proven Excellence
              </div>
              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-zinc-900 dark:text-zinc-50 leading-tight mb-6">
                {achievementsContent.title}
              </h2>
              
              <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium max-w-2xl">
                {achievementsContent.description}
              </p>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                  viewport={{ once: true }}
                  className="relative group"
                >
                  <div className="h-full relative overflow-hidden rounded-[2.5rem] border border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900/50 backdrop-blur-xl p-8 transition-all duration-500 hover:border-red-500/30 hover:shadow-2xl hover:shadow-red-500/10">
                    {/* Corner Accent */}
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-100 transition-opacity duration-500">
                      <achievement.icon className="h-12 w-12 text-red-600 dark:text-red-500 transform rotate-12" />
                    </div>

                    <div className="relative z-10 space-y-6">
                      <div className="h-14 w-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/20">
                        <achievement.icon className="h-7 w-7" />
                      </div>

                      <div className="space-y-1">
                        <p className="text-5xl md:text-6xl font-black text-red-600 dark:text-red-500 tracking-tighter">
                          <AnimatedCounter value={achievement.value} suffix={achievement.suffix} />
                        </p>
                        <p className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                          {achievement.label}
                        </p>
                      </div>
                    </div>

                    {/* Background Pattern */}
                    <div className="absolute bottom-0 right-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                      <achievement.icon className="h-32 w-32 -mb-8 -mr-8" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

          </div>
        </motion.section>

        {/* ===== WHY CHOOSE US SECTION ===== */}
        {initialHomeContent?.whyChooseUs?.title && (
          <motion.section 
            className="w-full py-20 md:py-32 relative overflow-hidden"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeIn}
          >
            {/* Background */}
            <div className="absolute inset-0 bg-white dark:bg-black" />
            
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/2 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl opacity-30" />
            </div>

            <div className="container mx-auto px-4 md:px-6 relative z-10">
              {/* Header */}
              <motion.div 
                className="type-rhythm flex flex-col items-center justify-center space-y-4 text-center mb-16"
                variants={fadeIn}
              >
                <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-200/50 dark:border-red-800/50 rounded-full px-4 py-2">
                  <CheckCircle2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
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
                      <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                      
                      <div className="relative">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 p-3 bg-red-500/10 dark:bg-red-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                            {feature.icon && (
                              <div className="text-red-600 dark:text-red-400">
                                {feature.icon}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                              {feature.title}
                            </h3>
                            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
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
            className="w-full py-20 md:py-32 relative overflow-hidden"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeIn}
          >
            {/* Background */}
            <div className="absolute inset-0 bg-white dark:bg-black" />
            
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-40 -left-40 w-80 h-80 bg-red-400/5 rounded-full blur-3xl opacity-30" />
              <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-red-400/5 rounded-full blur-3xl opacity-30" />
            </div>

            <div className="container mx-auto px-4 md:px-6 relative z-10">
              {/* Header */}
              <motion.div 
                className="type-rhythm flex flex-col items-center justify-center space-y-4 text-center mb-16"
                variants={fadeIn}
              >
                <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-200/50 dark:border-red-800/50 rounded-full px-4 py-2">
                  <Users className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
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
                        <Card className="group relative h-full select-none overflow-hidden border border-zinc-200 bg-white shadow-xl dark:border-white/10 dark:bg-zinc-900">
                          <div className="pointer-events-none absolute inset-0">
                            <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-red-500/5 blur-3xl" />
                            <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-red-500/5 blur-3xl" />
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
                            <p className="text-base md:text-lg leading-relaxed text-zinc-800 dark:text-zinc-200 italic font-medium">
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
                            <div className="flex items-center gap-2 rounded-full bg-white/80 dark:bg-white/5 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-zinc-200 dark:border-white/10">
                              <span className="h-2 w-2 rounded-full bg-red-500" />
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
          className="w-full py-20 md:py-32 relative overflow-hidden"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeIn}
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-black opacity-5" />
          <div className="absolute inset-0 bg-white dark:bg-black" />

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="rounded-3xl bg-gradient-to-br from-red-600 to-black p-8 md:p-16 text-center border-2 border-white/10 shadow-2xl">
              <motion.h2 
                className="type-h2 !text-white mb-6"
                variants={fadeIn}
              >
                Ready to <span className="type-keyword type-glow">Transform</span> Your Learning?
              </motion.h2>
              
              <motion.p 
                className="type-body max-w-[600px] !text-zinc-200 mx-auto mb-8"
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
                  className="bg-white text-red-600 hover:bg-zinc-100 font-bold shadow-lg"
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
