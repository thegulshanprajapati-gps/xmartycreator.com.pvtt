'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Clock3 } from 'lucide-react';
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

function AnimatedStatValue({ value, suffix = '' }: { value: number | string; suffix?: string }) {
  if (typeof value === 'string') return <span>{value}</span>;
  const animated = useAnimatedValue(value);
  const formatted = Number.isInteger(value) ? Math.round(animated).toLocaleString() : animated.toFixed(1);
  return (
    <span>
      {formatted}
      {suffix}
    </span>
  );
}

function AccentHeading({ text }: { text: string }) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) {
    return <span className="text-black dark:text-white transition-colors">{text}</span>;
  }
  const accentWord = words[words.length - 1];
  const leading = words.slice(0, -1).join(' ');
  return (
    <>
      <span className="text-black dark:text-white transition-colors">{leading} </span>
      <span className="text-red-600 dark:text-red-500 transition-colors font-bold">{accentWord}</span>
    </>
  );
}

function HeroLoadingState() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-white dark:bg-black transition-colors">
      {/* Light Mode Background */}
      <div className="absolute inset-0 block dark:hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-100/20 via-transparent to-white" />
      </div>
      
      {/* Dark Mode Background */}
      <div className="absolute inset-0 hidden dark:block">
        <div className="absolute inset-0 bg-gradient-to-b from-red-500/20 via-black/50 to-black" />
      </div>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4">
        <div className="w-full max-w-2xl space-y-6">
          <div className="h-16 w-full animate-pulse rounded-lg bg-black/10 dark:bg-white/5 transition-colors" />
          <div className="h-6 w-3/4 animate-pulse rounded-lg bg-black/10 dark:bg-white/5 transition-colors" />
          <div className="h-12 w-40 animate-pulse rounded-lg bg-red-600/20 dark:bg-red-500/20 transition-colors" />
          <div className="mt-20 h-48 w-full animate-pulse rounded-2xl bg-black/10 dark:bg-white/5 transition-colors" />
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

  const content = heroContent || (useDefaultFallback ? fallbackContent : null);

  if (!content && !requestCompleted) {
    return <HeroLoadingState />;
  }

  if (!content) {
    return null;
  }

  return (
    <section className={`relative h-screen w-full overflow-hidden bg-white dark:bg-black transition-colors duration-300 ${className}`.trim()}>
      {/* Light Mode Background */}
      <div className="absolute inset-0 block dark:hidden pointer-events-none">
        {/* Gradient mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-red-50/30 to-red-100/20" />
        
        {/* Animated top accent */}
        <motion.div 
          className="absolute -top-40 left-1/4 w-96 h-96 bg-gradient-to-br from-red-300/30 via-red-200/20 to-transparent rounded-full blur-3xl"
          animate={{ y: [0, 30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        
        {/* Center warm glow */}
        <motion.div 
          className="absolute top-1/3 right-1/4 w-96 h-96 bg-gradient-to-tl from-red-200/25 via-orange-100/15 to-transparent rounded-full blur-3xl"
          animate={{ scale: [1, 1.15, 1], x: [0, 30, 0] }}
          transition={{ duration: 12, repeat: Infinity, delay: 1 }}
        />
        
        {/* Bottom accent */}
        <motion.div 
          className="absolute -bottom-48 -left-40 w-80 h-80 bg-gradient-to-tr from-red-200/20 to-transparent rounded-full blur-3xl"
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 9, repeat: Infinity, delay: 2 }}
        />

        {/* Geometric lines */}
        <div className="absolute top-20 right-20 w-64 h-1 bg-gradient-to-r from-transparent via-red-300/30 to-transparent rotate-45" />
        <div className="absolute bottom-32 left-10 w-48 h-1 bg-gradient-to-r from-transparent via-red-200/40 to-transparent -rotate-12" />
      </div>

      {/* Dark Mode Background */}
      <div className="absolute inset-0 hidden dark:block pointer-events-none">
        {/* Main gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/40 via-black to-black" />
        
        {/* Animated radial gradients */}
        <motion.div 
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-b from-red-600/20 via-red-500/10 to-transparent rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.15, 1],
            y: [0, 30, 0]
          }}
          transition={{ duration: 12, repeat: Infinity }}
        />
        
        {/* Left accent glow */}
        <motion.div 
          className="absolute left-0 top-1/3 -translate-x-1/3 w-96 h-96 bg-gradient-to-r from-red-700/20 to-transparent rounded-full blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        
        {/* Right accent glow */}
        <motion.div 
          className="absolute right-0 bottom-1/4 translate-x-1/3 w-96 h-96 bg-gradient-to-l from-red-600/15 to-transparent rounded-full blur-3xl"
          animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
          transition={{ duration: 11, repeat: Infinity, delay: 1 }}
        />
        <div className="absolute left-14 bottom-10 h-24 w-1.5 rounded-full bg-red-500/30 blur-2xl" />
        <div className="absolute right-20 top-16 h-16 w-16 rounded-full border border-red-400/20 opacity-70" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(0deg,transparent_24%,rgba(220,38,38,.05)_25%,rgba(220,38,38,.05)_26%,transparent_27%,transparent_74%,rgba(220,38,38,.05)_75%,rgba(220,38,38,.05)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(220,38,38,.05)_25%,rgba(220,38,38,.05)_26%,transparent_27%,transparent_74%,rgba(220,38,38,.05)_75%,rgba(220,38,38,.05)_76%,transparent_77%,transparent)] bg-[length:60px_60px]" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-3 py-6 sm:px-4 sm:py-8 md:px-6 lg:px-8">
        {/* Mobile: Single Column, Desktop: Two Columns */}
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-center">
          
          {/* LEFT COLUMN - Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="space-y-4 sm:space-y-6 md:space-y-8 order-2 lg:order-1"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex items-center justify-center lg:justify-start gap-2"
            >
              <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-red-400/50 bg-gradient-to-r from-red-100 to-red-50 dark:border-red-500/20 dark:from-red-500/10 dark:to-red-600/5 px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-300 transition-all duration-300 shadow-md shadow-red-200/30 dark:shadow-none hover:shadow-lg hover:shadow-red-300/40">
                <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span>Premium Learning</span>
              </div>
            </motion.div>

            {/* Heading */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center lg:text-left"
            >
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-black dark:text-white leading-tight tracking-tight transition-colors drop-shadow-md">
                <AccentHeading text={content.heading} />
              </h1>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center lg:text-left"
            >
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-black/70 dark:text-white/70 leading-relaxed max-w-lg mx-auto lg:mx-0 transition-colors">
                {content.subheading}
              </p>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex justify-center lg:justify-start pt-1 sm:pt-2 md:pt-4"
            >
              <Button
                asChild
                size="lg"
                className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white font-semibold px-6 sm:px-8 md:px-10 py-2.5 sm:py-3 md:py-4 h-auto rounded-full transition-all duration-300 shadow-lg shadow-red-500/30 hover:shadow-red-500/50 group text-xs sm:text-sm md:text-base"
              >
                <Link href={safeHref(content.primaryButtonLink)} className="flex items-center gap-2">
                  {content.primaryButtonText}
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* RIGHT COLUMN - Dashboard Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            className="group relative order-1 lg:order-2"
          >
            {/* Animated glow background */}
            <motion.div 
              className="absolute -inset-3 bg-gradient-to-r from-red-400/50 via-red-300/40 to-red-400/50 dark:from-red-600/50 dark:via-red-500/40 dark:to-red-600/50 rounded-3xl blur-2xl opacity-40 dark:opacity-35 group-hover:opacity-60 transition-opacity duration-500"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            
            {/* Glass effect background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-red-50/40 dark:from-white/5 dark:via-white/5 to-white/30 dark:to-white/0 rounded-3xl blur-xl opacity-60 dark:opacity-50 group-hover:opacity-80 transition-opacity duration-300" />
            
            {/* Decorative corner elements */}
            <motion.div 
              className="absolute -top-2 -left-2 w-24 h-24 border border-red-400/40 dark:border-red-300/50 rounded-3xl opacity-40 group-hover:opacity-70 transition-opacity"
              animate={{ rotate: [0, 90, 180, 270, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div 
              className="absolute -bottom-2 -right-2 w-24 h-24 border border-red-400/40 dark:border-red-300/50 rounded-3xl opacity-40 group-hover:opacity-70 transition-opacity"
              animate={{ rotate: [360, 270, 180, 90, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />

            {/* Card */}
            <div className="relative rounded-3xl border border-red-200/80 dark:border-red-500/40 bg-gradient-to-br from-white to-red-50/50 dark:from-black dark:to-gray-950 dark:backdrop-blur-md p-4 sm:p-5 md:p-6 lg:p-8 shadow-2xl shadow-red-200/50 dark:shadow-red-600/30 transition-all duration-300 group-hover:shadow-3xl dark:group-hover:shadow-red-600/40">
              {/* Top accent line with gradient animation */}
              <motion.div 
                className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-red-500 to-transparent rounded-t-3xl"
                animate={{ 
                  backgroundPosition: ['0% 0%', '100% 0%', '0% 0%']
                }}
                transition={{ duration: 4, repeat: Infinity }}
              />

              {/* Content */}
              <div className="space-y-4 sm:space-y-5 md:space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div>
                      <p className="text-[10px] sm:text-xs md:text-sm font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 transition-colors">
                        Your Learning Dashboard
                      </p>
                      <h3 className="mt-1 sm:mt-2 text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-black dark:text-white transition-colors">
                        Start Your Journey
                      </h3>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                  {[
                    { value: '12k+', label: 'Active Learners' },
                    { value: '93%', label: 'Success Rate' },
                    { value: '4.9/5', label: 'Rating' },
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                      className="relative overflow-hidden rounded-2xl border border-red-300/60 dark:border-red-500/30 bg-gradient-to-br from-red-50/95 dark:from-red-950/40 to-red-50/50 dark:to-red-900/20 p-3 sm:p-4 transition-all duration-300 hover:shadow-lg hover:shadow-red-200/60 dark:hover:shadow-red-600/20 hover:border-red-400">
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-red-200/15 dark:from-red-500/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                      <p className="relative text-sm sm:text-base md:text-lg lg:text-2xl font-bold text-red-700 dark:text-red-300 transition-colors">
                        <AnimatedStatValue value={stat.value} />
                      </p>
                      <p className="relative text-[9px] sm:text-xs md:text-sm text-red-600/85 dark:text-red-400/80 mt-0.5 sm:mt-1 transition-colors font-medium">
                        {stat.label}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* Next Class Info */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.5 }}
                  className="relative flex items-center gap-2 sm:gap-3 p-3 rounded-2xl border border-red-300/70 dark:border-red-500/40 bg-gradient-to-r from-red-100/90 dark:from-red-950/60 via-red-50/70 dark:via-red-900/30 to-transparent dark:to-transparent hover:shadow-lg hover:shadow-red-200/60 dark:hover:shadow-red-600/20 transition-all duration-300 overflow-hidden group/class hover:border-red-400"
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(239,68,68,0.2),transparent_45%)] opacity-70" />
                  <Clock3 className="relative z-10 h-4 w-4 sm:h-5 sm:w-5 md:h-5 md:w-5 text-red-600 dark:text-red-300 flex-shrink-0 transition-colors" />
                  <div className="min-w-0 relative z-10">
                    <p className="text-[9px] sm:text-xs text-red-600/85 dark:text-red-400/80 transition-colors font-semibold">
                      Next Live Class
                    </p>
                    <p className="text-xs sm:text-sm md:text-base font-bold text-red-700 dark:text-red-300 truncate transition-colors">
                      Aptitude Sprint • Today 8:00 PM
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator - Centered on Screen */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 hidden sm:block"
      >
        <div className="flex flex-col items-center gap-1.5 sm:gap-2">
          <p className="text-[10px] sm:text-xs text-black/40 dark:text-white/40 uppercase tracking-wider transition-colors">Scroll to explore</p>
          <div className="w-4 sm:w-5 h-7 sm:h-8 border border-black/20 dark:border-white/20 rounded-full flex justify-center p-1 transition-colors">
            <div className="w-0.5 h-1 sm:h-1.5 bg-black/40 dark:bg-white/40 rounded-full transition-colors" />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
