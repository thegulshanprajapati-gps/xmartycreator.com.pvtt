'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { SessionProvider } from '@/components/auth/session-provider';
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
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <ThemePersistence />
      <SiteSettingsClient />
      <MagicMouseProvider />
      <CustomCursorProvider />
      <UpdateNotifier />
      <AnalyticsTracker />
      <SessionProvider isLoggedIn={false}>
        <ContextMenu />
        <Header />
        <div className="h-16 w-full shrink-0" aria-hidden="true" />
        {children}
        <HelpWidget />
        <Toaster />
      </SessionProvider>
    </ThemeProvider>
  );
}
