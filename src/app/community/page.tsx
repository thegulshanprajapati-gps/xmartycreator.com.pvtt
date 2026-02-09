
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Download, Users, Sparkles, MessageCircle, ArrowRight, Play, ShieldCheck, Video, Send } from "lucide-react";
import { trackLinkClick } from "@/app/analytics/actions";
import { Footer } from "@/components/layout/footer";
import { motion } from "framer-motion";
import type { SVGProps } from "react";
import { useState, useEffect } from "react";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeInOut' } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

type CommunityContent = {
  hero: {
    title: string;
    description: string;
  };
  youtube: {
    channelId?: string;
    videoId: string;
    latestVideoId?: string;
  };
  whatsapp: {
    title: string;
    description: string;
    link: string;
    buttonText: string;
  };
  app: {
    title: string;
    description: string;
    link: string;
    buttonText: string;
  };
  telegram: {
    title: string;
    description: string;
    link: string;
    buttonText: string;
  };
};

const VIDEO_ID_PATTERN = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)?([A-Za-z0-9_-]{11})/;

function normalizeVideoId(value?: string): string {
  const raw = (value || '').trim();
  if (!raw) return '';
  if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw;
  const match = raw.match(VIDEO_ID_PATTERN);
  return match?.[1] || '';
}

function CommunityIllustration(props: SVGProps<SVGSVGElement>) {
    return (
      <svg
        viewBox="0 0 500 350"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <g fill="none" fillRule="evenodd">
          <motion.path
            initial={{ pathLength: 0.25, opacity: 0.35, strokeDashoffset: 0 }}
            animate={{
              pathLength: [0.25, 1, 0.25],
              opacity: [0.35, 0.95, 0.35],
              strokeDashoffset: [0, -18, -36],
            }}
            transition={{ duration: 4.2, ease: "linear", repeat: Infinity }}
            d="M175 250l75-150"
            className="stroke-rose-500/60 dark:stroke-rose-300/35"
            strokeWidth="3"
            strokeDasharray="8, 8"
          />
           <motion.path
            initial={{ pathLength: 0.25, opacity: 0.35, strokeDashoffset: 0 }}
            animate={{
              pathLength: [0.25, 1, 0.25],
              opacity: [0.35, 0.95, 0.35],
              strokeDashoffset: [0, -18, -36],
            }}
            transition={{ duration: 4.2, ease: "linear", repeat: Infinity, delay: 0.35 }}
            d="M325 250l-75-150"
            className="stroke-rose-500/60 dark:stroke-rose-300/35"
            strokeWidth="3"
            strokeDasharray="8, 8"
          />
           <motion.path
            initial={{ pathLength: 0.25, opacity: 0.35, strokeDashoffset: 0 }}
            animate={{
              pathLength: [0.25, 1, 0.25],
              opacity: [0.35, 0.95, 0.35],
              strokeDashoffset: [0, -18, -36],
            }}
            transition={{ duration: 4.2, ease: "linear", repeat: Infinity, delay: 0.7 }}
            d="M190 250h120"
            className="stroke-rose-500/60 dark:stroke-rose-300/35"
            strokeWidth="3"
            strokeDasharray="8, 8"
          />
          <motion.g
            initial={{ opacity: 0.85 }}
            animate={{ opacity: [0.8, 1, 0.8], y: [0, -6, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "250px 100px" }}
          >
            <circle className="stroke-rose-500 dark:stroke-rose-200/70" strokeWidth="3" cx="250" cy="100" r="40" />
            <circle className="fill-rose-500 dark:fill-rose-200/70" cx="250" cy="100" r="15" />
          </motion.g>
          <motion.g
             initial={{ opacity: 0.85 }}
             animate={{ opacity: [0.8, 1, 0.8], x: [0, -5, 0], y: [0, 4, 0], scale: [1, 1.04, 1] }}
             transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
             style={{ transformOrigin: "150px 250px" }}
          >
            <circle className="stroke-rose-500 dark:stroke-rose-200/70" strokeWidth="3" cx="150" cy="250" r="40" />
            <circle className="fill-rose-500 dark:fill-rose-200/70" cx="150" cy="250" r="15" />
          </motion.g>
          <motion.g
            initial={{ opacity: 0.85 }}
            animate={{ opacity: [0.8, 1, 0.8], x: [0, 5, 0], y: [0, 4, 0], scale: [1, 1.04, 1] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            style={{ transformOrigin: "350px 250px" }}
          >
            <circle className="stroke-rose-500 dark:stroke-rose-200/70" strokeWidth="3" cx="350" cy="250" r="40" />
            <circle className="fill-rose-500 dark:fill-rose-200/70" cx="350" cy="250" r="15" />
          </motion.g>
        </g>
      </svg>
    )
}

export default function CommunityPage() {
  const [communityContent, setCommunityContent] = useState<CommunityContent>({
    hero: { title: 'Community', description: 'Join our community' },
    youtube: { channelId: '', videoId: '' },
    whatsapp: { title: 'WhatsApp', description: '', link: '#', buttonText: 'Join' },
    app: { title: 'App', description: '', link: '#', buttonText: 'Download' },
    telegram: { title: 'Telegram', description: '', link: '#', buttonText: 'Join' }
  });
  const [resolvedVideoId, setResolvedVideoId] = useState('');

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch('/api/pages/community', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          // Merge with defaults to avoid undefined nested props
          setCommunityContent((prev) => ({
            ...prev,
            ...data,
            hero: { ...prev.hero, ...(data?.hero || {}) },
            youtube: { ...prev.youtube, ...(data?.youtube || {}) },
            whatsapp: { ...prev.whatsapp, ...(data?.whatsapp || {}) },
            app: { ...prev.app, ...(data?.app || {}) },
            telegram: { ...prev.telegram, ...(data?.telegram || {}) },
          }));
        }
      } catch (error) {
        console.error('Error fetching community content:', error);
      }
    };

    fetchContent();
  }, []);

  useEffect(() => {
    const fallback = normalizeVideoId(
      communityContent?.youtube?.latestVideoId || communityContent?.youtube?.videoId || ''
    );
    setResolvedVideoId(fallback);

    const channelId = (communityContent?.youtube?.channelId || '').trim();
    if (!channelId) return;

    let cancelled = false;

    const fetchLatestFromChannel = async () => {
      try {
        const res = await fetch(`/api/youtube/latest?channelId=${encodeURIComponent(channelId)}`);
        if (!res.ok) return;
        const data = await res.json();
        const latest = normalizeVideoId(data?.videoId);
        if (!cancelled && latest) {
          setResolvedVideoId(latest);
        }
      } catch (error) {
        console.error('Error resolving latest YouTube video:', error);
      }
    };

    fetchLatestFromChannel();

    return () => {
      cancelled = true;
    };
  }, [communityContent?.youtube?.channelId, communityContent?.youtube?.latestVideoId, communityContent?.youtube?.videoId]);

  const videoId = resolvedVideoId;
  const youtubeChannelId = (communityContent?.youtube?.channelId || "").trim();
  const youtubeLink = youtubeChannelId
    ? `https://www.youtube.com/channel/${youtubeChannelId}`
    : videoId
      ? `https://www.youtube.com/watch?v=${videoId}`
      : "https://www.youtube.com";

  const communityPlatforms = [
    {
      title: communityContent.whatsapp.title || "WhatsApp",
      description:
        communityContent.whatsapp.description || "Get instant updates, notes, and quick support from the main group.",
      link: communityContent.whatsapp.link || "#",
      ctaText: communityContent.whatsapp.buttonText || "Join",
      icon: <i className="fa-brands fa-whatsapp" aria-hidden="true" />,
      trackId: "WhatsApp",
      platformClass: "whatsapp",
    },
    {
      title: communityContent.app.title || "App",
      description:
        communityContent.app.description || "Access classes, announcements, and community resources in one place.",
      link: communityContent.app.link || "#",
      ctaText: communityContent.app.buttonText || "Download",
      icon: <Download className="h-8 w-8 text-white" />,
      trackId: "App-Download",
      platformClass: "app",
    },
    {
      title: communityContent.telegram.title || "Telegram",
      description:
        communityContent.telegram.description || "Join focused discussion channels and fast-moving updates.",
      link: communityContent.telegram.link || "#",
      ctaText: communityContent.telegram.buttonText || "Join",
      icon: <i className="fa-brands fa-telegram" aria-hidden="true" />,
      trackId: "Telegram",
      platformClass: "telegram",
    },
    {
      title: "YouTube",
      description: "Watch latest videos, tutorials, and live sessions from XMarty Creator.",
      link: youtubeLink,
      ctaText: "Subscribe",
      icon: <i className="fa-brands fa-youtube" aria-hidden="true" />,
      trackId: "YouTube",
      platformClass: "youtube",
    },
  ];

  return (
    <>
      <div className="relative flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute -left-32 top-12 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-1/3 h-80 w-80 rounded-full bg-purple-300/30 blur-3xl" />
        <div className="pointer-events-none absolute left-1/4 bottom-0 h-72 w-72 rounded-full bg-cyan-300/25 blur-3xl" />

        {/* Hero */}
        <section className="w-full py-14 md:py-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.5 }}
                variants={fadeIn}
              >
                <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-slate-900/60 border border-blue-100 dark:border-slate-800 text-blue-700 dark:text-blue-200 px-4 py-2 rounded-full w-fit mb-4 shadow-sm">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-semibold">Community HQ</span>
                </div>
                <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-slate-900 dark:text-white leading-tight">
                  {communityContent.hero.title}
                </h1>
                <p className="max-w-2xl mt-4 text-lg text-slate-600 dark:text-slate-300">
                  {communityContent.hero.description}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild size="lg" className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                    <Link href={communityContent.whatsapp.link || '#'} onClick={() => trackLinkClick('Hero-WhatsApp')}>
                      <MessageCircle className="h-4 w-4" />
                      Join WhatsApp
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="gap-2 border-2 bg-white/80 dark:bg-slate-900/60" >
                    <Link href="#community-video">
                      <Play className="h-4 w-4" />
                      Watch intro
                    </Link>
                  </Button>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-3 max-w-lg">
                  <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-4 shadow-sm backdrop-blur">
                    <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Channels</div>
                    <div className="text-lg font-semibold mt-1 text-slate-900 dark:text-white">WhatsApp, Telegram, App</div>
                  </div>
                  <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-4 shadow-sm backdrop-blur">
                    <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Live events</div>
                    <div className="text-lg font-semibold mt-1 text-slate-900 dark:text-white">Weekly sessions</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="relative hidden md:flex justify-center"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.5 }}
                variants={fadeIn}
              >
                <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-[0_25px_80px_-60px_rgba(59,130,246,0.8)]">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-cyan-400/10" />
                  <CommunityIllustration className="relative w-full h-auto p-6" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Video / Livestream */}
        <section id="community-video" className="w-full py-10 md:py-14">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              variants={fadeIn}
              className="relative aspect-video w-full max-w-5xl mx-auto rounded-3xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 shadow-[0_30px_90px_-70px_rgba(59,130,246,0.9)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-purple-500/10 to-transparent" />
              {videoId ? (
                <iframe
                  className="absolute inset-0 w-full h-full border-0 rounded-3xl"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="Community intro video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
                  <Video className="h-10 w-10" />
                  <p>Intro video coming soon</p>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Coming soon hub CTA */}
        <section className="w-full pb-6 md:pb-10 -mt-2">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              variants={fadeIn}
              className="relative overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-600/15 via-purple-600/15 to-cyan-500/15 p-6 md:p-8 shadow-[0_25px_80px_-60px_rgba(59,130,246,0.8)]"
            >
              <div className="absolute -left-16 top-0 h-40 w-40 rounded-full bg-blue-400/20 blur-3xl" />
              <div className="absolute right-0 -bottom-10 h-48 w-48 rounded-full bg-purple-400/20 blur-3xl" />
              <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/80 dark:bg-slate-900/60 px-3 py-1 text-sm font-semibold text-blue-700 dark:text-blue-100 border border-white/60 dark:border-slate-700">
                    Coming soon
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Join our Community Hub</h3>
                  <p className="text-slate-600 dark:text-slate-300 max-w-2xl">
                    A dedicated space for events, resources, and member shout-outs. Launching shortly!
                  </p>
                </div>
                <Button asChild size="lg" className="gap-2 bg-white text-blue-700 hover:bg-slate-50 dark:bg-slate-800 dark:text-white border-2 border-blue-100 dark:border-slate-700">
                  <Link href="/community/hub" target="_blank">
                    Open hub
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Why join */}
        <section className="w-full py-12 md:py-18">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              className="text-center max-w-3xl mx-auto mb-12 space-y-3"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={fadeIn}
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-100 px-4 py-2 border border-blue-100 dark:border-blue-800">
                <ShieldCheck className="h-4 w-4" />
                Why join our community
              </div>
              <h2 className="font-headline text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Learn, build, and grow together</h2>
              <p className="text-slate-600 dark:text-slate-300">Get instant updates, live doubt-solving, weekly challenges, and exclusive resources curated for you.</p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                { icon: <Send className="h-5 w-5" />, title: "Instant updates", desc: "Never miss drops, deadlines, or release notes." },
                { icon: <Users className="h-5 w-5" />, title: "Peer power", desc: "Team up for projects, mock interviews, and accountability." },
                { icon: <Sparkles className="h-5 w-5" />, title: "Exclusive goodies", desc: "Early access templates, notes, and surprise bonuses." },
              ].map((item, idx) => (
                <motion.div
                  key={item.title}
                  variants={fadeIn}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ delay: idx * 0.05 }}
                  className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-6 shadow-[0_20px_60px_-50px_rgba(59,130,246,0.8)]"
                >
                  <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-200 flex items-center justify-center mb-4">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Platforms */}
        <section className="w-full py-14 md:py-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="community-premium-section relative overflow-hidden rounded-[30px] border border-slate-200/70 dark:border-white/10 px-5 py-10 sm:px-8 md:px-10 md:py-12">
              <div className="pointer-events-none absolute -left-24 top-4 h-48 w-48 rounded-full bg-cyan-300/20 dark:bg-cyan-300/12 blur-3xl" />
              <div className="pointer-events-none absolute -right-20 bottom-2 h-52 w-52 rounded-full bg-indigo-300/18 dark:bg-indigo-300/14 blur-3xl" />

              <motion.div
                className="mb-10 space-y-3 text-center md:mb-12"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.5 }}
                variants={fadeIn}
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/65 px-4 py-2 text-slate-700 dark:border-white/20 dark:bg-white/10 dark:text-cyan-100 backdrop-blur">
                  <Users className="h-4 w-4" />
                  Join our communities
                </div>
                <h2 className="font-headline text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                  Pick your favorite channel
                </h2>
                <p className="mx-auto max-w-2xl text-sm text-slate-600 dark:text-slate-200/80 sm:text-base">
                  Choose where you want to stay connected with XMarty Creator
                </p>
              </motion.div>

              <motion.div
                className="channel-grid grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.35 }}
              >
                {communityPlatforms.map((platform) => {
                  const href = platform.link || "#";
                  const openInNewTab = /^https?:\/\//i.test(href);
                  return (
                    <motion.article key={platform.trackId} variants={fadeIn} className="h-full">
                      <div className={`card channel-card ${platform.platformClass} flex h-full flex-col`}>
                        <div className="channel-card__content flex flex-1 flex-col items-center px-6 pt-8 pb-8 text-center">
                          <div className="channel-card__icon mb-5">{platform.icon}</div>
                          <h3 className="text-2xl font-semibold text-white">{platform.title}</h3>
                          <p className="mt-3 text-sm leading-relaxed text-white/90">
                            {platform.description}
                          </p>
                          <Link
                            href={href}
                            target={openInNewTab ? "_blank" : undefined}
                            rel={openInNewTab ? "noopener noreferrer" : undefined}
                            onClick={() => trackLinkClick(platform.trackId)}
                            className="channel-card__cta mt-7"
                          >
                            <span>{platform.ctaText} &rarr;</span>
                          </Link>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </motion.div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}

