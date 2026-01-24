/**
 * Blog Utility Functions
 * Production-grade utilities for blog operations
 */

import slug from 'slug';

/**
 * Calculate reading time based on word count
 * Standard: 200 words = 1 minute
 */
export function calculateReadTime(text: string): string {
  const wordsPerMinute = 200;
  const wordCount = text.trim().split(/\s+/).length;
  const readTimeMinutes = Math.ceil(wordCount / wordsPerMinute);
  
  if (readTimeMinutes < 1) return 'Less than 1 min';
  if (readTimeMinutes === 1) return '1 min read';
  return `${readTimeMinutes} min read`;
}

/**
 * Generate URL-friendly slug from title
 * Handles special characters, spaces, and multiple slashes
 */
export function generateSlug(title: string): string {
  return slug(title, { lower: true, strict: true });
}

/**
 * Validate blog slug format
 */
export function isValidSlug(slugValue: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slugValue);
}

/**
 * Extract plain text from TipTap JSON
 * Used for calculating read time and meta descriptions
 */
export function extractPlainText(content: any): string {
  if (!content || !content.content) return '';
  
  let text = '';
  
  function traverse(node: any) {
    if (node.text) {
      text += node.text + ' ';
    }
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach((child: any) => traverse(child));
    }
  }
  
  content.content.forEach((node: any) => traverse(node));
  return text.trim();
}

/**
 * Generate excerpt from HTML content
 * Strips HTML tags and returns first N characters
 */
export function generateExcerpt(htmlContent: string, length: number = 160): string {
  // Remove HTML tags
  const plainText = htmlContent.replace(/<[^>]*>/g, '');
  
  // Remove extra whitespace
  const cleaned = plainText.replace(/\s+/g, ' ').trim();
  
  // Return truncated text with ellipsis
  return cleaned.length > length ? cleaned.substring(0, length) + '...' : cleaned;
}

/**
 * Format date for display and SEO
 */
export function formatDateForSEO(date: Date): string {
  return new Date(date).toISOString().split('T')[0];
}

/**
 * Generate canonical URL for blog post
 */
export function generateCanonicalUrl(slug: string, baseUrl: string = process.env.NEXT_PUBLIC_URL || 'https://example.com'): string {
  return `${baseUrl}/blog/${slug}`;
}

/**
 * Validate required blog fields
 */
export function validateBlogData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.title || data.title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (!data.slug || data.slug.trim().length === 0) {
    errors.push('Slug is required');
  } else if (!isValidSlug(data.slug)) {
    errors.push('Slug format is invalid');
  }
  
  if (!data.excerpt || data.excerpt.trim().length === 0) {
    errors.push('Excerpt is required');
  } else if (data.excerpt.length > 160) {
    errors.push('Excerpt must be 160 characters or less');
  }
  
  if (!data.content) {
    errors.push('Content is required');
  }
  
  if (!data.author || data.author.trim().length === 0) {
    errors.push('Author is required');
  }
  
  if (!['draft', 'published'].includes(data.status)) {
    errors.push('Status must be either draft or published');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate table of contents from TipTap JSON
 */
export function generateTableOfContents(content: any): Array<{ id: string; level: number; text: string }> {
  if (!content || !content.content) return [];
  
  const toc: Array<{ id: string; level: number; text: string }> = [];
  let headingCount = 0;
  
  function traverse(node: any) {
    if (node.type === 'heading') {
      const level = parseInt(node.attrs?.level || '1');
      
      // Extract text from heading
      let text = '';
      if (node.content && Array.isArray(node.content)) {
        node.content.forEach((child: any) => {
          if (child.text) text += child.text;
        });
      }
      
      if (text) {
        const id = `heading-${headingCount++}`;
        toc.push({ id, level, text });
      }
    }
    
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach((child: any) => traverse(child));
    }
  }
  
  content.content.forEach((node: any) => traverse(node));
  return toc;
}

/**
 * Calculate reading progress based on scroll position
 */
export function calculateReadingProgress(scrollHeight: number, clientHeight: number, scrollTop: number): number {
  const totalHeight = scrollHeight - clientHeight;
  if (totalHeight === 0) return 0;
  const progress = (scrollTop / totalHeight) * 100;
  return Math.min(Math.max(progress, 0), 100);
}

/**
 * Generate related blog posts query
 */
export function generateRelatedPostsQuery(currentBlogId: string, tags: string[], exclude: string[] = []): any {
  return {
    _id: { $ne: currentBlogId },
    status: 'published',
    $and: [
      {
        $or: [
          { tags: { $in: tags } },
        ]
      },
    ]
  };
}

/**
 * Sanitize blog content to prevent XSS
 * Only allows specific HTML tags from TipTap output
 */
export function sanitizeBlogContent(html: string): string {
  // This is a basic sanitization. For production, use a library like DOMPurify
  const allowedTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'em', 'strong', 'u', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'img', 'br', 'hr', 'mark'];
  
  // Create a temporary DOM element
  const temp = new DOMParser().parseFromString(html, 'text/html');
  
  function removeInvalidElements(element: Element) {
    const children = Array.from(element.children);
    children.forEach(child => {
      if (!allowedTags.includes(child.tagName.toLowerCase())) {
        child.parentNode?.removeChild(child);
      } else {
        removeInvalidElements(child);
      }
    });
  }
  
  removeInvalidElements(temp.body);
  return temp.body.innerHTML;
}
