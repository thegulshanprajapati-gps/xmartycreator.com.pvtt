'use client';

import {
  ArrowRight,
  Instagram,
  Youtube,
  Zap,
  Lightbulb,
  Heart,
  Rocket,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Linkedin,
  Twitter,
  Facebook,
  Github,
  Globe,
  Send,
  MessageCircle,
} from 'lucide-react';
import { Footer } from '@/components/layout/footer';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { sanitizeBlogContent } from '@/lib/blog-utils';

type AboutContent = {
  hero: {
    title: string;
    description: string;
    imageId: string;
    image?: {
      id: string;
      imageUrl: string;
      description?: string;
      title?: string;
      imageHint?: string;
    };
  };
  story: {
    title: string;
    paragraphs: string[];
  };
  values: {
    title: string;
    description: string;
    items: Array<{ title: string; description: string }>;
  };
  founder: {
    title: string;
    description: string;
    name: string;
    role: string;
    bio: string;
    highlights: string[];
    imageId: string;
    image?: {
      id: string;
      imageUrl: string;
      description?: string;
      title?: string;
      imageHint?: string;
    };
    socials: {
      linkedin: string;
      twitter: string;
      instagram: string;
      youtube: string;
    };
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
  const heroImage = initialAboutContent?.hero?.image;
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  const founder = initialAboutContent?.founder;
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
    const sanitized = sanitizeBlogContent(value);
    // Extra safety: strip unsafe href protocols
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
      return sanitized;
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

  const valueIcons: Record<number, React.ReactNode> = {
    0: <Zap className="h-6 w-6" />,
    1: <Lightbulb className="h-6 w-6" />,
    2: <Heart className="h-6 w-6" />,
    3: <Rocket className="h-6 w-6" />
  };

  return (
    <>
      <div className="flex flex-col min-h-screen bg-background text-foreground">

        {/* ===== HERO SECTION ===== */}
        <section className="relative w-full min-h-[70vh] md:min-h-[60vh] flex items-center justify-center overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-slate-900/5 dark:to-slate-800/20" />
          
          {/* Animated Gradient Orbs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl opacity-50 animate-pulse" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          {/* Mobile Background */}
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
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          </div>

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="grid items-center gap-8 md:grid-cols-2 md:gap-16 py-12 md:py-0">
              {/* Left Content */}
              <motion.div
                className="flex flex-col justify-center space-y-6 text-center md:text-left md:items-start items-center"
                initial="hidden"
                animate="visible"
                variants={slideInFromLeft}
              >
                {/* Badge */}
                <motion.div 
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200/50 dark:border-blue-800/50 rounded-full px-4 py-2 w-fit"
                  variants={fadeIn}
                >
                  <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    Our Journey
                  </span>
                </motion.div>

                {/* Title */}
                <h1 
                  className="font-headline text-5xl lg:text-7xl font-bold tracking-tight leading-tight bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent"
                  dangerouslySetInnerHTML={{ __html: initialAboutContent?.hero?.title || 'About Us' }}
                />

                {/* Description */}
                <p className="max-w-[600px] text-lg text-muted-foreground leading-relaxed">
                  {initialAboutContent?.hero?.description || 'Discover our mission and what drives us'}
                </p>

                {/* CTA Button */}
                <div className="pt-6">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      asChild 
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
                    >
                      <Link href="/contact">
                        Get in Touch
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </motion.div>
                </div>
              </motion.div>

              {/* Right Visual */}
              {heroImage && (
                <motion.div
                  className="relative hidden md:flex flex-col justify-center items-center h-full"
                  initial="hidden"
                  animate="visible"
                  variants={slideInFromRight}
                >
                  <div className="relative w-full h-96 rounded-3xl overflow-hidden shadow-2xl">
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-500/30 via-purple-500/10 to-transparent blur-3xl rounded-full opacity-50" />
                    <Image
                      src={heroImage.imageUrl!}
                      alt={heroImage.description!}
                      data-ai-hint={heroImage.imageHint}
                      fill
                      className="object-cover"
                      priority
                    />
                    {/* Border gradient */}
                    <div className="absolute inset-0 border-2 border-gradient-to-r from-blue-400/50 via-purple-400/50 to-pink-400/50 rounded-3xl" />
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </section>

        {/* ===== STORY SECTION ===== */}
        {initialAboutContent?.story?.paragraphs && initialAboutContent.story.paragraphs.length > 0 && (
          <motion.section 
            className="w-full py-20 md:py-28 relative overflow-hidden"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeIn}
          >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/50 dark:to-background" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
              {/* Header */}
              <motion.div 
                className="flex flex-col items-center justify-center space-y-4 text-center mb-16"
                variants={fadeIn}
              >
                <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-200/50 dark:border-blue-800/50 rounded-full px-4 py-2">
                  <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {initialAboutContent?.story?.title || 'Our Story'}
                  </span>
                </div>
                <h2 className="font-headline text-4xl lg:text-5xl font-bold tracking-tight">
                  How It All Started
                </h2>
              </motion.div>

              {/* Story Content */}
              <div className="max-w-4xl mx-auto">
                {initialAboutContent.story.paragraphs.map((paragraph: string, index: number) => (
                  <motion.p
                    key={index}
                    className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-6 last:mb-0"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    {paragraph}
                  </motion.p>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* ===== VALUES SECTION ===== */}
        {(initialAboutContent?.values?.items || []).length > 0 && (
          <motion.section
            className="w-full py-20 md:py-28 relative overflow-hidden"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeIn}
          >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-background to-slate-50 dark:to-slate-900/30" />
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
                  <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    {initialAboutContent?.values?.title || 'Core Values'}
                  </span>
                </div>
                <h2 className="font-headline text-4xl lg:text-5xl font-bold tracking-tight">
                  What We Believe In
                </h2>
                {initialAboutContent?.values?.description && (
                  <p className="max-w-[800px] text-lg text-muted-foreground leading-relaxed">
                    {initialAboutContent.values.description}
                  </p>
                )}
              </motion.div>

              {/* Values Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {initialAboutContent.values.items.map((value: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -8 }}
                    className="group"
                  >
                    <div className="relative p-8 rounded-2xl bg-white dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 hover:border-primary/30 transition-all duration-300 hover:shadow-lg h-full">
                      {/* Background glow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                      
                      <div className="relative">
                        <div className="flex flex-col items-center text-center space-y-4">
                          {/* Icon */}
                          <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl group-hover:scale-110 transition-transform duration-300 text-primary">
                            {valueIcons[index]}
                          </div>
                          
                          {/* Content */}
                          <div>
                            <h3 className="text-xl font-bold text-foreground mb-2">
                              {value.title}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                              {value.description}
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

        {/* ===== FOUNDER SECTION ===== */}
        {hasFounder && (
          <section className="relative py-20 md:py-28 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-950/90 dark:to-slate-900" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_55%)] dark:bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.2),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(236,72,153,0.12),transparent_50%)] dark:bg-[radial-gradient(circle_at_bottom,rgba(236,72,153,0.18),transparent_50%)]" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
              <div className="grid gap-10 lg:grid-cols-[320px_1fr] items-start">
                <div className="space-y-6">
                  <div className="rounded-3xl border border-slate-200/70 dark:border-white/10 bg-white/90 dark:bg-white/5 p-6 shadow-[0_20px_55px_-30px_rgba(15,23,42,0.2)] dark:shadow-[0_20px_60px_-20px_rgba(15,23,42,0.7)] hover-lift hover-sheen">
                    <div className="flex flex-col items-center text-center gap-4">
                      <div className="p-1.5 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 shadow-[0_0_30px_rgba(99,102,241,0.35)]">
                        {founderImageUrl ? (
                          <div className="relative w-36 h-36 md:w-40 md:h-40 rounded-full overflow-hidden bg-slate-900">
                            <Image
                              src={founderImageUrl}
                              alt={founderNameRaw || ''}
                              fill
                              className="object-cover"
                              sizes="160px"
                            />
                          </div>
                        ) : (
                          <Avatar className="w-36 h-36 md:w-40 md:h-40">
                            <AvatarFallback className="text-4xl md:text-5xl bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200 font-semibold">
                              {founderNameRaw
                                ? founderNameRaw
                                    .replace(/[₱]/g, '₹')
                                    .replace(/[^A-Za-z\s₹]/g, '')
                                    .trim()
                                    .split(' ')
                                    .filter(Boolean)
                                    .map((n) => n[0])
                                    .join('')
                                    .toUpperCase() || '—'
                                : '—'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>

                      <div>
                        <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                          {founderName}
                        </h3>
                        <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">
                          {founderRole}
                        </p>
                      </div>

                      {founderDescription && (
                        <div
                          className="founder-rich text-sm text-slate-600 dark:text-slate-300"
                          dangerouslySetInnerHTML={{ __html: founderDescriptionHtml }}
                        />
                      )}

                      {founder?.highlights?.length > 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          {founder.highlights.slice(0, 6).map((item, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-slate-200/70 dark:border-white/10 text-slate-700 dark:text-slate-200"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {founderQuote && (
                  <div className="rounded-2xl border border-slate-200/80 bg-white/85 dark:bg-white/5 dark:border-white/10 p-5 text-sm text-slate-600 dark:text-slate-300 italic shadow-sm hover-lift-sm hover-sheen">
                      “{founderQuote}”
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="rounded-3xl border border-slate-200/70 bg-white/80 backdrop-blur-xl shadow-[0_20px_50px_-28px_rgba(15,23,42,0.25)] dark:border-white/10 dark:bg-white/5 dark:shadow-[0_20px_60px_-20px_rgba(15,23,42,0.7)] p-6 md:p-8 hover-lift hover-sheen">
                    {founderTitle && (
                      <h2 className="font-headline text-3xl md:text-4xl font-semibold text-slate-900 dark:text-white">
                        {founderTitle}
                      </h2>
                    )}

                    <div className="mt-6 space-y-4">
                      <div
                        id={bioId}
                        className="founder-rich text-base md:text-lg text-slate-700 dark:text-slate-200 leading-relaxed"
                        style={
                          shouldClampBio
                            ? {
                                display: '-webkit-box',
                                WebkitLineClamp: 4,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }
                            : undefined
                        }
                        dangerouslySetInnerHTML={{ __html: founderBioHtml }}
                      />

                      {isLongBio && (
                        <button
                          type="button"
                          onClick={() => setIsBioExpanded((prev) => !prev)}
                          aria-expanded={isBioExpanded}
                          aria-controls={bioId}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
                        >
                          {isBioExpanded ? (
                            <>
                              <span>Read Less</span>
                              <ChevronUp className="h-4 w-4" />
                            </>
                          ) : (
                            <>
                              <span>Read More</span>
                              <ChevronDown className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {hasSocial && (
                    <div className="flex flex-wrap gap-3">
                      {socialEntries.map(([key, href]) => {
                        const meta = getSocialMeta(href as string, key);
                        const LabelIcon = meta.icon;
                        return (
                          <a
                            key={`${key}-${href}`}
                            href={href as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={meta.label}
                            className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition-transform duration-150 hover:scale-[1.05] hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] dark:hover:shadow-[0_0_20px_rgba(59,130,246,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 hover-lift-sm ${meta.className}`}
                          >
                            <LabelIcon className="h-5 w-5" />
                            <span>
                              {getSocialLabel(
                                href as string,
                                (founderSocials as any)?.[`${key}Label`] || (founderSocials as any)?.[`${key}Text`],
                                meta.label
                              )}
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
        {/* ===== CTA SECTION ===== */}
        <motion.section 
          className="w-full py-20 md:py-24 relative overflow-hidden"
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
                Let's Build Something Together
              </motion.h2>
              
              <motion.p 
                className="max-w-[600px] text-lg text-blue-50 mx-auto mb-8"
                variants={fadeIn}
              >
                Have questions or want to collaborate? We'd love to hear from you.
              </motion.p>

              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center"
                whileHover={{ scale: 1.02 }}
              >
                <Button 
                  asChild 
                  size="lg"
                  className="bg-white text-blue-700 hover:bg-blue-600 hover:text-white font-bold shadow-lg dark:bg-white/90 dark:text-blue-800 dark:hover:bg-blue-500 dark:hover:text-white transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-md"
                >
                  <Link href="/contact">
                    Get in Touch
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
