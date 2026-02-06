'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function HeroVisual() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const floatingAnimation = {
    y: [0, -20, 0],
    transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' }
  };

  const glowAnimation = {
    opacity: [0.5, 1, 0.5],
    transition: { duration: 3, repeat: Infinity }
  };

  const rotateAnimation = {
    rotate: [0, 360],
    transition: { duration: 20, repeat: Infinity, ease: 'linear' }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 blur-3xl" />

      {/* Main Container with perspective */}
      <motion.div
        className="relative w-full max-w-md h-96 md:max-w-2xl md:h-full"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Central AI/Brain Core - Glowing */}
        <motion.div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-32 h-32 md:w-48 md:h-48"
          animate={floatingAnimation}
        >
          {/* Outer glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-blue-400/50 blur-sm"
            animate={rotateAnimation}
          />

          {/* Middle ring */}
          <motion.div
            className="absolute inset-4 rounded-full border border-purple-400/40 blur-xs"
            animate={{ rotate: [360, 0], transition: { duration: 25, repeat: Infinity, ease: 'linear' } }}
          />

          {/* Inner glowing core */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/40 via-purple-500/30 to-pink-500/20 blur-xl"
            animate={glowAnimation}
          />

          {/* Center bright dot */}
          <motion.div
            className="absolute inset-1/3 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 shadow-2xl shadow-blue-500/50"
            animate={{ scale: [0.8, 1.2, 0.8], transition: { duration: 3, repeat: Infinity } }}
          />
        </motion.div>

        {/* Floating UI Cards - Left */}
        <motion.div
          className="absolute top-12 left-0 md:left-8"
          animate={{ y: [0, -15, 0], x: [-10, 0, -10] }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg p-3 md:p-4 shadow-lg hover:shadow-blue-500/20 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-xs md:text-sm text-white/80 font-semibold">Learning</span>
            </div>
            <div className="space-y-1">
              <div className="h-2 w-12 md:w-16 bg-gradient-to-r from-blue-400 to-transparent rounded" />
              <div className="h-1.5 w-10 md:w-14 bg-gradient-to-r from-blue-300 to-transparent rounded opacity-60" />
            </div>
          </div>
        </motion.div>

        {/* Floating UI Cards - Right */}
        <motion.div
          className="absolute top-24 right-0 md:right-8"
          animate={{ y: [0, 20, 0], x: [10, 0, 10] }}
          transition={{ duration: 6, repeat: Infinity, delay: 1 }}
        >
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg p-3 md:p-4 shadow-lg hover:shadow-purple-500/20 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-purple-400" />
              <span className="text-xs md:text-sm text-white/80 font-semibold">Technology</span>
            </div>
            <div className="space-y-1">
              <div className="h-2 w-12 md:w-16 bg-gradient-to-r from-purple-400 to-transparent rounded" />
              <div className="h-1.5 w-10 md:w-14 bg-gradient-to-r from-purple-300 to-transparent rounded opacity-60" />
            </div>
          </div>
        </motion.div>

        {/* Floating UI Cards - Bottom Left */}
        <motion.div
          className="absolute bottom-16 left-4 md:left-12"
          animate={{ y: [0, 15, 0], x: [-15, 5, -15] }}
          transition={{ duration: 7, repeat: Infinity, delay: 0.5 }}
        >
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg p-3 md:p-4 shadow-lg hover:shadow-pink-500/20 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-pink-400" />
              <span className="text-xs md:text-sm text-white/80 font-semibold">Growth</span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-6 md:h-8 w-1 md:w-1.5 bg-gradient-to-t from-pink-400 to-pink-200 rounded-full opacity-60"
                  style={{ height: `${i * 6}px` }}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Floating UI Cards - Bottom Right */}
        <motion.div
          className="absolute bottom-12 right-4 md:right-12"
          animate={{ y: [0, -12, 0], x: [12, 0, 12] }}
          transition={{ duration: 5.5, repeat: Infinity, delay: 1.5 }}
        >
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg p-3 md:p-4 shadow-lg hover:shadow-blue-500/20 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-blue-300" />
              <span className="text-xs md:text-sm text-white/80 font-semibold">Future</span>
            </div>
            <div className="space-y-1">
              <div className="h-2 w-12 md:w-16 bg-gradient-to-r from-blue-300 to-transparent rounded" />
              <div className="h-1.5 w-10 md:w-14 bg-gradient-to-r from-blue-200 to-transparent rounded opacity-60" />
            </div>
          </div>
        </motion.div>

        {/* Network nodes - floating points */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`node-${i}`}
            className="absolute w-1 h-1 md:w-2 md:h-2 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"
            style={{
              left: `${20 + (i % 3) * 30}%`,
              top: `${15 + (i % 2) * 60}%`,
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}

        {/* Connecting lines between nodes */}
        <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#A78BFA" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#F472B6" stopOpacity="0.1" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Network lines */}
          <line x1="20%" y1="15%" x2="50%" y2="50%" stroke="url(#lineGradient)" strokeWidth="1" filter="url(#glow)" />
          <line x1="50%" y1="50%" x2="80%" y2="20%" stroke="url(#lineGradient)" strokeWidth="1" filter="url(#glow)" />
          <line x1="50%" y1="50%" x2="20%" y2="75%" stroke="url(#lineGradient)" strokeWidth="1" filter="url(#glow)" />
          <line x1="50%" y1="50%" x2="80%" y2="75%" stroke="url(#lineGradient)" strokeWidth="1" filter="url(#glow)" />
        </svg>

        {/* Top accent line */}
        <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50" />

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-30" />
      </motion.div>

      {/* Gradient overlay at bottom */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-background via-background/50 to-transparent pointer-events-none" />

      {/* Light blur particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-24 h-24 md:w-40 md:h-40 rounded-full blur-3xl opacity-20"
            style={{
              background: `radial-gradient(circle, ${['#3B82F6', '#A855F7', '#EC4899'][i]} 0%, transparent 70%)`,
              left: `${30 + i * 30}%`,
              top: `${20 + i * 20}%`,
            }}
            animate={{
              x: [0, 30, 0],
              y: [0, -40, 0],
            }}
            transition={{
              duration: 8 + i,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  );
}
