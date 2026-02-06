'use client';

import { useEffect, useState } from 'react';

interface BlogViewsProps {
  slug: string;
  initialViews?: number;
}

export function BlogViews({ slug, initialViews = 0 }: BlogViewsProps) {
  const [views, setViews] = useState<number>(initialViews);

  useEffect(() => {
    if (!slug) return;

    let isActive = true;

    const trackView = async () => {
      try {
        const res = await fetch(`/api/blog/${slug}/view`, { method: 'POST' });
        if (!res.ok) return;
        const data = await res.json();
        if (isActive && typeof data?.views === 'number') {
          setViews(data.views);
        }
      } catch (error) {
        console.error('View tracking failed:', error);
      }
    };

    trackView();

    return () => {
      isActive = false;
    };
  }, [slug]);

  const display = Number.isFinite(views) ? views : 0;

  return <span>{display.toLocaleString()} views</span>;
}
