import type { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_URL || 'https://xmartycreator.com';

export const metadata: Metadata = {
  title: 'Blog - Xmarty Creator',
  description: 'Latest articles and insights from Xmarty Creator. Learn about content creation, digital marketing, and creative strategies.',
  keywords: ['blog', 'articles', 'content creation', 'digital marketing', 'tutorials'],
  openGraph: {
    title: 'Blog - Xmarty Creator',
    description: 'Latest articles and insights from Xmarty Creator.',
    type: 'website',
    url: `${BASE_URL}/blog`,
    images: [
      {
        url: `${BASE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Blog - Xmarty Creator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog - Xmarty Creator',
    description: 'Latest articles and insights from Xmarty Creator.',
    images: [`${BASE_URL}/og-image.jpg`],
  },
  canonical: `${BASE_URL}/blog`,
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="blog-no-select select-none [&_input]:select-text [&_textarea]:select-text [&_[contenteditable='true']]:select-text">
        {children}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Blog',
            url: `${BASE_URL}/blog`,
            description: 'Latest articles and insights from Xmarty Creator',
          }),
        }}
      />
    </>
  );
}
