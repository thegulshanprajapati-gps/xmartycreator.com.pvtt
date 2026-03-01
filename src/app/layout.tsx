import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, DM_Sans, Noto_Sans_Devanagari } from 'next/font/google';
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
    icon: [
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    title: 'XmartyCreator',
  },
  openGraph: {
    title: 'Xmarty Creator',
    description: 'Create and learn with Xmarty',
    type: 'website',
  },
};

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-devanagari',
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
        { '@type': 'SiteNavigationElement', position: 3, name: 'BCECE LE', url: `${siteUrl}/bcece-le` },
        { '@type': 'SiteNavigationElement', position: 4, name: 'About', url: `${siteUrl}/about` },
        { '@type': 'SiteNavigationElement', position: 5, name: 'Community', url: `${siteUrl}/community` },
        { '@type': 'SiteNavigationElement', position: 6, name: 'Blog', url: `${siteUrl}/blog` },
        { '@type': 'SiteNavigationElement', position: 7, name: 'Topics', url: `${siteUrl}/topic` },
        { '@type': 'SiteNavigationElement', position: 8, name: 'Updates', url: `${siteUrl}/updates` },
        { '@type': 'SiteNavigationElement', position: 9, name: 'Contact', url: `${siteUrl}/contact` },
        { '@type': 'SiteNavigationElement', position: 10, name: 'FAQ', url: `${siteUrl}/faq` },
        { '@type': 'SiteNavigationElement', position: 11, name: 'Privacy Policy', url: `${siteUrl}/privacy-policy` },
        { '@type': 'SiteNavigationElement', position: 12, name: 'Terms of Service', url: `${siteUrl}/terms-of-service` },
        { '@type': 'SiteNavigationElement', position: 13, name: 'Login', url: `${siteUrl}/login` },
      ],
    },
  ];

  return (
    <html lang="en" data-cursor={cursorStyle} suppressHydrationWarning>
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-VEZS5RTT7G"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-VEZS5RTT7G');
            `,
          }}
        />
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
      <body className={`font-body antialiased ${plusJakartaSans.variable} ${dmSans.variable} ${notoSansDevanagari.variable}`}>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
