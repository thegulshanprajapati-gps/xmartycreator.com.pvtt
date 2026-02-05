'use client';

interface BlogDetailClientProps {
  htmlContent?: string | null;
}

/**
 * ✅ Client-side renderer for blog HTML content
 * Uses dangerouslySetInnerHTML to preserve TipTap editor formatting:
 * - Headings (H1-H6)
 * - Lists (ordered/unordered)
 * - Bold, italic, code formatting
 * - Images with captions
 * - Blockquotes
 * - Code blocks
 */
export function BlogDetailClient({ htmlContent }: BlogDetailClientProps) {
  console.log(`\n🔍 [Client] BlogDetailClient received htmlContent`);
  console.log(`📝 [Client] htmlContent type: ${typeof htmlContent}`);
  console.log(`📝 [Client] htmlContent exists: ${!!htmlContent}`);
  console.log(`📝 [Client] htmlContent length: ${htmlContent?.length || 0}`);
  if (htmlContent) {
    console.log(`📝 [Client] htmlContent preview: ${htmlContent.substring(0, 200)}`);
  }
  
  // ✅ Null safety: Handle missing content
  if (!htmlContent || typeof htmlContent !== 'string' || !htmlContent.trim()) {
    console.warn(`⚠️ [Client] No valid htmlContent to render`);
    return (
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p className="text-muted-foreground italic">No content available.</p>
      </div>
    );
  }

  console.log(`✅ [Client] Rendering HTML content with dangerouslySetInnerHTML`);
  return (
    <div
      className="prose prose-lg dark:prose-invert max-w-none
                 prose-headings:font-headline prose-headings:text-destructive dark:prose-headings:text-foreground
                 prose-p:text-foreground prose-p:leading-relaxed
                 prose-a:text-primary hover:prose-a:text-primary/80
                 prose-strong:font-semibold prose-strong:text-foreground
                 prose-code:bg-muted prose-code:px-2 prose-code:py-1 prose-code:rounded
                 prose-pre:bg-muted prose-pre:border prose-pre:border-input
                 prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4
                 prose-img:rounded-lg prose-img:shadow-lg
                 prose-li:text-foreground prose-li:my-1"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
