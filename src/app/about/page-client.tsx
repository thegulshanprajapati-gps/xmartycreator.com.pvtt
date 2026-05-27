'use client';

import {
  ArrowRight,
  BookOpen,
  Globe,
  Github,
  Instagram,
  Linkedin,
  MessageCircle,
  Rocket,
  Send,
  Sparkles,
  Twitter,
  Youtube,
  Zap,
  ShieldCheck,
  Award,
  Users,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Footer } from '@/components/layout/footer';
import { useEffect, useMemo, useState } from 'react';
import { sanitizeBlogContent } from '@/lib/blog-utils';

type ButtonLink = {
  text: string;
  url: string;
};

type ImagePlaceholder = {
  id: string;
  imageUrl: string;
  description?: string;
  title?: string;
  imageHint?: string;
};

type HeroCard = {
  title: string;
  value: string;
  description: string;
};

type FeatureCard = {
  icon: string;
  title: string;
  description: string;
};

type Testimonial = {
  id?: string;
  name: string;
  role: string;
  course: string;
  review: string;
  imageUrl?: string;
  rating?: string;
};

type TeamMember = {
  id?: string;
  name: string;
  role: string;
  description?: string;
  imageId: string;
  image?: ImagePlaceholder;
  socials?: Record<string, string>;
};

type FaqItem = {
  question: string;
  answer: string;
};

type AboutContent = {
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    imageId: string;
    image?: ImagePlaceholder;
    primaryButton: ButtonLink;
    secondaryButton: ButtonLink;
    cards: HeroCard[];
  };
  stats: Array<{ icon: string; count: string; label: string }>;
  journey: Array<{ icon: string; year: string; title: string; description: string }>;
  founder: {
    imageId: string;
    image?: ImagePlaceholder;
    name: string;
    role: string;
    username?: string;
    title?: string;
    description: string;
    bio?: string;
    quote?: string;
    highlights: string[];
    socials: Record<string, string>;
  };
  services: Array<{ icon: string; title: string; description: string }>;
  features: FeatureCard[];
  testimonials: Testimonial[];
  team: TeamMember[];
  faq: FaqItem[];
  cta: {
    imageId: string;
    image?: ImagePlaceholder;
    title: string;
    subtitle: string;
    primaryButton: ButtonLink;
    secondaryButton: ButtonLink;
  };
};

interface AboutPageClientProps {
  initialAboutContent: AboutContent;
}

const slideInFromLeft = {
  hidden: { opacity: 0, x: -80 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.75, ease: 'easeOut' } },
};

const slideInFromRight = {
  hidden: { opacity: 0, x: 80 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.75, ease: 'easeOut' } },
};

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
};

function parseCountValue(value: string) {
  const match = value.match(/^([\d.,]+)(.*)$/);
  if (!match) return { amount: 0, suffix: value, decimals: 0 };

  const amount = parseFloat(match[1].replace(/,/g, '')) || 0;
  const suffix = match[2] || '';
  const decimals = match[1].includes('.') ? match[1].split('.')[1].length : 0;
  return { amount, suffix, decimals };
}

function AnimatedCount({ value }: { value: string }) {
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    const { amount, suffix, decimals } = parseCountValue(value);
    if (!amount) {
      setDisplay(value);
      return;
    }

    let raf = 0;
    const duration = 900;
    const start = performance.now();

    const tick = (time: number) => {
      const progress = Math.min((time - start) / duration, 1);
      const current = amount * progress;
      const formatted = suffix
        ? current.toFixed(decimals)
        : Math.round(current).toLocaleString();
      setDisplay(`${formatted}${suffix}`);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <span>{display}</span>;
}

export default function AboutPageClient({ initialAboutContent }: AboutPageClientProps) {
  const [aboutContent, setAboutContent] = useState<AboutContent>(initialAboutContent);
  const [carouselApi, setCarouselApi] = useState<any>(null);
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [isFounderCardFlipped, setIsFounderCardFlipped] = useState(false);

  const { hero, stats, journey, founder, services, features, testimonials, team, faq, cta } = aboutContent;
  const featureCards = features.length > 0 ? features : services;
  const heroCards = hero?.cards || [];
  const founderImageUrl = founder?.image?.imageUrl || '';
  const founderHighlights = founder?.highlights || [];
  const founderDescriptionHtml = useMemo(
    () => sanitizeFounderHtml(founder?.description || ''),
    [founder?.description]
  );
  const founderBioHtml = useMemo(
    () => sanitizeFounderHtml(founder?.bio || ''),
    [founder?.bio]
  );
  const isLongBio = Boolean(founder?.bio && founder.bio.length > 260);
  const shouldClampBio = isLongBio && !isBioExpanded;
  const socialEntries = Object.entries(founder?.socials || {}).filter(
    ([, value]) => typeof value === 'string' && value.trim().length > 0
  );
  const hasSocial = socialEntries.length > 0;
  const hasFounder = Boolean(founder?.name || founder?.role || founder?.description || founder?.quote || founderImageUrl);
  const heroSummaryCards = heroCards.length > 0
    ? heroCards.slice(0, 4)
    : [
        { title: 'Students Helped', value: stats?.[0]?.count || '12k+', description: 'Daily support across notes, notices, and exam guidance.' },
        { title: 'Resources Shared', value: stats?.[1]?.count || '1.8k+', description: 'Focused material built for practical student needs.' },
        { title: 'Career Updates', value: stats?.[2]?.count || '97%', description: 'Reliable updates that reduce confusion and delay.' },
        { title: 'Community Support', value: '24/7', description: 'Learner-first help through active channels and regular responses.' },
      ];

  useEffect(() => {
    const controller = new AbortController();

    const loadContent = async () => {
      try {
        const response = await fetch('/api/pages/about', { cache: 'no-store', signal: controller.signal });
        if (!response.ok) return;
        const data = await response.json();
        if (data?.hero) {
          setAboutContent((prev) => ({
            ...prev,
            ...data,
            hero: { ...prev.hero, ...data.hero },
            founder: { ...prev.founder, ...(data.founder || {}) },
            cta: { ...prev.cta, ...(data.cta || {}) },
            stats: Array.isArray(data.stats) ? data.stats : prev.stats,
            journey: Array.isArray(data.journey) ? data.journey : prev.journey,
            services: Array.isArray(data.services) ? data.services : prev.services,
            features: Array.isArray(data.features) ? data.features : prev.features,
            testimonials: Array.isArray(data.testimonials) ? data.testimonials : prev.testimonials,
            team: Array.isArray(data.team) ? data.team : prev.team,
            faq: Array.isArray(data.faq) ? data.faq : prev.faq,
          }));
        }
      } catch {
        // refresh failed
      }
    };

    loadContent();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (testimonials.length === 0) return;
    const intervalId = window.setInterval(() => {
      carouselApi?.scrollNext?.();
    }, 8000);
    return () => window.clearInterval(intervalId);
  }, [testimonials.length, carouselApi]);

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-[#040817] text-white">
      <section className="relative isolate border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(34,211,238,0.18),transparent_32%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_12%,rgba(168,85,247,0.24),transparent_28%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#040817_0%,#0b132f_42%,#111d43_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#040817]" />
        <div className="relative z-10 container mx-auto px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={slideInFromLeft}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100">
                <Sparkles className="h-4 w-4" />
                <span>{hero?.badge || 'About Xmarty Creator'}</span>
              </div>
              <div className="space-y-5">
                <h1 className="max-w-5xl text-4xl font-black leading-[0.95] text-white sm:text-5xl lg:text-7xl">
                  {hero?.title || 'A premium platform built around student clarity, trust, and momentum.'}
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
                  {hero?.subtitle || 'Xmarty Creator simplifies learning for ambitious students with better updates, cleaner resources, focused communities, and a more reliable digital experience.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-white text-slate-950 shadow-[0_22px_60px_-28px_rgba(255,255,255,0.55)] transition hover:bg-slate-100"
                >
                  <Link href={hero?.primaryButton?.url || '#mission'}>
                    {hero?.primaryButton?.text || 'Discover the Mission'}
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
                >
                  <Link href={hero?.secondaryButton?.url || '/contact'}>
                    {hero?.secondaryButton?.text || 'Get in Touch'}
                  </Link>
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'Founded', value: journey?.[0]?.year || '2021' },
                  { label: 'Focus', value: 'Polytechnic Students' },
                  { label: 'Approach', value: 'Premium, Fast, Clear' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.6rem] border border-white/10 bg-white/5 px-5 py-5 backdrop-blur-sm"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
                    <p className="mt-3 text-lg font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={slideInFromRight}
              className="grid gap-4 sm:grid-cols-2"
            >
              {heroSummaryCards.map((card, index) => (
                <div
                  key={`${card.title}-${index}`}
                  className="group rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.86),rgba(9,14,33,0.96))] p-6 shadow-[0_24px_80px_-50px_rgba(2,6,23,1)] transition duration-300 hover:-translate-y-1 hover:border-cyan-300/25"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/75">{card.title}</p>
                  <p className="mt-5 text-4xl font-black tracking-tight text-white">{card.value}</p>
                  <p className="mt-4 text-sm leading-7 text-slate-300">{card.description}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="relative py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-4">
            {stats.map((stat, index) => {
              const IconComponent = getIconComponent(stat.icon);
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.08 * index, duration: 0.5 }}
                  className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-7 shadow-[0_18px_60px_-46px_rgba(15,23,42,0.95)]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400 to-violet-500 text-white shadow-lg shadow-cyan-500/20">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <p className="text-3xl font-black tracking-tight text-white">
                      <AnimatedCount value={stat.count} />
                    </p>
                  </div>
                  <p className="mt-6 text-sm uppercase tracking-[0.24em] text-slate-500">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {journey.length > 0 && (
        <section className="relative py-20 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-14 max-w-4xl text-center">
              <span className="inline-flex rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-200">
                Our Journey
              </span>
              <h2 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                The story behind Xmarty Creator
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-300">
                A steady evolution from useful student help to a sharper, more reliable learning ecosystem.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
              {journey.map((item, index) => {
                const IconComponent = getIconComponent(item.icon);
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.07 * index, duration: 0.5 }}
                    className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,17,36,0.96),rgba(6,10,25,1))] p-8"
                  >
                    <div className="absolute right-0 top-0 h-28 w-28 bg-[radial-gradient(circle,rgba(139,92,246,0.28),transparent_68%)]" />
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200">{item.year}</p>
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5 text-cyan-100">
                        <IconComponent className="h-5 w-5" />
                      </div>
                    </div>
                    <h3 className="mt-8 text-2xl font-semibold text-white">{item.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-slate-400">{item.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {hasFounder && (
        <section className="relative isolate py-20 sm:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(34,211,238,0.1),transparent_30%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_78%,rgba(168,85,247,0.14),transparent_28%)]" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-14 max-w-4xl">
              <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100">
                Meet the Founder
              </span>
              <h2 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Built with student pain points in mind, not generic edtech assumptions.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
                This section shows the person, principles, and platform thinking that shape Xmarty Creator.
              </p>
            </div>

            <div className="grid gap-8 xl:grid-cols-[390px_minmax(0,1fr)]">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={slideInFromLeft}
              >
                <div className="group relative [perspective:2000px]">
                  <div
                    className={`relative min-h-[690px] rounded-[2rem] transition-transform duration-700 [transform-style:preserve-3d] ${
                      isFounderCardFlipped ? '[transform:rotateY(180deg)]' : ''
                    } group-hover:[transform:rotateY(180deg)]`}
                  >
                    <div className="absolute inset-0 overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,17,36,0.98),rgba(8,12,28,1))] p-7 shadow-[0_30px_90px_-56px_rgba(2,6,23,1)] [backface-visibility:hidden]">
                      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-cyan-300/10 to-transparent" />
                      <div className="relative flex h-full flex-col gap-6">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm uppercase tracking-[0.32em] text-cyan-200/80">Founder Spotlight</p>
                          <button
                            type="button"
                            onClick={() => setIsFounderCardFlipped(true)}
                            className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/10 lg:hidden"
                          >
                            Flip
                          </button>
                        </div>

                        <div className="relative h-[390px] overflow-hidden rounded-[1.9rem] border border-white/10 bg-slate-900">
                          {founderImageUrl ? (
                            <Image
                              src={founderImageUrl}
                              alt={founder.name || 'Founder'}
                              fill
                              className="object-cover object-top"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-6xl font-black text-white">
                              {founder.name?.split(' ').map((word) => word[0]).join('')}
                            </div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950 to-transparent" />
                        </div>

                        <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-6">
                          <h3 className="text-3xl font-black text-white">{founder.name}</h3>
                          <p className="mt-2 text-base text-slate-400">{founder.role}</p>
                          {founder.username ? (
                            <p className="mt-4 text-sm font-semibold text-cyan-200/80">@{founder.username.replace(/^@/, '')}</p>
                          ) : null}
                        </div>

                        {founderHighlights.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {founderHighlights.slice(0, 3).map((highlight, index) => (
                              <span
                                key={`${highlight}-${index}`}
                                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200"
                              >
                                {highlight}
                              </span>
                            ))}
                          </div>
                        )}

                        <p className="mt-auto text-xs uppercase tracking-[0.28em] text-slate-500">
                          Hover to flip on desktop
                        </p>
                      </div>
                    </div>

                    <div className="absolute inset-0 overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(8,47,73,0.96),rgba(10,14,31,1))] p-7 shadow-[0_30px_90px_-56px_rgba(8,47,73,0.9)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
                      <div className="flex h-full flex-col gap-6">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm uppercase tracking-[0.32em] text-cyan-100/80">Channels</p>
                            <h3 className="mt-3 text-2xl font-bold text-white">Stay connected</h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsFounderCardFlipped(false)}
                            className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-100 transition hover:bg-white/10 lg:hidden"
                          >
                            Back
                          </button>
                        </div>

                        {hasSocial && (
                          <div className="grid gap-3">
                            {socialEntries.map(([key, href]) => {
                              const meta = getSocialMeta(href, key);
                              const Icon = meta.icon;
                              return (
                                <a
                                  key={key}
                                  href={href}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className={`inline-flex items-center justify-between gap-3 rounded-[1.2rem] border px-4 py-4 text-sm font-semibold transition hover:-translate-y-0.5 ${meta.className}`}
                                >
                                  <span className="inline-flex items-center gap-3">
                                    <Icon className="h-4 w-4" />
                                    <span>{meta.label}</span>
                                  </span>
                                  <ArrowRight className="h-4 w-4" />
                                </a>
                              );
                            })}
                          </div>
                        )}

                        {founderHighlights.length > 0 && (
                          <div className="mt-auto rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                            <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/70">Core Themes</p>
                            <div className="mt-4 grid gap-2">
                              {founderHighlights.slice(0, 4).map((item, index) => (
                                <p key={`${item}-theme-${index}`} className="text-sm leading-7 text-slate-100">
                                  {item}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={slideInFromRight}
                className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]"
              >
                <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-[0_24px_80px_-52px_rgba(2,6,23,1)] xl:col-span-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100">
                    <Sparkles className="h-4 w-4" /> Founder Vision
                  </span>
                  <div
                    className="founder-rich mt-6 text-lg leading-9 text-slate-200"
                    dangerouslySetInnerHTML={{ __html: founderDescriptionHtml }}
                  />
                </div>

                {founder.quote && (
                  <div className="rounded-[2rem] border border-cyan-400/15 bg-[linear-gradient(180deg,rgba(6,44,66,0.42),rgba(10,16,34,0.92))] p-8 shadow-[0_24px_80px_-52px_rgba(8,47,73,0.8)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/75">Founder Quote</p>
                    <p className="mt-5 text-2xl font-semibold leading-10 text-white">"{founder.quote}"</p>
                  </div>
                )}

                {founderHighlights.length > 0 && (
                  <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,44,0.92),rgba(8,12,28,0.98))] p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Key Focus</p>
                    <div className="mt-5 grid gap-3">
                      {founderHighlights.slice(0, 4).map((item, index) => (
                        <div
                          key={`${item}-focus-${index}`}
                          className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-4 text-sm leading-7 text-slate-200"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {founder.bio && (
                  <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,27,48,0.92),rgba(8,12,28,1))] p-8 xl:col-span-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Story</p>
                      <h3 className="mt-3 text-2xl font-bold text-white">What Xmarty Creator is building</h3>
                    </div>
                    <div className={`founder-rich mt-6 text-base leading-8 text-slate-300 ${shouldClampBio ? 'line-clamp-5' : ''}`} dangerouslySetInnerHTML={{ __html: founderBioHtml }} />
                    {isLongBio && (
                      <button
                        type="button"
                        onClick={() => setIsBioExpanded((prev) => !prev)}
                        className="mt-5 text-sm font-semibold text-cyan-200 transition hover:text-white"
                      >
                        {isBioExpanded ? 'Show less' : 'Read more'}
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {featureCards.length > 0 && (
        <section className="relative py-20 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-14 max-w-4xl">
              <span className="inline-flex rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-200">
                Why Students Trust Xmarty Creator
              </span>
              <h2 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                A sharper learning experience, not just more content.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
                Every part of the experience is designed to remove friction and improve student confidence.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {featureCards.map((feature, index) => {
                const IconComponent = getIconComponent(feature.icon);
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.07 * index, duration: 0.45 }}
                    className="group rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/25"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400 to-violet-500 text-white shadow-lg shadow-cyan-500/20">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <h3 className="mt-6 text-2xl font-semibold text-white">{feature.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-slate-400">{feature.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {testimonials.length > 0 && (
        <section className="relative py-20 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-14 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100">
                  Student Stories
                </span>
                <h2 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  Trusted by learners across multiple goals and subjects.
                </h2>
              </div>
              <p className="max-w-xl text-base leading-8 text-slate-300">
                Real feedback from students using Xmarty Creator for updates, resources, preparation, and community support.
              </p>
            </div>

            <Carousel
              opts={{ align: 'start', dragFree: true, containScroll: 'trimSnaps', loop: true }}
              setApi={setCarouselApi}
              className="relative"
            >
              <CarouselContent className="py-3 select-none">
                {testimonials.map((testimonial, index) => (
                  <CarouselItem key={testimonial.id || index} className="md:basis-1/2 lg:basis-1/3">
                    <motion.div
                      className="mx-3 flex h-full flex-col rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,17,36,0.96),rgba(8,12,28,1))] p-8 shadow-[0_22px_70px_-52px_rgba(2,6,23,1)]"
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-cyan-400/10 text-lg font-bold text-cyan-100">
                            {testimonial.name?.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-white">{testimonial.name}</p>
                            <p className="text-sm text-slate-400">{testimonial.role} • {testimonial.course}</p>
                          </div>
                        </div>
                        {testimonial.rating && (
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                            {testimonial.rating}
                          </span>
                        )}
                      </div>
                      <p className="mt-8 text-base leading-8 text-slate-300">
                        “{testimonial.review}”
                      </p>
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="border-white/20 bg-slate-950/80 text-white shadow-lg shadow-slate-950/20" />
              <CarouselNext className="border-white/20 bg-slate-950/80 text-white shadow-lg shadow-slate-950/20" />
            </Carousel>
          </div>
        </section>
      )}

      {team.length > 0 && (
        <section className="relative py-20 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-14 max-w-3xl">
              <span className="inline-flex rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-200">
                Leadership Team
              </span>
              <h2 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                The people supporting the platform behind the scenes.
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {team.map((member, index) => (
                <motion.div
                  key={member.id || index}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.06 * index, duration: 0.45 }}
                  className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-violet-500/12 text-lg font-bold text-violet-100">
                      {member.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{member.name}</p>
                      <p className="text-sm text-slate-400">{member.role}</p>
                    </div>
                  </div>
                  <p className="mt-6 text-sm leading-7 text-slate-400">{member.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {faq.length > 0 && (
        <section className="relative py-20 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-14 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div>
                <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100">
                  FAQs
                </span>
                <h2 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  Questions students usually ask before joining us.
                </h2>
                <p className="mt-4 max-w-xl text-base leading-8 text-slate-300">
                  Quick answers about the platform, the community, and what learners can expect from Xmarty Creator.
                </p>
              </div>
              <Accordion type="single" collapsible className="space-y-4">
                {faq.map((item, index) => (
                  <AccordionItem
                    key={index}
                    value={`faq-${index}`}
                    className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/[0.04]"
                  >
                    <AccordionTrigger className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-base font-semibold text-white transition hover:text-cyan-200">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="border-t border-white/10 px-6 py-5 text-sm leading-7 text-slate-300">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>
      )}

      {cta?.title && (
        <section className="relative isolate py-20 sm:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_32%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.2),transparent_28%)]" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 overflow-hidden rounded-[2.5rem] border border-white/10 bg-[linear-gradient(135deg,rgba(9,14,33,0.98),rgba(17,28,63,0.98))] p-8 shadow-[0_34px_100px_-64px_rgba(2,6,23,1)] lg:grid-cols-[minmax(0,1fr)_360px] lg:p-12">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeIn}
              >
                <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100">
                  Start Today
                </span>
                <h2 className="mt-6 text-4xl font-bold tracking-tight text-white">{cta.title}</h2>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">{cta.subtitle}</p>
                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-full bg-white text-slate-950 hover:bg-slate-100"
                  >
                    <Link href={cta.primaryButton?.url || '/courses'}>
                      {cta.primaryButton?.text || 'Explore Courses'}
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
                  >
                    <Link href={cta.secondaryButton?.url || '/community'}>
                      {cta.secondaryButton?.text || 'Join Community'}
                    </Link>
                  </Button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                className="rounded-[2rem] border border-white/10 bg-white/5 p-6"
              >
                <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/90 p-6">
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Xmarty Creator</span>
                    <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-cyan-100">Live</span>
                  </div>
                  <div className="mt-8 space-y-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Learning Rhythm</p>
                      <div className="mt-3 h-3 rounded-full bg-white/5">
                        <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" />
                      </div>
                    </div>
                    <div className="grid gap-4 text-sm text-slate-300">
                      <div className="flex items-center justify-between">
                        <span>Student response</span>
                        <span className="font-semibold text-white">Fast</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Community strength</span>
                        <span className="font-semibold text-white">{stats?.[2]?.count || '1.8k+'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Resource consistency</span>
                        <span className="font-semibold text-white">Daily</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}

function sanitizeFounderHtml(value: string) {
  if (!value) return '';

  const basicSanitize = (raw: string) => {
    const allowedTags = new Set(['a', 'strong', 'b', 'em', 'i', 'u', 'br']);
    return raw.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tagName) => {
      const tag = tagName.toLowerCase();
      if (!allowedTags.has(tag)) return '';

      const isClosing = match.startsWith('</');
      if (tag === 'a') {
        if (isClosing) return '</a>';
        const hrefMatch = match.match(/href\s*=\s*(['"])(.*?)\1/i);
        const href = hrefMatch ? hrefMatch[2] : '';
        const safe = /^(https?:\/\/|mailto:|tel:)/i.test(href) ? href : '';
        if (!safe) return '<a>';
        return `<a href="${safe}" rel="noopener noreferrer" target="_blank">`;
      }
      return isClosing ? `</${tag}>` : `<${tag}>`;
    });
  };

  if (typeof window === 'undefined') {
    return basicSanitize(value);
  }

  const sanitized = sanitizeBlogContent(value);
  try {
    const doc = new DOMParser().parseFromString(sanitized, 'text/html');
    doc.querySelectorAll('a').forEach((anchor) => {
      const href = anchor.getAttribute('href') || '';
      const safe = /^https?:\/\//i.test(href) || href.startsWith('mailto:') || href.startsWith('tel:');
      if (!safe) {
        anchor.removeAttribute('href');
      }
      anchor.setAttribute('rel', 'noopener noreferrer');
      anchor.setAttribute('target', '_blank');
    });
    return doc.body.innerHTML;
  } catch {
    return basicSanitize(sanitized);
  }
}

function getIconComponent(iconName: string) {
  const key = String(iconName || '').trim().toLowerCase();
  const mapping: Record<string, any> = {
    rocket: Rocket,
    sparkles: Sparkles,
    globe: Globe,
    'book-open': BookOpen,
    book: BookOpen,
    award: Award,
    'shield-check': ShieldCheck,
    shield: ShieldCheck,
    users: Users,
    people: Users,
    'trending-up': TrendingUp,
    trending: TrendingUp,
    zap: Zap,
    message: MessageCircle,
    telegram: Send,
  };

  return mapping[key] || Sparkles;
}

function getSocialMeta(href: string, key: string) {
  const lowerHref = href.toLowerCase();
  const lowerKey = key.toLowerCase();

  if (lowerHref.includes('youtube') || lowerHref.includes('youtu.be') || lowerKey.includes('youtube')) {
    return { icon: Youtube, label: 'YouTube', className: 'bg-red-500/15 text-red-600 border-red-500/20' };
  }
  if (lowerHref.includes('instagram') || lowerKey.includes('instagram')) {
    return { icon: Instagram, label: 'Instagram', className: 'bg-gradient-to-r from-pink-500/15 via-purple-500/15 to-orange-400/15 text-pink-600 border-pink-500/20' };
  }
  if (lowerHref.includes('linkedin') || lowerKey.includes('linkedin')) {
    return { icon: Linkedin, label: 'LinkedIn', className: 'bg-sky-500/15 text-sky-700 border-sky-500/20' };
  }
  if (lowerHref.includes('twitter') || lowerHref.includes('x.com') || lowerKey === 'x' || lowerKey.includes('twitter')) {
    return { icon: Twitter, label: 'X', className: 'bg-slate-900/10 text-slate-800 border-slate-400/30' };
  }
  if (lowerHref.includes('facebook') || lowerKey.includes('facebook')) {
    return { icon: Globe, label: 'Facebook', className: 'bg-blue-600/15 text-blue-700 border-blue-500/20' };
  }
  if (lowerHref.includes('github') || lowerKey.includes('github')) {
    return { icon: Github, label: 'GitHub', className: 'bg-slate-800/10 text-slate-800 border-slate-500/30' };
  }
  if (lowerHref.includes('t.me') || lowerKey.includes('telegram')) {
    return { icon: Send, label: 'Telegram', className: 'bg-cyan-500/15 text-cyan-700 border-cyan-500/20' };
  }
  if (lowerHref.includes('wa.me') || lowerHref.includes('whatsapp') || lowerKey.includes('whatsapp')) {
    return { icon: MessageCircle, label: 'WhatsApp', className: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/20' };
  }

  return { icon: Globe, label: 'Website', className: 'bg-slate-200/70 text-slate-700 border-slate-300/70' };
}
