'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface TableOfContentsItem {
  id: string;
  level: number;
  text: string;
}

interface TableOfContentsProps {
  items: TableOfContentsItem[];
  className?: string;
}

export default function TableOfContents({
  items,
  className = '',
}: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -66%' }
    );

    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav className={`space-y-3 ${className}`}>
      <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
        Table of Contents
      </h4>
      <ul className="space-y-2">
        {items.map((item) => (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            style={{ paddingLeft: `${(item.level - 2) * 1}rem` }}
          >
            <Link
              href={`#${item.id}`}
              className={`text-sm transition-colors line-clamp-2 ${
                activeId === item.id
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.text}
            </Link>
          </motion.li>
        ))}
      </ul>
    </nav>
  );
}
