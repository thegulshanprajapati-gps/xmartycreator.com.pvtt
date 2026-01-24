'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { SessionProvider } from '@/components/auth/session-provider';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/layout/header';
import { ContextMenu } from '@/components/context-menu';
import { HelpWidget } from '@/components/help-widget';
import { ThemePersistence } from '@/components/theme-persistence';

export default function RootLayoutClient({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <ThemePersistence />
      <SessionProvider isLoggedIn={false}>
        <ContextMenu />
        <Header />
        {children}
        <HelpWidget />
        <Toaster />
      </SessionProvider>
    </ThemeProvider>
  );
}
