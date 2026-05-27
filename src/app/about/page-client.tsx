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
  hidden: { opacity: 0, x: -100 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: 'easeOut' } },
};

const slideInFromRight = {
  hidden: { opacity: 0, x: 100 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: 'easeOut' } },
};

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
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

    let raf: number;
    const duration = 900;
    const start = performance.now();

    const tick = (time: number) => {
      const progress = Math.min((time - start) / duration, 1);
      const current = amount * progress;
      const formatted = suffix
        ? current.toFixed(decimals)
        : Math.round(current).toLocaleString();
      setDisplay(`${formatted}${suffix}`);
      if (progress < 1) raf = requestAnimationFrame(tick);
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
  const heroCards = hero?.cards || [];
  const featureCards = features.length > 0 ? features : services;
  const founderImageUrl = founder?.image?.imageUrl || '';
  const socialEntries = Object.entries(founder?.socials || {}).filter(
    ([, value]) => typeof value === 'string' && value.trim().length > 0
  );
  const hasSocial = socialEntries.length > 0;
  const hasFounder = Boolean(founder?.name || founder?.role || founder?.description || founder?.quote || founderImageUrl);

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
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      <section className="relative isolate overflow-hidden border-b border-white/10 bg-slate-950">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_38%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_18%,rgba(168,85,247,0.2),transparent_34%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(2,6,23,0.95),rgba(15,23,42,0.88)_45%,rgba(30,41,59,0.82))]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        <div className="relative z-10">
        <div className="container mx-auto px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-end">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={slideInFromLeft}
              className="space-y-7"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200/80">About</p>
              <h1 className="max-w-4xl text-4xl font-extrabold leading-[1.02] text-white sm:text-5xl lg:text-6xl">
                {hero?.title || 'About XmartyCreator'}
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-slate-200/90 sm:text-xl">
                {hero?.subtitle || 'We design thoughtful learning tools and curriculum that help students learn efficiently and confidently. Our focus is on measurable outcomes, accessibility, and community-driven support.'}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button
                  asChild
                  className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-6 text-white hover:bg-cyan-300/15"
                >
                  <Link href={hero?.primaryButton?.url || '#mission'}>{hero?.primaryButton?.text || 'Our Mission'}</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="rounded-full border border-white/12 px-6 text-slate-200 hover:bg-white/5 hover:text-white"
                >
                  <Link href={hero?.secondaryButton?.url || '/contact'}>{hero?.secondaryButton?.text || 'Contact Us'}</Link>
                </Button>
                <span className="ml-2 text-sm text-slate-400">Founded in <strong className="text-white">{journey?.[0]?.year || '2021'}</strong></span>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={slideInFromRight}
              className="grid gap-4 sm:grid-cols-2"
            >
              {(heroCards.length > 0
                ? heroCards.slice(0, 4)
                : [
                    { title: 'Students Helped', value: stats?.[0]?.count || '12k+', description: 'Learners supported through notes, exams, and updates.' },
                    { title: 'Resources Shared', value: stats?.[1]?.count || '1.8k', description: 'Curated study material delivered consistently.' },
                    { title: 'Career Updates', value: stats?.[2]?.count || '97%', description: 'Relevant notices and preparation guidance.' },
                    { title: 'Community Support', value: '24/7', description: 'Fast responses through social and student channels.' },
                  ]).map((card, index) => (
                <div
                  key={`${card.title}-${index}`}
                  className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.95)]"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/75">{card.title}</p>
                  <p className="mt-4 text-4xl font-black tracking-tight text-white">{card.value}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{card.description}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
        </div>
      </section>

      <section className="relative isolate py-16 sm:py-20 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-3xl">
            <span className="inline-flex rounded-full bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-200">Trusted outcomes</span>
            <h2 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">Real results, premium growth.</h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
              Data-driven trust and student success metrics from the front lines of modern learning.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat, index) => {
              const IconComponent = getIconComponent(stat.icon);
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.08 * index, duration: 0.55 }}
                  className="group rounded-[2rem] border border-white/10 bg-slate-950/90 p-8 shadow-2xl shadow-slate-950/20 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25">
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <p className="mt-6 text-4xl font-semibold text-white"><AnimatedCount value={stat.count} /></p>
                  <p className="mt-3 text-sm uppercase tracking-[0.24em] text-slate-500">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {journey.length > 0 && (
        <section className="relative py-20 sm:py-24 bg-slate-900/80">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-14 max-w-3xl text-center">
              <span className="inline-flex rounded-full bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-200">Our Journey</span>
              <h2 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">The story behind XmartyCreator</h2>
              <p className="mt-4 text-base leading-8 text-slate-300">
                A premium learning platform built step-by-step around student outcomes, reliability, and modern study experiences.
              </p>
            </div>
            <div className="relative overflow-hidden px-2">
              <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-blue-500/50 to-transparent" />
              <div className="space-y-10 lg:grid lg:grid-cols-4 lg:gap-6 lg:space-y-0">
                {journey.map((item, index) => {
                  const IconComponent = getIconComponent(item.icon);
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.08 * index, duration: 0.55 }}
                      className="relative rounded-[2rem] border border-white/10 bg-slate-950/90 p-8 shadow-2xl shadow-slate-950/10"
                    >
                      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white grid place-items-center shadow-lg shadow-blue-500/25">
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <p className="mt-8 text-xs uppercase tracking-[0.35em] text-blue-200">{item.year}</p>
                      <h3 className="mt-4 text-xl font-semibold text-white">{item.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-slate-400">{item.description}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {hasFounder && (
        <section className="relative isolate overflow-hidden py-20 sm:py-24 bg-slate-950/60">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_32%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.12),transparent_34%)]" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12 max-w-3xl">
              <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100">
                Leadership
              </span>
              <h2 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                {founder.title || 'Meet the Founder'}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
                A more personal look at the person behind Xmarty Creator and the standards shaping the platform.
              </p>
            </div>
            <div className="grid gap-8 xl:grid-cols-[380px_minmax(0,1fr)]">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={slideInFromLeft}
              >
                <div className="group relative [perspective:1800px]">
                  <div
                    className={`relative min-h-[620px] rounded-[2rem] transition-transform duration-700 [transform-style:preserve-3d] ${
                      isFounderCardFlipped ? '[transform:rotateY(180deg)]' : ''
                    } group-hover:[transform:rotateY(180deg)]`}
                  >
                    <div className="absolute inset-0 overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(17,24,39,0.92))] p-7 shadow-[0_30px_90px_-56px_rgba(2,6,23,1)] [backface-visibility:hidden]">
                      <div className="flex h-full flex-col gap-6">
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

                        <div className="relative h-[340px] overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-cyan-500/10 via-slate-900 to-purple-500/10 shadow-lg shadow-slate-950/30">
                          {founderImageUrl ? (
                            <Image
                              src={founderImageUrl}
                              alt={founder.name || 'Founder'}
                              fill
                              className="object-cover object-top"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-5xl font-bold text-white">
                              {founder.name?.split(' ').map((word) => word[0]).join('')}
                            </div>
                          )}
                        </div>

                        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                          <h3 className="text-3xl font-bold text-white">{founder.name}</h3>
                          <p className="mt-2 text-base text-slate-400">{founder.role}</p>
                          {founder.username ? (
                            <p className="mt-3 text-sm font-medium text-cyan-200/80">@{founder.username.replace(/^@/, '')}</p>
                          ) : null}
                        </div>

                        {founder.highlights.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {founder.highlights.slice(0, 3).map((highlight, index) => (
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

                    <div className="absolute inset-0 overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(8,47,73,0.96),rgba(17,24,39,0.98))] p-7 shadow-[0_30px_90px_-56px_rgba(8,47,73,0.9)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
                      <div className="flex h-full flex-col gap-6">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm uppercase tracking-[0.32em] text-cyan-100/80">Connect</p>
                            <h3 className="mt-3 text-2xl font-bold text-white">Beyond the profile</h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsFounderCardFlipped(false)}
                            className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-100 transition hover:bg-white/10 lg:hidden"
                          >
                            Back
                          </button>
                        </div>

                        {founder.highlights.length > 0 && (
                          <div className="grid gap-3">
                            {founder.highlights.slice(0, 4).map((item, index) => (
                              <div
                                key={`${item}-back-${index}`}
                                className="rounded-[1.25rem] border border-white/10 bg-white/6 px-4 py-4 text-sm leading-7 text-slate-100"
                              >
                                {item}
                              </div>
                            ))}
                          </div>
                        )}

                        {hasSocial && (
                          <div className="flex flex-wrap gap-3">
                            {socialEntries.map(([key, href]) => {
                              const meta = getSocialMeta(href, key);
                              const Icon = meta.icon;
                              return (
                                <a
                                  key={key}
                                  href={href}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 ${meta.className}`}
                                >
                                  <Icon className="h-4 w-4" />
                                  <span>{meta.label}</span>
                                </a>
                              );
                            })}
                          </div>
                        )}

                        <div className="mt-auto rounded-[1.5rem] border border-cyan-400/15 bg-cyan-400/8 p-5">
                          <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/70">Founder Note</p>
                          <p className="mt-3 text-sm leading-7 text-slate-100">
                            Explore the story cards on the right for the full mission, philosophy, and platform direction.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="grid gap-6"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={slideInFromRight}
              >
                <div className="rounded-[2rem] border border-white/10 bg-slate-900/75 p-8 shadow-[0_30px_90px_-56px_rgba(2,6,23,1)]">
                  <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100">
                    <Sparkles className="h-4 w-4" /> Founder Vision
                  </span>
                  <div className="mt-5 space-y-5">
                    <div
                      className="founder-rich text-base leading-8 text-slate-200"
                      dangerouslySetInnerHTML={{ __html: founderDescriptionHtml }}
                    />
                    {founder.quote && (
                      <div className="rounded-[1.5rem] border border-cyan-400/15 bg-cyan-400/5 p-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/70">Founder Quote</p>
                        <p className="mt-4 text-2xl font-semibold leading-10 text-white">"{founder.quote}"</p>
                      </div>
                    )}
                  </div>
                </div>

                {founder.bio && (
                  <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(30,41,59,0.7),rgba(15,23,42,0.82))] p-8 shadow-[0_24px_80px_-52px_rgba(2,6,23,1)]">
                    <div className="flex items-start justify-between gap-6">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Story</p>
                        <h3 className="mt-3 text-2xl font-bold text-white">What Xmarty Creator is building</h3>
                      </div>
                      {founder.highlights.length > 0 && (
                        <div className="hidden md:grid min-w-[220px] gap-3">
                          {founder.highlights.slice(0, 3).map((item, index) => (
                            <div key={`${item}-desktop-${index}`} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                              {item}
                            </div>
                          ))}
                        </div>
                      )}
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
        <section className="relative py-20 sm:py-24 bg-slate-950/80">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12 max-w-3xl text-center">
              <span className="inline-flex rounded-full bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-200">Why Students Trust XmartyCreator</span>
              <h2 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">Why choose XmartyCreator?</h2>
            </div>
            <div className="grid gap-6 xl:grid-cols-3 lg:grid-cols-2">
              {featureCards.map((feature, index) => {
                const IconComponent = getIconComponent(feature.icon);
                return (
                  <motion.div
                    key={index}
                    className="rounded-[2rem] border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/20 transition-transform duration-300 hover:-translate-y-1"
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.08 * index, duration: 0.45 }}
                  >
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/20">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <h3 className="mt-6 text-xl font-semibold text-white">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-400">{feature.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {testimonials.length > 0 && (
        <section className="relative py-20 sm:py-24 bg-slate-900/90">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12 max-w-3xl text-center">
              <span className="inline-flex rounded-full bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-200">Student stories</span>
              <h2 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">Trusted by learners across every subject.</h2>
            </div>
            <div className="relative">
              <Carousel
                opts={{ align: 'start', dragFree: true, containScroll: 'trimSnaps', loop: true }}
                setApi={setCarouselApi}
                className="relative"
              >
                <CarouselContent className="py-3 select-none">
                  {testimonials.map((testimonial, index) => (
                    <CarouselItem key={testimonial.id || index} className="md:basis-1/2 lg:basis-1/3">
                      <motion.div
                        className="mx-3 rounded-[2rem] border border-white/10 bg-slate-950/90 p-8 shadow-2xl shadow-slate-950/20"
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-500/10 text-blue-200 text-lg font-bold">
                            {testimonial.name?.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-white">{testimonial.name}</p>
                            <p className="text-sm text-slate-400">{testimonial.role} • {testimonial.course}</p>
                          </div>
                        </div>
                        <p className="mt-6 text-sm leading-7 text-slate-300">“{testimonial.review}”</p>
                        {testimonial.rating && (
                          <p className="mt-6 text-sm uppercase tracking-[0.3em] text-blue-300">Rating: {testimonial.rating}</p>
                        )}
                      </motion.div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="border-white/20 bg-slate-950/80 text-white shadow-lg shadow-slate-950/20" />
                <CarouselNext className="border-white/20 bg-slate-950/80 text-white shadow-lg shadow-slate-950/20" />
              </Carousel>
            </div>
          </div>
        </section>
      )}

      {team.length > 0 && (
        <section className="relative py-20 sm:py-24 bg-slate-950/80">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12 max-w-3xl text-center">
              <span className="inline-flex rounded-full bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-200">Leadership team</span>
              <h2 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">A team built for premium learning.</h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-4 md:grid-cols-2">
              {team.map((member, index) => (
                <motion.div
                  key={member.id || index}
                  className="rounded-[2rem] border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/20 transition-transform duration-300 hover:-translate-y-1"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.06 * index, duration: 0.45 }}
                >
                  <div className="mb-6 flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-500/10 text-blue-200 text-lg font-bold">
                      {member.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{member.name}</p>
                      <p className="text-sm text-slate-400">{member.role}</p>
                    </div>
                  </div>
                  <p className="text-sm leading-7 text-slate-400">{member.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {faq.length > 0 && (
        <section className="relative py-20 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12 max-w-3xl text-center">
              <span className="inline-flex rounded-full bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-200">FAQs</span>
              <h2 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">Questions answered instantly.</h2>
              <p className="mt-4 text-base leading-8 text-slate-400">Clear, modern guidance for learners who want to move faster with confidence.</p>
            </div>
            <div className="space-y-4">
              <Accordion type="single" collapsible className="space-y-4">
                {faq.map((item, index) => (
                  <AccordionItem
                    key={index}
                    value={`faq-${index}`}
                    className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/90 shadow-2xl shadow-slate-950/20"
                  >
                    <AccordionTrigger className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-base font-semibold text-white transition hover:text-blue-200">
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
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 py-20 sm:py-24 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.22),transparent_40%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.18),transparent_35%)]" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] items-center">
              <motion.div
                className="rounded-[2rem] border border-white/10 bg-white/5 p-10 shadow-2xl shadow-slate-950/20 backdrop-blur-xl"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeIn}
              >
                <span className="inline-flex rounded-full bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-200">Start Today</span>
                <h2 className="mt-6 text-4xl font-bold tracking-tight text-white">{cta.title}</h2>
                <p className="mt-4 text-lg leading-8 text-slate-300">{cta.subtitle}</p>
                <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Button
                    asChild
                    size="lg"
                    className="min-w-[170px] bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-xl shadow-blue-500/20 hover:shadow-purple-500/30 transition-all duration-300"
                  >
                    <Link href={cta.primaryButton?.url || '/courses'}>
                      {cta.primaryButton?.text || 'Explore Courses'}
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="min-w-[170px] border-white/20 text-white hover:border-white hover:bg-white/10 transition-all duration-300"
                  >
                    <Link href={cta.secondaryButton?.url || '/community'}>
                      {cta.secondaryButton?.text || 'Join Community'}
                    </Link>
                  </Button>
                </div>
              </motion.div>
              <motion.div
                className="hidden lg:block"
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <div className="rounded-[2rem] bg-white/5 p-8 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
                  <div className="h-72 rounded-[1.75rem] bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_55%)] p-6 text-slate-100">
                    <div className="h-full rounded-[1.5rem] border border-white/10 bg-slate-950/90 p-6">
                      <div className="flex items-center justify-between text-sm text-slate-400">
                        <span>XmartyCreator Dashboard</span>
                        <span className="rounded-full bg-slate-900/70 px-3 py-1 text-xs uppercase tracking-[0.28em] text-slate-200">New</span>
                      </div>
                      <div className="mt-8 grid gap-4">
                        <div className="h-3 rounded-full bg-slate-800">
                          <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                        </div>
                        <div className="grid gap-2 text-sm text-slate-300">
                          <div className="flex items-center justify-between">
                            <span>Study streak</span>
                            <span className="font-semibold text-white">14 days</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Peer response</span>
                            <span className="font-semibold text-white">98%</span>
                          </div>
                        </div>
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
