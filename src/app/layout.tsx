import type { Metadata } from 'next';
import { PT_Sans, Noto_Sans } from 'next/font/google';
import './globals.css';
import { Suspense, ReactNode } from 'react';
import RootLayoutClient from './root-layout-client';
import { getSiteSettings } from '@/lib/site-settings';

const siteUrl = process.env.NEXT_PUBLIC_URL || 'https://xmartycreator.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Xmarty Creator',
    template: '%s | Xmarty Creator',
  },
  description: 'Create and learn with Xmarty',
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  openGraph: {
    title: 'Xmarty Creator',
    description: 'Create and learn with Xmarty',
    type: 'website',
  },
};

const ptSans = PT_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
  display: 'swap',
});

const notoSans = Noto_Sans({
  subsets: ['latin', 'latin-ext', 'devanagari'],
  weight: ['400', '700'],
  variable: '--font-noto-sans',
  display: 'swap',
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteSettings = await getSiteSettings();
  const cursorStyle = siteSettings?.cursorStyle || 'sparkle';
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Xmarty Creator',
      url: siteUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Xmarty Creator',
      url: siteUrl,
      logo: `${siteUrl}/favicon.ico`,
      sameAs: [
        `${siteUrl}`,
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: [
        { '@type': 'SiteNavigationElement', position: 1, name: 'Home', url: `${siteUrl}/` },
        { '@type': 'SiteNavigationElement', position: 2, name: 'Courses', url: `${siteUrl}/courses` },
        { '@type': 'SiteNavigationElement', position: 3, name: 'About', url: `${siteUrl}/about` },
        { '@type': 'SiteNavigationElement', position: 4, name: 'Community', url: `${siteUrl}/community` },
        { '@type': 'SiteNavigationElement', position: 5, name: 'Blog', url: `${siteUrl}/blog` },
        { '@type': 'SiteNavigationElement', position: 6, name: 'Updates', url: `${siteUrl}/updates` },
        { '@type': 'SiteNavigationElement', position: 7, name: 'Contact', url: `${siteUrl}/contact` },
      ],
    },
  ];

  return (
    <html lang="en" data-cursor={cursorStyle} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
        />
        {cursorStyle === 'magic' && (
          <link
            rel="stylesheet"
            href="https://res.cloudinary.com/veseylab/raw/upload/v1684982764/magicmouse-2.0.0.cdn.min.css"
          />
        )}
        <meta name="google-site-verification" content="JqwCaYH46klXdkyF0gx4xDnSfgdoFsYfK-UiqxPWsiM" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`font-body antialiased ${ptSans.variable} ${notoSans.variable}`}>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
