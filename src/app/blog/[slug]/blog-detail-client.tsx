'use client';

interface BlogDetailClientProps {
  htmlContent: string;
}

export function BlogDetailClient({ htmlContent }: BlogDetailClientProps) {
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
