/**
 * SEO & Metadata Utilities for Blog System
 * Generates SEO-optimized metadata for blog posts
 */

import { BlogPost, BlogMetadata } from '@/types/blog';
import { formatDateForSEO } from './blog-utils';

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Xmarty Creator';
const BASE_URL = process.env.NEXT_PUBLIC_URL || 'https://xmartycreator.com';

/**
 * Generate Next.js Metadata for blog posts
 */
export function generateBlogMetadata(blog: BlogPost) {
  const url = `${BASE_URL}/blog/${blog.slug}`;
  const title = blog.metaTitle || blog.title;
  const description = blog.metaDescription || blog.excerpt;

  return {
    title,
    description,
    keywords: blog.metaKeywords || blog.tags,
    robots: {
      index: true,
      follow: true,
    },
    authors: [{ name: blog.author }],
    openGraph: {
      title,
      description,
      type: 'article' as const,
      url,
      authors: [blog.author],
      publishedTime: blog.publishedAt ? new Date(blog.publishedAt).toISOString() : undefined,
      modifiedTime: blog.updatedAt ? new Date(blog.updatedAt).toISOString() : undefined,
      images: blog.coverImage?.url
        ? [
            {
              url: blog.coverImage.url,
              alt: blog.coverImage.alt || blog.title,
              width: 1200,
              height: 630,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: blog.coverImage?.url ? [blog.coverImage.url] : undefined,
      creator: '@xmartycreator',
    },
    alternates: {
      canonical: blog.canonicalUrl || url,
    },
  };
}

/**
 * Generate JSON-LD structured data for BlogPosting
 * Critical for Google rich snippets and featured snippets
 */
export function generateBlogPostingSchema(blog: BlogPost, authorImage?: string) {
  const url = `${BASE_URL}/blog/${blog.slug}`;
  
  // Safe extraction of plain text from HTML content
  const plainText = blog.htmlContent ? blog.htmlContent.replace(/<[^>]*>/g, '') : '';
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    alternativeHeadline: blog.metaTitle || undefined,
    image: blog.coverImage?.url
      ? {
          '@type': 'ImageObject',
          url: blog.coverImage.url,
          width: 1200,
          height: 630,
        }
      : undefined,
    description: blog.excerpt || '',
    author: {
      '@type': 'Person',
      name: blog.author || 'Unknown',
      image: authorImage || blog.authorImage || undefined,
    },
    datePublished: blog.publishedAt ? new Date(blog.publishedAt).toISOString() : undefined,
    dateModified: blog.updatedAt ? new Date(blog.updatedAt).toISOString() : undefined,
    inLanguage: 'en-US',
    url,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    keywords: (blog.metaKeywords && blog.metaKeywords.length > 0) ? blog.metaKeywords : blog.tags || [],
    articleBody: plainText,
    wordCount: wordCount,
    timeToRead: blog.readTime || undefined,
  };
}

/**
 * Generate Organization schema for blog
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    sameAs: [
      'https://twitter.com/xmartycreator',
      'https://www.linkedin.com/company/xmarty-creator',
      'https://www.instagram.com/xmartycreator/',
    ],
  };
}

/**
 * Generate Website schema for blog
 */
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/blog?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(slug: string, title: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: BASE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${BASE_URL}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: title,
        item: `${BASE_URL}/blog/${slug}`,
      },
    ],
  };
}

/**
 * Generate optimized meta description
 * Should be 150-160 characters for desktop, 120 for mobile
 */
export function generateMetaDescription(text: string, maxLength: number = 160): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return trimmed.substring(0, maxLength - 3) + '...';
}

/**
 * Generate Open Graph image URL with fallback
 */
export function generateOGImageUrl(
  coverImageUrl?: string,
  title?: string,
  author?: string
): string {
  if (coverImageUrl) {
    return coverImageUrl;
  }

  // Fallback to OG image generator (e.g., using Vercel OG, imgix, etc)
  const params = new URLSearchParams({
    ...(title && { title }),
    ...(author && { author }),
  });

  return `${BASE_URL}/api/og?${params.toString()}`;
}

/**
 * Verify canonical URL format
 */
export function isValidCanonicalUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate blog feed URLs (RSS, JSON, etc.)
 */
export function generateFeedUrls() {
  return {
    rss: `${BASE_URL}/feed.xml`,
    json: `${BASE_URL}/feed.json`,
    atom: `${BASE_URL}/feed.atom`,
  };
}

/**
 * Generate social share URLs
 */
export function generateShareUrls(slug: string, title: string) {
  const url = encodeURIComponent(`${BASE_URL}/blog/${slug}`);
  const encodedTitle = encodeURIComponent(title);

  return {
    twitter: `https://twitter.com/intent/tweet?url=${url}&text=${encodedTitle}&via=xmartycreator`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${url}`,
    reddit: `https://reddit.com/submit?url=${url}&title=${encodedTitle}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${url}&description=${encodedTitle}`,
  };
}

/**
 * Get recommended internal linking suggestions
 */
export function generateInternalLinkSuggestions(tags: string[], currentSlug: string, maxItems: number = 5) {
  return {
    tags: tags.slice(0, maxItems),
    relatedBlogSearch: {
      method: 'GET',
      endpoint: `/api/blog/related`,
      params: { slug: currentSlug, limit: maxItems },
    },
  };
}

/**
 * Validate SEO best practices
 */
export function validateSEOBestPractices(blog: BlogPost): { score: number; warnings: string[] } {
  const warnings: string[] = [];
  let score = 100;

  // Meta title check (50-60 chars optimal)
  if (!blog.metaTitle) {
    warnings.push('Meta title is not set');
    score -= 10;
  } else if (blog.metaTitle.length < 30) {
    warnings.push('Meta title is too short (optimal: 50-60 characters)');
    score -= 5;
  } else if (blog.metaTitle.length > 70) {
    warnings.push('Meta title is too long (optimal: 50-60 characters)');
    score -= 5;
  }

  // Meta description check (150-160 chars optimal)
  if (!blog.metaDescription) {
    warnings.push('Meta description is not set');
    score -= 10;
  } else if (blog.metaDescription.length < 120) {
    warnings.push('Meta description is too short (optimal: 150-160 characters)');
    score -= 5;
  } else if (blog.metaDescription.length > 170) {
    warnings.push('Meta description is too long (optimal: 150-160 characters)');
    score -= 5;
  }

  // Keywords check
  if (!blog.metaKeywords || blog.metaKeywords.length === 0) {
    warnings.push('Meta keywords are not set');
    score -= 5;
  }

  // Slug check
  if (!blog.slug.match(/^[a-z0-9-]+$/)) {
    warnings.push('Slug contains invalid characters');
    score -= 10;
  }

  // Cover image check
  if (!blog.coverImage?.url) {
    warnings.push('Cover image is not set (recommended for social sharing)');
    score -= 5;
  }

  // Featured image alt text
  if (blog.coverImage?.url && !blog.coverImage.alt) {
    warnings.push('Cover image alt text is missing');
    score -= 5;
  }

  // Publish date check
  if (!blog.publishedAt && blog.status === 'published') {
    warnings.push('Published date is not set');
    score -= 10;
  }

  // Tags check
  if (!blog.tags || blog.tags.length === 0) {
    warnings.push('Tags are not set (helps with internal linking)');
    score -= 5;
  }

  // Canonical URL check
  if (blog.canonicalUrl && !isValidCanonicalUrl(blog.canonicalUrl)) {
    warnings.push('Canonical URL format is invalid');
    score -= 10;
  }

  return {
    score: Math.max(0, score),
    warnings,
  };
}
