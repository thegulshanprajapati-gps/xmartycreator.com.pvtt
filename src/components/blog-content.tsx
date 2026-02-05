'use client';

import React from 'react';
import { scrubCurrencyInHtml } from '@/lib/price-sanitize';

interface BlogContentProps {
  htmlContent?: string | null;
  contentJSON?: Record<string, any> | null;
  title?: string;
}

/**
 * BlogContent - Minimal Production Renderer
 * 
 * Trust the editor. TipTap generates clean semantic HTML.
 * Just render it with Tailwind prose classes.
 * 
 * Pattern: Editor → HTML → Renderer → CSS (like Medium/Dev.to/Notion)
 */
export function BlogContent({
  htmlContent,
  contentJSON,
  title = 'Blog Post'
}: BlogContentProps) {
  // ✅ Content validation
  const hasValidContent = (htmlContent && typeof htmlContent === 'string' && htmlContent.trim().length > 0) ||
    (contentJSON && typeof contentJSON === 'object');

  if (!hasValidContent) {
    console.log('❌ xx');
    return (
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <p className="text-yellow-800 dark:text-yellow-200 m-0">
            No content available for this post.
          </p>
        </div>
      </div>
    );
  }

  // ✅ Render clean HTML from TipTap
  if (htmlContent) {
    const sanitizedHtml = scrubCurrencyInHtml(htmlContent);
    console.log('✅ xo');
    return (
      <article
        className="prose prose-lg dark:prose-invert max-w-none
          prose-headings:font-headline prose-headings:text-foreground
          dark:prose-headings:text-slate-100
          prose-h1:text-4xl prose-h1:mt-8 prose-h1:mb-4
          prose-h2:text-3xl prose-h2:mt-8 prose-h2:mb-4
          prose-h3:text-2xl prose-h3:mt-6 prose-h3:mb-3
          
          prose-p:text-foreground prose-p:leading-relaxed prose-p:my-4
          
          prose-a:text-primary prose-a:underline
          hover:prose-a:text-primary/80 prose-a:transition-colors
          
          prose-strong:font-semibold prose-strong:text-foreground
          
          prose-li:text-foreground prose-li:my-2
          prose-ol:text-foreground prose-ol:my-4
          prose-ul:text-foreground prose-ul:my-4
          
          prose-code:bg-slate-100 dark:prose-code:bg-slate-800
          prose-code:text-red-600 dark:prose-code:text-red-400
          prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:font-mono prose-code:text-sm
          
          prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700
          prose-pre:overflow-x-auto prose-pre:rounded-lg prose-pre:text-slate-100
          
          prose-blockquote:border-l-4 prose-blockquote:border-primary
          prose-blockquote:bg-slate-50 dark:prose-blockquote:bg-slate-800/50
          prose-blockquote:pl-4 prose-blockquote:py-3 prose-blockquote:pr-4
          prose-blockquote:text-slate-700 dark:prose-blockquote:text-slate-300
          prose-blockquote:italic prose-blockquote:rounded-r-md
          
          prose-img:rounded-lg prose-img:shadow-lg prose-img:my-6
          
          prose-hr:border-slate-200 dark:prose-hr:border-slate-700 prose-hr:my-6
          
          prose-table:text-sm prose-table:my-6
          prose-thead:bg-slate-100 dark:prose-thead:bg-slate-800
          prose-th:text-left prose-th:font-semibold prose-th:px-4 prose-th:py-2
          prose-td:px-4 prose-td:py-2 prose-td:border-slate-200 dark:prose-td:border-slate-700"
        style={{
          fontFamily: "'Noto Sans','Noto Sans Devanagari','Segoe UI Symbol','Arial Unicode MS',system-ui,sans-serif",
        }}
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    );
  }

  // ✅ Fallback for JSON
  console.log('⚠️ JSON');
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <p className="text-blue-800 dark:text-blue-200 m-0">
          Advanced formatting detected. Please view in editor for best experience.
        </p>
      </div>
    </div>
  );
}
