'use client';

import { ArrowRight, Linkedin, Twitter, Instagram, Youtube, Zap, Lightbulb, Heart, Rocket, Sparkles, Link2, CheckCircle2 } from 'lucide-react';
import { Footer } from '@/components/layout/footer';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';

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
  const founderDescription = initialAboutContent?.founder?.description?.trim();
  const founderShortDescription = founderDescription && founderDescription.length > 180
    ? `${founderDescription.slice(0, 177)}...`
    : founderDescription;

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
        {(() => {
          const f = initialAboutContent?.founder;
          const hasSocial = f?.socials && Object.values(f.socials).some((v: any) => v);
          const hasHighlights = Boolean(f?.highlights && f.highlights.some((v) => v));
          const hasFounder = Boolean(f && (f.name || f.image || f.imageId || f.bio || f.description || f.role || hasSocial || hasHighlights));
          return hasFounder;
        })() && (
          <section className="relative py-20 md:py-28 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 via-white to-pink-50/50 dark:from-slate-900/40 dark:via-slate-900/20 dark:to-slate-900/40" />
            <div className="absolute -top-24 -right-32 w-80 h-80 bg-pink-400/20 blur-3xl rounded-full" />
            <div className="absolute -bottom-24 -left-32 w-80 h-80 bg-blue-400/20 blur-3xl rounded-full" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
              <div className="flex flex-col items-center gap-4 text-center mb-10">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500/15 via-purple-500/15 to-blue-500/15 border border-pink-200/60 dark:border-pink-800/60 rounded-full px-4 py-2">
                  <Sparkles className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                  <span className="text-sm font-semibold text-pink-600 dark:text-pink-300">Leadership Spotlight</span>
                </div>
                <h2 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">
                  {initialAboutContent.founder.title || 'Meet the Founder'}
                </h2>
                {founderShortDescription && (
                  <p className="max-w-3xl text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                    {founderShortDescription}
                  </p>
                )}
              </div>

              <div className="grid lg:grid-cols-[420px_1fr] gap-8 items-start bg-white/80 dark:bg-slate-900/60 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 backdrop-blur-md p-8 md:p-10">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-[6px] rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 shadow-lg">
                    {initialAboutContent.founder.image ? (
                      <div className="relative w-44 h-44 md:w-48 md:h-48 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                        <Image
                          src={initialAboutContent.founder.image.imageUrl}
                          alt={initialAboutContent.founder.image.description || initialAboutContent.founder.name || 'Founder'}
                          fill
                          className="object-cover"
                          sizes="192px"
                        />
                      </div>
                    ) : (
                      <Avatar className="w-48 h-48 border-4 border-primary/20 shadow-lg">
                        <AvatarFallback className="text-6xl bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                          {(() => {
                            const fallbackName = initialAboutContent.founder.name || 'Founder';
                            const sanitized = fallbackName.replace(/[₱]/g, '₹').replace(/[^A-Za-z\s₹]/g, '').trim();
                            const lettersOnly = sanitized.replace(/[^A-Za-z]/g, '');
                            return lettersOnly ? lettersOnly.split(' ').map(n => n[0]).join('').toUpperCase() : 'F';
                          })()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  <div className="text-center space-y-1">
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground">{initialAboutContent.founder.name || 'Founder'}</h3>
                    <p className="text-primary font-semibold">{initialAboutContent.founder.role || 'Leadership'}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {(initialAboutContent.founder.bio || initialAboutContent.founder.description) && (
                    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 p-4">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span>Founder Note</span>
                      </div>
                      <p className="mt-2 text-lg leading-relaxed text-slate-700 dark:text-slate-200">
                        {initialAboutContent.founder.bio || initialAboutContent.founder.description}
                      </p>
                    </div>
                  )}

                  {initialAboutContent.founder.highlights && initialAboutContent.founder.highlights.some((v) => v) && (
                    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 p-4">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span>Highlights</span>
                      </div>
                      <div className="mt-3 grid sm:grid-cols-2 gap-3">
                        {initialAboutContent.founder.highlights.filter(Boolean).map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900/40 p-3"
                          >
                            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                            <p className="text-sm text-slate-700 dark:text-slate-200">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Name</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{initialAboutContent.founder.name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Role</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{initialAboutContent.founder.role || '—'}</p>
                    </div>
                  </div>

                  {initialAboutContent.founder.socials && Object.values(initialAboutContent.founder.socials).some((v: any) => v) && (
                    <div className="flex flex-wrap gap-3">
                      {[
                        { icon: Linkedin, href: initialAboutContent.founder.socials.linkedin, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
                        { icon: Twitter, href: initialAboutContent.founder.socials.twitter, color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-900/30' },
                        { icon: Instagram, href: initialAboutContent.founder.socials.instagram, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/30' },
                        { icon: Youtube, href: initialAboutContent.founder.socials.youtube, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/30' },
                      ].map((item, idx) => item.href ? (
                        <motion.a
                          key={idx}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.05, y: -2 }}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700 ${item.bg} ${item.color} font-semibold text-sm`}
                        >
                          <item.icon className="h-5 w-5" />
                          <span className="hidden sm:inline">Connect</span>
                        </motion.a>
                      ) : null)}
                    </div>
                  )}
                  {(!initialAboutContent.founder.socials || !Object.values(initialAboutContent.founder.socials).some((v: any) => v)) && (
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <Link2 className="h-4 w-4" />
                      <span>Add social links to showcase presence.</span>
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


