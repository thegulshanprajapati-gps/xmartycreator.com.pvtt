'use client';

import { ReactNode, useEffect } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { SessionProvider } from '@/components/auth/session-provider';
import { StudentSessionProvider } from '@/components/auth/student-session-provider';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/layout/header';
import { ContextMenu } from '@/components/context-menu';
import { HelpWidget } from '@/components/help-widget';
import { ThemePersistence } from '@/components/theme-persistence';
import MagicMouseProvider from '@/components/magic-mouse';
import SiteSettingsClient from '@/components/site-settings-client';
import UpdateNotifier from '@/components/update-notifier';
import { AnalyticsTracker } from '@/components/analytics-tracker';
import CustomCursorProvider from '@/components/custom-cursor';

export default function RootLayoutClient({ children }: { children: ReactNode }) {
  useEffect(() => {
    const reloadKey = '__xmarty_chunk_reload_once__';

    const reloadOnChunkFailure = (message: string) => {
      const normalized = String(message || '');
      if (!/ChunkLoadError|Loading chunk \d+ failed|CSS_CHUNK_LOAD_FAILED/i.test(normalized)) {
        return;
      }

      try {
        if (sessionStorage.getItem(reloadKey)) {
          sessionStorage.removeItem(reloadKey);
          return;
        }
        sessionStorage.setItem(reloadKey, '1');
      } catch {
        // ignore storage issues
      }
      window.location.reload();
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason as { message?: string } | string | undefined;
      const message =
        typeof reason === 'string'
          ? reason
          : typeof reason?.message === 'string'
            ? reason.message
            : '';
      reloadOnChunkFailure(message);
    };

    const onWindowError = (event: ErrorEvent) => {
      reloadOnChunkFailure(event.message || '');
    };

    window.addEventListener('unhandledrejection', onUnhandledRejection);
    window.addEventListener('error', onWindowError);

    return () => {
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
      window.removeEventListener('error', onWindowError);
    };
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <ThemePersistence />
      <SiteSettingsClient />
      <MagicMouseProvider />
      <CustomCursorProvider />
      <UpdateNotifier />
      <AnalyticsTracker />
      <StudentSessionProvider>
        <SessionProvider isLoggedIn={false}>
          <ContextMenu />
          <Header />
          <div className="h-16 w-full shrink-0" aria-hidden="true" />
          {children}
          <HelpWidget />
          <Toaster />
        </SessionProvider>
      </StudentSessionProvider>
    </ThemeProvider>
  );
}
