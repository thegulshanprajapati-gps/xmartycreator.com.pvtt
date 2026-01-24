import type { Metadata } from 'next';
import { PT_Sans } from 'next/font/google';
import './globals.css';
import { Suspense, ReactNode } from 'react';
import RootLayoutClient from './root-layout-client';

export const metadata: Metadata = {
  title: {
    default: 'Xmarty Creator',
    template: '%s | Xmarty Creator',
  },
  description: 'Create and learn with Xmarty',
  openGraph: {
    title: 'Xmarty Creator',
    description: 'Create and learn with Xmarty',
    type: 'website',
  },
};

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="JqwCaYH46klXdkyF0gx4xDnSfgdoFsYfK-UiqxPWsiM" />
      </head>
      <body className={`font-body antialiased ${ptSans.variable}`}>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
