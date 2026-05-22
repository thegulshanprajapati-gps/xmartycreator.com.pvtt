'use client';

import {
  ArrowRight,
  Instagram,
  Youtube,
  Zap,
  Rocket,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Linkedin,
  Twitter,
  Facebook,
  Github,
  Globe,
  Send,
  MessageCircle,
  ShieldCheck,
  BookOpen,
  Award,
  Users,
  TrendingUp,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { sanitizeBlogContent } from '@/lib/blog-utils';

type ButtonLink = {
  text: string;
  url: string;
};

type AboutContent = {
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    imageId: string;
    image?: {
      id: string;
      imageUrl: string;
      description?: string;
      title?: string;
      imageHint?: string;
    };
    primaryButton: ButtonLink;
    secondaryButton: ButtonLink;
  };
  stats: Array<{ icon: string; count: string; label: string }>;
  journey: Array<{ icon: string; year: string; title: string; description: string }>;
  founder: {
    imageId: string;
    image?: {
      id: string;
      imageUrl: string;
      description?: string;
      title?: string;
      imageHint?: string;
    };
    name: string;
    role: string;
    username?: string;
    title?: string;
    description: string;
    bio?: string;
    quote?: string;
    highlights?: string[];
    socials: Record<string, string>;
  };
  services: Array<{ icon: string; title: string; description: string }>;
  cta: {
    imageId: string;
    image?: {
      id: string;
      imageUrl: string;
      description?: string;
      title?: string;
      imageHint?: string;
    };
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
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: 'easeOut' } }
};

const slideInFromRight = {
  hidden: { opacity: 0, x: 100 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: 'easeOut' } }
};

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } }
};

export default function AboutPageClient({ initialAboutContent }: AboutPageClientProps) {
  const hero = initialAboutContent?.hero;
  const stats = initialAboutContent?.stats || [];
  const journey = initialAboutContent?.journey || [];
  const founder = initialAboutContent?.founder;
  const services = initialAboutContent?.services || [];
  const cta = initialAboutContent?.cta;
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  const heroImage = initialAboutContent?.hero?.image;
  const founderSocials = (founder as any)?.socials || (founder as any)?.social || {};
  const founderNameRaw = founder?.name?.trim();
  const founderRoleRaw = founder?.role?.trim();
  const founderTitleRaw = founder?.title?.trim();
  const founderDescriptionRaw = founder?.description?.trim();
  const founderBioRaw = founder?.bio?.trim();
  const founderQuoteRaw = (founder as any)?.quote?.trim();
  const founderImageUrl =
    founder?.image?.imageUrl || (founder as any)?.imageUrl || (founder as any)?.image?.url;

  const socialEntries = Object.entries(founderSocials || {}).filter(
    ([, value]) => typeof value === 'string' && value.trim().length > 0
  );
  const hasSocial = socialEntries.length > 0;
  const hasFounder = Boolean(
    founderNameRaw ||
      founderRoleRaw ||
      founderTitleRaw ||
      founderDescriptionRaw ||
      founderBioRaw ||
      founderQuoteRaw ||
      founderImageUrl ||
      hasSocial
  );

  const founderName = founderNameRaw || '—';
  const founderRole = founderRoleRaw || '—';
  const founderTitle = founderTitleRaw;
  const founderDescription = founderDescriptionRaw;
  const founderBio = founderBioRaw || '—';
  const founderQuote = founderQuoteRaw;

  const sanitizeFounderHtml = (value: string) => {
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
  };

  const founderDescriptionHtml = useMemo(
    () => sanitizeFounderHtml(founderDescription || ''),
    [founderDescription]
  );
  const founderBioHtml = useMemo(
    () => sanitizeFounderHtml(founderBio || ''),
    [founderBio]
  );

  const bioId = 'founder-bio';
  const isLongBio = Boolean(founderBioRaw && founderBioRaw.length > 260);
  const shouldClampBio = isLongBio && !isBioExpanded;

  const getSocialLabel = (href?: string, label?: string, fallbackLabel?: string) => {
    if (label && label.trim()) return label.trim();
    if (fallbackLabel && fallbackLabel.trim()) return fallbackLabel.trim();
    if (!href) return '';
    try {
      const host = new URL(href).hostname.replace(/^www\./, '');
      return host;
    } catch {
      return '';
    }
  };

  const getSocialMeta = (href: string, key: string) => {
    const lowerHref = href.toLowerCase();
    const lowerKey = key.toLowerCase();

    if (lowerHref.includes('youtube') || lowerHref.includes('youtu.be') || lowerKey.includes('youtube')) {
      return { icon: Youtube, label: 'YouTube', className: 'bg-red-500/15 text-red-600 dark:text-red-300 border-red-500/20' };
    }
    if (lowerHref.includes('instagram') || lowerKey.includes('instagram')) {
      return { icon: Instagram, label: 'Instagram', className: 'bg-gradient-to-r from-pink-500/15 via-purple-500/15 to-orange-400/15 text-pink-600 dark:text-pink-300 border-pink-500/20' };
    }
    if (lowerHref.includes('linkedin') || lowerKey.includes('linkedin')) {
      return { icon: Linkedin, label: 'LinkedIn', className: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/20' };
    }
    if (lowerHref.includes('twitter') || lowerHref.includes('x.com') || lowerKey === 'x' || lowerKey.includes('twitter')) {
      return { icon: Twitter, label: 'X', className: 'bg-slate-900/10 text-slate-800 dark:text-slate-200 border-slate-400/30' };
    }
    if (lowerHref.includes('facebook') || lowerKey.includes('facebook')) {
      return { icon: Facebook, label: 'Facebook', className: 'bg-blue-600/15 text-blue-700 dark:text-blue-300 border-blue-500/20' };
    }
    if (lowerHref.includes('github') || lowerKey.includes('github')) {
      return { icon: Github, label: 'GitHub', className: 'bg-slate-800/10 text-slate-800 dark:text-slate-200 border-slate-500/30' };
    }
    if (lowerHref.includes('t.me') || lowerKey.includes('telegram')) {
      return { icon: Send, label: 'Telegram', className: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/20' };
    }
    if (lowerHref.includes('wa.me') || lowerHref.includes('whatsapp') || lowerKey.includes('whatsapp')) {
      return { icon: MessageCircle, label: 'WhatsApp', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20' };
    }

    return { icon: Globe, label: 'Website', className: 'bg-slate-200/70 text-slate-700 dark:text-slate-200 border-slate-300/70 dark:bg-white/5 dark:border-white/10' };
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 opacity-90" />
        <div className="absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-500/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />

        <div className="container mx-auto px-4 py-20 lg:px-6">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={slideInFromLeft}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-blue-200 shadow-sm shadow-blue-500/10">
                <Sparkles className="h-4 w-4 text-blue-200" />
                {hero?.badge || 'Premium Startup Experience'}
              </div>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                {hero?.title || 'We build premium MERN learning products for modern students.'}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
                {hero?.subtitle || 'A polished digital platform that brings SBTE updates, study resources and community support into one experience.'}
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Button
                  asChild
                  size="lg"
                  className="min-w-[170px] bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-xl shadow-blue-500/30 hover:shadow-purple-500/30 transition-all duration-300"
                >
                  <Link href={hero?.primaryButton?.url || '/courses'}>
                    {hero?.primaryButton?.text || 'Explore Courses'}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="min-w-[170px] border-white/20 text-white hover:border-white hover:bg-white/10 transition-all duration-300"
                >
                  <Link href={hero?.secondaryButton?.url || '/contact'}>
                    {hero?.secondaryButton?.text || 'Contact Us'}
                  </Link>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={slideInFromRight}
              className="grid gap-4 sm:grid-cols-2"
            >
              {stats.slice(0, 4).map((stat, index) => {
                const IconComponent = getIconComponent(stat.icon);
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.08 * index, duration: 0.5 }}
                    className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25 mb-4">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <p className="text-3xl font-semibold text-white">{stat.count}</p>
                    <p className="mt-2 text-sm text-slate-300">{stat.label}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {journey.length > 0 && (
        <motion.section
          className="relative overflow-hidden bg-slate-950/5 py-20 md:py-28"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeIn}
        >
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mx-auto mb-12 max-w-3xl">
              <span className="inline-flex rounded-full bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-600">Our Journey</span>
              <h2 className="mt-6 text-4xl font-bold tracking-tight text-slate-950">The evolution of Xmarty Creator</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                A modern timeline that highlights key moments of product quality, community growth, and startup momentum.
              </p>
            </div>

            <div className="relative overflow-hidden px-2">
              <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-slate-200" />
              <div className="grid gap-8 lg:grid-cols-4">
                {journey.map((item, index) => {
                  const IconComponent = getIconComponent(item.icon);
                  return (
                    <motion.div
                      key={index}
                      className="relative rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-lg shadow-slate-900/5"
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.08 * index, duration: 0.5 }}
                    >
                      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-blue-600 text-white grid place-items-center shadow-lg shadow-blue-500/20">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="mt-8 text-center">
                        <p className="text-xs uppercase tracking-[0.28em] text-blue-600">{item.year}</p>
                        <h3 className="mt-4 text-xl font-semibold text-slate-950">{item.title}</h3>
                        <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {(founder?.name || founder?.role) && (
        <motion.section
          className="relative py-20 md:py-28"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeIn}
        >
          <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-blue-500/10 to-transparent" />
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="grid gap-10 lg:grid-cols-[360px_1fr] items-start">
              <motion.div
                className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-2xl shadow-slate-900/10"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="space-y-6 text-center">
                  <div className="mx-auto h-44 w-44 overflow-hidden rounded-[2rem] bg-slate-900 shadow-lg shadow-slate-900/20">
                    {founderImageUrl ? (
                      <Image
                        src={founderImageUrl}
                        alt={founder.name || 'Founder'}
                        width={176}
                        height={176}
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-white">
                        {founder.name?.split(' ').map((word) => word[0]).join('')}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-blue-600">Founder</p>
                    <h3 className="mt-3 text-3xl font-bold text-slate-950">{founder.name}</h3>
                    <p className="mt-2 text-sm text-slate-600">{founder.role}</p>
                  </div>
                  <div className="rounded-[2rem] border border-slate-200/80 bg-slate-50 p-6 text-left">
                    <p className="text-sm leading-7 text-slate-700">{founder.description}</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    {socialEntries.map(([key, href]) => {
                      const meta = getSocialMeta(href, key);
                      const Icon = meta.icon;
                      return (
                        <a
                          key={key}
                          href={href}
                          target="_blank"
                          rel="noreferrer noopener"
                          className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition hover:scale-[1.02] ${meta.className}`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{meta.label}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="rounded-[2rem] border border-slate-200/80 bg-white p-10 shadow-2xl shadow-slate-900/10"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-600">
                  <Sparkles className="h-4 w-4" /> Founder Quote
                </span>
                <h2 className="mt-6 text-4xl font-bold text-slate-950">{founder.username || founder.name}</h2>
                <p className="mt-6 text-xl leading-9 text-slate-700">“{founder.quote}”</p>
                <div className="mt-10 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-950 p-6 text-white">
                    <p className="text-xs uppercase tracking-[0.3em] text-blue-300">Role</p>
                    <p className="mt-3 text-lg font-semibold">{founder.role}</p>
                  </div>
                  <div className="rounded-3xl bg-blue-600 p-6 text-white">
                    <p className="text-xs uppercase tracking-[0.3em] text-blue-100">Handle</p>
                    <p className="mt-3 text-lg font-semibold">{founder.username || '@xmartycreator'}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>
      )}

      {services.length > 0 && (
        <motion.section
          className="relative py-20 md:py-28 bg-slate-50"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeIn}
        >
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <span className="inline-flex rounded-full bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-600">What We Do</span>
              <h2 className="mt-6 text-4xl font-bold tracking-tight text-slate-950">Premium services for modern learners</h2>
            </div>
            <div className="grid gap-6 xl:grid-cols-5 lg:grid-cols-2 md:grid-cols-2">
              {services.map((item, index) => {
                const IconComponent = getIconComponent(item.icon);
                return (
                  <motion.div
                    key={index}
                    className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-lg shadow-slate-900/5 transition-transform duration-300 hover:-translate-y-1"
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.08 * index, duration: 0.45 }}
                  >
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 text-white mb-5 shadow-lg shadow-blue-500/20">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-950 mb-3">{item.title}</h3>
                    <p className="text-sm leading-6 text-slate-600">{item.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.section>
      )}

      {cta?.title && (
        <motion.section
          className="relative overflow-hidden py-20 md:py-28 bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 text-white"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeIn}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.25),transparent_45%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.18),transparent_40%)]" />
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
              <motion.div
                className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/20"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                {cta.image?.imageUrl ? (
                  <Image
                    src={cta.image.imageUrl}
                    alt={cta.image.description || 'CTA illustration'}
                    width={760}
                    height={520}
                    className="h-full w-full rounded-[1.75rem] object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center rounded-[1.75rem] bg-white/10 p-10 text-center">
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/20 text-blue-200 mb-6">
                      <Sparkles className="h-10 w-10" />
                    </div>
                    <p className="max-w-sm text-sm leading-6 text-slate-200">Dynamic illustration image will appear here when an image is configured in the admin database.</p>
                  </div>
                )}
              </motion.div>

              <motion.div
                className="rounded-[2rem] border border-white/10 bg-slate-950/95 p-10 shadow-2xl shadow-slate-950/20"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <span className="inline-flex rounded-full bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-200">Ready to launch</span>
                <h2 className="mt-6 text-4xl font-bold tracking-tight text-white">{cta.title}</h2>
                <p className="mt-4 text-lg leading-8 text-slate-300">{cta.subtitle}</p>
                <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Button
                    asChild
                    size="lg"
                    className="min-w-[170px] bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-xl shadow-blue-500/20 hover:shadow-purple-500/30 transition-all duration-300"
                  >
                    <Link href={cta.primaryButton?.url || '/signup'}>
                      {cta.primaryButton?.text || 'Start Now'}
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="min-w-[170px] border-white/20 text-white hover:border-white hover:bg-white/10 transition-all duration-300"
                  >
                    <Link href={cta.secondaryButton?.url || '/contact'}>
                      {cta.secondaryButton?.text || 'Talk to Us'}
                    </Link>
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
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
    return { icon: Youtube, label: 'YouTube', className: 'bg-red-500/15 text-red-600 dark:text-red-300 border-red-500/20' };
  }
  if (lowerHref.includes('instagram') || lowerKey.includes('instagram')) {
    return { icon: Instagram, label: 'Instagram', className: 'bg-gradient-to-r from-pink-500/15 via-purple-500/15 to-orange-400/15 text-pink-600 dark:text-pink-300 border-pink-500/20' };
  }
  if (lowerHref.includes('linkedin') || lowerKey.includes('linkedin')) {
    return { icon: Linkedin, label: 'LinkedIn', className: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/20' };
  }
  if (lowerHref.includes('twitter') || lowerHref.includes('x.com') || lowerKey === 'x' || lowerKey.includes('twitter')) {
    return { icon: Twitter, label: 'X', className: 'bg-slate-900/10 text-slate-800 dark:text-slate-200 border-slate-400/30' };
  }
  if (lowerHref.includes('facebook') || lowerKey.includes('facebook')) {
    return { icon: Facebook, label: 'Facebook', className: 'bg-blue-600/15 text-blue-700 dark:text-blue-300 border-blue-500/20' };
  }
  if (lowerHref.includes('github') || lowerKey.includes('github')) {
    return { icon: Github, label: 'GitHub', className: 'bg-slate-800/10 text-slate-800 dark:text-slate-200 border-slate-500/30' };
  }
  if (lowerHref.includes('t.me') || lowerKey.includes('telegram')) {
    return { icon: Send, label: 'Telegram', className: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/20' };
  }
  if (lowerHref.includes('wa.me') || lowerHref.includes('whatsapp') || lowerKey.includes('whatsapp')) {
    return { icon: MessageCircle, label: 'WhatsApp', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20' };
  }

  return { icon: Globe, label: 'Website', className: 'bg-slate-200/70 text-slate-700 dark:text-slate-200 border-slate-300/70 dark:bg-white/5 dark:border-white/10' };
}
