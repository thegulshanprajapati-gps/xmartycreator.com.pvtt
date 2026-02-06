'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ReadingProgressBarProps {
  className?: string;
}

export default function ReadingProgressBar({
  className = '',
}: ReadingProgressBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const totalScroll = documentHeight - windowHeight;
      const scrolled = (scrollTop / totalScroll) * 100;
      setProgress(Math.min(scrolled, 100));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.div
      className={`h-1 bg-gradient-to-r from-primary to-accent fixed top-0 left-0 right-0 z-50 origin-left ${className}`}
      style={{ scaleX: progress / 100 }}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: progress / 100 }}
      transition={{ duration: 0.1 }}
    />
  );
}
