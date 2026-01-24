
'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { trackPageView } from '@/app/analytics/actions';

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // We use a timeout to avoid tracking during fast tab-switching or brief navigations.
    const timer = setTimeout(() => {
        trackPageView(pathname);
    }, 500);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null; // This component does not render anything
}
