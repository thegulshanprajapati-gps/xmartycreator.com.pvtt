
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  ArrowDownCircle,
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
  Sparkles,
  Users,
  UsersRound,
  Video,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { useState, useEffect, useRef } from 'react';
import { trackLinkClick } from '@/app/analytics/actions';
import { Footer } from '@/components/layout/footer';
import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";

export type Review = {
    name: string;
    role: string;
    testimonial: string;
    rating: number;
    avatar: string;
};

type HomeContent = {
    hero: {
        title: string;
        description: string;
        buttons: {
            primary: { text: string; link: string };
            secondary: { text: string; link: string };
        };
    };
    quickAccess: {
        title: string;
        description: string;
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
}

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

const resolveQuickAccessIcon = (title: string, index: number): LucideIcon => {
  const normalizedTitle = (title || '').toLowerCase();
  const match = quickAccessIconHints.find(({ keyword }) => normalizedTitle.includes(keyword));
  return match ? match.icon : quickAccessFallbackIcons[index % quickAccessFallbackIcons.length];
};

interface HomePageClientProps {
  initialHomeContent: HomeContent;
}

const slideInFromLeft = {
  hidden: { opacity: 0, x: -100 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: 'easeOut' } }
};

const slideInFromRight = {
  hidden: { opacity: 0, x: 100 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: 'easeOut' } }
};

const heroCarouselSlides = [
  {
    title: 'Mentor-Led Community',
    description: 'Get doubts solved fast with peer + mentor support.',
    stat: '3k+ active',
    badge: 'Community',
    icon: Users,
    accent: 'text-blue-600',
    glow: 'bg-blue-500/15',
    gradient: 'from-blue-500/15 via-transparent to-cyan-500/10',
  },
  {
    title: 'Live Doubt Sessions',
    description: 'Weekly live classes to unblock your learning.',
    stat: '120+ hrs',
    badge: 'Live',
    icon: Video,
    accent: 'text-emerald-600',
    glow: 'bg-emerald-500/15',
    gradient: 'from-emerald-500/15 via-transparent to-teal-500/10',
  },
  {
    title: 'Career Roadmaps',
    description: 'Step-by-step plans to reach your target role.',
    stat: '50+ paths',
    badge: 'Guides',
    icon: Milestone,
    accent: 'text-purple-600',
    glow: 'bg-purple-500/15',
    gradient: 'from-purple-500/15 via-transparent to-pink-500/10',
  },
  {
    title: 'Project Templates',
    description: 'Ready-to-use templates that save hours.',
    stat: '40+ kits',
    badge: 'Builder',
    icon: Laptop,
    accent: 'text-sky-600',
    glow: 'bg-sky-500/15',
    gradient: 'from-sky-500/15 via-transparent to-blue-500/10',
  },
];

function HeroMiniCarousel({ compact = false }: { compact?: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % heroCarouselSlides.length);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={`relative w-full min-w-0 ${compact ? '' : 'max-w-md'}`}>
      <div className={`absolute ${compact ? '-right-3 -top-3 h-14 w-14' : '-right-10 -top-10 h-24 w-24'} rounded-full bg-blue-400/20 blur-3xl`} />
      <div className={`absolute ${compact ? '-left-4 bottom-2 h-16 w-16' : '-left-12 bottom-6 h-28 w-28'} rounded-full bg-purple-400/20 blur-3xl`} />

      <div className={`relative overflow-hidden rounded-3xl border border-slate-200/70 dark:border-white/10 bg-white/85 dark:bg-slate-900/60 shadow-[0_30px_90px_-70px_rgba(59,130,246,0.9)] backdrop-blur ${compact ? 'mx-auto max-w-[420px]' : ''}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10" />

        <motion.div
          className="flex w-full"
          animate={{ x: `-${activeIndex * 100}%` }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
        >
          {heroCarouselSlides.map((slide) => (
            <div key={slide.title} className={`min-w-full shrink-0 ${compact ? 'p-4' : 'p-6 md:p-8'}`}>
              <div className={`absolute inset-0 ${slide.gradient} pointer-events-none`} />
              <div className="relative flex items-center justify-between gap-3">
                <div className={`h-12 w-12 shrink-0 rounded-2xl ${slide.glow} border border-white/50 dark:border-white/10 flex items-center justify-center shadow-inner`}>
                  <slide.icon className={`h-6 w-6 ${slide.accent}`} />
                </div>
                <span className={`shrink-0 font-semibold uppercase text-slate-500 dark:text-slate-300 bg-white/70 dark:bg-white/10 border border-slate-200/70 dark:border-white/10 rounded-full ${compact ? 'px-2.5 py-1 text-[10px] tracking-[0.14em]' : 'px-3 py-1 text-xs tracking-[0.2em]'}`}>
                  {slide.badge}
                </span>
              </div>

              <div className={`space-y-3 ${compact ? 'mt-5' : 'mt-6'}`}>
                <h3 className={`font-bold text-slate-900 dark:text-white ${compact ? 'text-lg' : 'text-2xl'}`}>{slide.title}</h3>
                <p className={`text-slate-600 dark:text-slate-300 ${compact ? 'text-xs leading-relaxed' : 'text-sm'}`}>
                  {slide.description}
                </p>
              </div>

              <div className={`mt-6 flex items-center ${compact ? 'flex-wrap gap-2' : 'justify-between'}`}>
                <div className={`font-extrabold text-slate-900 dark:text-white ${compact ? 'text-xl' : 'text-3xl'}`}>
                  {slide.stat}
                </div>
                <div className={`flex items-center gap-2 font-semibold uppercase text-slate-500 dark:text-slate-400 ${compact ? 'text-[10px] tracking-[0.14em]' : 'text-xs tracking-[0.25em]'}`}>
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Active
                </div>
              </div>

              <div className={`flex gap-2 ${compact ? 'mt-5' : 'mt-6'}`}>
                {heroCarouselSlides.map((_, dotIndex) => (
                  <button
                    key={`hero-dot-${dotIndex}`}
                    type="button"
                    aria-label={`Go to slide ${dotIndex + 1}`}
                    onClick={() => setActiveIndex(dotIndex)}
                    className={`${compact ? 'h-2 w-6' : 'h-2.5 w-8'} rounded-full transition-all ${
                      dotIndex === activeIndex
                        ? 'bg-slate-900/80 dark:bg-white/70'
                        : 'bg-slate-200/80 dark:bg-white/10'
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      <div className={`mt-4 grid ${compact ? 'grid-cols-1 min-[390px]:grid-cols-2' : 'grid-cols-2'} gap-3 ${compact ? 'mx-auto max-w-[420px]' : ''}`}>
        {heroCarouselSlides.slice(0, 2).map((slide) => (
          <div
            key={`${slide.title}-mini`}
            className="min-w-0 rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 px-4 py-3 shadow-sm flex items-center gap-3"
          >
            <div className={`h-9 w-9 rounded-xl ${slide.glow} flex items-center justify-center`}>
              <slide.icon className={`h-5 w-5 ${slide.accent}`} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">{slide.badge}</div>
              <div className="truncate text-xs text-slate-500 dark:text-slate-400">{slide.stat}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } }
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

export default function HomePageClient({ initialHomeContent }: HomePageClientProps) {

  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero-1');

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
      const safeSeed = safeName.replace(/\s/g, '') || 'user';
      return {
        ...r,
        name: safeName,
        role: r.role || '',
        testimonial: r.testimonial || '',
        rating: Number.isFinite(r.rating) ? Math.max(1, Math.min(5, r.rating)) : 5,
        avatar: r.avatar || `https://api.dicebear.com/8.x/adventurer/svg?seed=${safeSeed}`,
      };
    });
  const [testimonials, setTestimonials] = useState<Review[]>(initialReviews);

  useEffect(() => {
    console.log('?? [Home Page] Testimonials loaded', {
      title: initialHomeContent?.testimonials?.title || '',
      description: initialHomeContent?.testimonials?.description || '',
      count: initialReviews.length,
      reviews: initialReviews,
    });
  }, [initialHomeContent, initialReviews.length]);

  const handleScrollDown = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth',
    });
  };
  
  const achievements = [
    { icon: Users, value: 50000, label: "Happy Students", suffix: "+" },
    { icon: BookOpen, value: 50, label: "Expert Courses", suffix: "+" },
    { icon: Video, value: 1000, label: "Hours of Content", suffix: "+" },
    { icon: Award, value: 20, label: "Awards Won", suffix: "+" },
  ];

  return (
    <>
      <div className="flex min-h-screen flex-col overflow-x-clip">
        {/* ===== HERO SECTION ===== */}
        <section className="relative w-full min-h-[calc(100vh_-_64px)] md:min-h-[calc(100vh_-_80px)] flex items-center justify-center overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors" />
          <div className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full bg-blue-300/18 dark:bg-blue-500/18 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-8 h-72 w-72 rounded-full bg-purple-300/16 dark:bg-purple-500/18 blur-3xl" />
          <div className="pointer-events-none absolute left-1/3 bottom-6 h-60 w-60 rounded-full bg-cyan-300/16 dark:bg-cyan-500/18 blur-3xl" />
          <div className="pointer-events-none absolute right-[-12%] top-24 h-[520px] w-[520px] bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.30),rgba(15,23,42,0.02))] dark:bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.35),rgba(15,23,42,0.05))] blur-3xl" />
          <div className="pointer-events-none absolute left-[-20%] bottom-0 h-[380px] w-[380px] bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.18),transparent)] dark:bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.25),transparent)] blur-3xl" />
          {/* Mobile floating sparks */}
          <div className="absolute inset-0 md:hidden">
            <motion.div
              className="absolute left-6 top-16 h-3 w-3 rounded-full bg-blue-400/80"
              animate={{ y: [-6, 6, -6], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute right-10 top-24 h-2 w-2 rounded-full bg-purple-400/80"
              animate={{ y: [4, -6, 4], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
            />
            <motion.div
              className="absolute left-1/3 bottom-10 h-2.5 w-2.5 rounded-full bg-cyan-400/80"
              animate={{ y: [-5, 5, -5], opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            />
          </div>
          
          {/* Animated Gradient Orbs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl opacity-50 animate-pulse" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }} />
          </div>

          {/* Mobile background image */}
          <div className="absolute inset-0 md:hidden opacity-40">
            {heroImage && (
              <Image
                src={heroImage.imageUrl!}
                alt={heroImage.description!}
                data-ai-hint={heroImage.imageHint}
                fill
                className="object-cover"
                priority
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
          </div>

          <div className="container relative z-10 mx-auto max-w-6xl px-4 md:px-6">
            <div className="grid min-w-0 items-center gap-10 py-12 md:grid-cols-2 md:gap-16 md:py-0">
              {/* Left Content */}
              <motion.div
                className="flex min-w-0 flex-col items-center justify-center space-y-6 text-center md:items-start md:text-left"
                initial="hidden"
                animate="visible"
                variants={slideInFromLeft}
              >
                {/* Badge */}
                <motion.div 
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/12 via-purple-500/12 to-pink-500/12 border border-slate-200/60 dark:border-white/20 text-slate-800 dark:text-white rounded-full px-4 py-2 w-fit shadow-[0_10px_40px_-30px_rgba(59,130,246,0.8)] transition-colors"
                  variants={fadeIn}
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Trusted by industry leaders
                  </span>
                </motion.div>

                {/* Title */}
                <h1 
                  className="max-w-full break-words font-headline text-4xl min-[420px]:text-5xl lg:text-7xl font-bold tracking-tight leading-tight [text-wrap:balance] bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent"
                  dangerouslySetInnerHTML={{ __html: initialHomeContent?.hero?.title || 'Learn & Grow' }}
                />

                {/* Description */}
                <p className="max-w-[600px] text-lg text-muted-foreground leading-relaxed">
                  {initialHomeContent?.hero?.description || 'Master new skills with our expert courses'}
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col gap-3 min-[400px]:flex-row pt-6 md:flex-row">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      asChild 
                      size="lg" 
                      className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white shadow-lg hover:shadow-2xl border border-slate-200/70 dark:border-white/20"
                      onClick={() => trackLinkClick('Hero-CTA')}
                    >
                      <Link href={initialHomeContent?.hero?.buttons?.primary?.link || '/courses'}>
                        {initialHomeContent?.hero?.buttons?.primary?.text || 'Get Started'}
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      asChild 
                      size="lg" 
                      variant="outline"
                      className="border-2 border-slate-200/70 dark:border-white/20 bg-white/85 dark:bg-white/5 text-slate-800 dark:text-white hover:bg-white/95 dark:hover:bg-white/10"
                      onClick={() => trackLinkClick('Hero-Secondary')}
                    >
                      <Link href={initialHomeContent?.hero?.buttons?.secondary?.link || '#'}>
                        <Users className="mr-2 h-5 w-5" />
                        {initialHomeContent?.hero?.buttons?.secondary?.text || 'Join Community'}
                      </Link>
                    </Button>
                  </motion.div>
                </div>

                {/* Mobile mini carousel */}
                <motion.div
                  className="w-full pt-8 md:hidden"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                >
                  <HeroMiniCarousel compact />
                </motion.div>

              </motion.div>

              {/* Right Visual */}
              <motion.div
                className="relative hidden h-full min-w-0 flex-col items-center justify-center md:flex"
                initial="hidden"
                animate="visible"
                variants={slideInFromRight}
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* Ambient glow + accents to avoid empty space */}
                  <div className="pointer-events-none absolute h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.28),rgba(15,23,42,0))] blur-2xl" />
                  <div className="pointer-events-none absolute h-56 w-56 rounded-full border border-purple-400/25 blur-[1px]" />
                  <span className="pointer-events-none absolute -right-6 -top-4 h-3 w-3 rounded-full bg-cyan-300/80 blur-[1px]" />
                  <span className="pointer-events-none absolute right-10 bottom-8 h-2 w-2 rounded-full bg-pink-300/80 blur-[0.5px]" />
                  <HeroMiniCarousel />
                </div>
              </motion.div>
            </div>
          </div>

          {/* Scroll indicator */}
          <motion.button
            onClick={handleScrollDown}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 text-foreground/60 hover:text-foreground transition-colors"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            aria-label="Scroll down"
          >
            <ArrowDownCircle className="h-8 w-8" />
          </motion.button>
        </section>

        {/* ===== QUICK ACCESS SECTION ===== */}
        <motion.section 
          className="w-full py-16 md:py-24 relative overflow-hidden"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeIn}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-900/70 dark:via-slate-900/40 dark:to-slate-950" />
          <div className="absolute -left-32 top-10 w-72 h-72 bg-cyan-200/40 blur-3xl rounded-full" />
          <div className="absolute right-0 bottom-0 w-80 h-80 bg-blue-200/30 blur-3xl rounded-full" />
          
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <motion.div 
              className="text-center max-w-3xl mx-auto space-y-3"
              variants={fadeIn}
            >
              <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-100 dark:border-cyan-900/50 rounded-full px-4 py-2 text-cyan-700 dark:text-cyan-200 text-sm font-medium">
                Quick Access
              </div>
              
              <h2 className="font-headline text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
                {initialHomeContent?.quickAccess?.title || 'Quick Access'}
              </h2>
              
              {initialHomeContent?.quickAccess?.description && (
                <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                  {initialHomeContent.quickAccess.description}
                </p>
              )}
            </motion.div>
            
            {quickLinks.length > 0 ? (
              <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {quickLinks.map((item, index) => {
                  const Icon = item.icon;
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
                        <div className="h-full rounded-2xl border border-cyan-50 dark:border-slate-800 bg-sky-50/90 dark:bg-slate-900/60 shadow-[0_15px_50px_-30px_rgba(0,0,0,0.5)] backdrop-blur-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
                          <div className="flex flex-col items-center text-center gap-4 px-8 py-10">
                            <div className="h-12 w-12 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                              <Icon className="h-6 w-6" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                                {item.title}
                              </h3>
                              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
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
              className="flex flex-col items-center justify-center space-y-4 text-center mb-14"
              variants={fadeIn}
            >
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-sm bg-emerald-50 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-500/10 dark:border-emerald-400/40 dark:text-emerald-200">
                <Award className="h-4 w-4" />
                Proven Track Record
              </div>
              
              <h2 className="font-headline text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
              Our Impact by the Numbers
              </h2>
              
              <p className="max-w-[800px] text-lg text-slate-600 dark:text-slate-200/80 leading-relaxed">
                Join thousands of learners who are transforming their careers and skills
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
                className="flex flex-col items-center justify-center space-y-4 text-center mb-16"
                variants={fadeIn}
              >
                <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-200/50 dark:border-amber-800/50 rounded-full px-4 py-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    Why We Stand Out
                  </span>
                </div>

                <h2 className="font-headline text-4xl lg:text-5xl font-bold tracking-tight">
                  {initialHomeContent?.whyChooseUs?.title}
                </h2>
                
                <p className="max-w-[800px] text-lg text-muted-foreground leading-relaxed">
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
                className="flex flex-col items-center justify-center space-y-4 text-center mb-16"
                variants={fadeIn}
              >
                <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-200/50 dark:border-pink-800/50 rounded-full px-4 py-2">
                  <Users className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                  <span className="text-sm font-medium text-pink-600 dark:text-pink-400">
                    Real Success Stories
                  </span>
                </div>

                <h2 className="font-headline text-4xl lg:text-5xl font-bold tracking-tight">
                  {initialHomeContent?.testimonials?.title || 'What Students Say'}
                </h2>
                
                <p className="max-w-[800px] text-lg text-muted-foreground leading-relaxed">
                  {initialHomeContent?.testimonials?.description || 'Real feedback from learners who leveled up with Xmarty Creator.'}
                </p>
              </motion.div>

              {/* Testimonials Carousel */}
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full"
              >
              <CarouselContent className="py-3">
                {testimonials.map((testimonial, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        viewport={{ once: true }}
                      >
                        <Card className="group relative overflow-hidden border border-slate-200/70 dark:border-white/10 bg-gradient-to-br from-white/95 via-slate-50 to-slate-100/80 dark:from-slate-900/70 dark:via-slate-900/40 dark:to-slate-800/60 shadow-[0_25px_80px_-60px_rgba(59,130,246,0.55)] hover-lift hover-sheen h-full">
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
                className="font-headline text-3xl lg:text-5xl font-bold text-white mb-6"
                variants={fadeIn}
              >
                Ready to Transform Your Learning?
              </motion.h2>
              
              <motion.p 
                className="max-w-[600px] text-lg text-blue-50 mx-auto mb-8"
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
