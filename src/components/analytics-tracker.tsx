
'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export function AnalyticsTracker() {
  const pathname = usePathname();
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!pathname) return;
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    if (pathname.startsWith('/admin') || pathname.startsWith('/api')) return;

    // We use a timeout to avoid tracking during fast tab-switching or brief navigations.
    const timer = setTimeout(() => {
      void fetch('/api/pages/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'pageview', pathname }),
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    const getLinkName = (el: HTMLElement) => {
      const explicit = el.getAttribute('data-analytics-link');
      if (explicit) return explicit.trim();

      if (el instanceof HTMLAnchorElement) {
        const href = el.getAttribute('href') || '';
        if (!href || href === '#') return '';
        if (href.startsWith('http')) {
          try {
            const url = new URL(href);
            return url.pathname + (url.search || '');
          } catch {
            return href;
          }
        }
        return href;
      }

      const text = (el.textContent || '').trim();
      return text;
    };

    const clickHandler = (event: MouseEvent) => {
      if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/api')) return;

      const target = event.target as HTMLElement | null;
      if (!target) return;

      const el = target.closest('a, button, [data-analytics-link]') as HTMLElement | null;
      if (!el) return;
      if (el.closest('[data-analytics-ignore]')) return;

      const linkName = getLinkName(el);
      if (!linkName) return;

      const normalized = linkName.length > 140 ? `${linkName.slice(0, 140)}…` : linkName;
      void fetch('/api/pages/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'link', linkName: normalized }),
      });
    };

    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  }, [pathname]);

  return null; // This component does not render anything
}
