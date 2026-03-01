'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BlogEditorForm, BlogFormValues } from '@/components/admin/blog-editor-form';
import { useToast } from '@/hooks/use-toast';

function buildFallbackExcerpt(explicitExcerpt: string, htmlContent: string) {
  const explicit = (explicitExcerpt || '').trim();
  if (explicit) return explicit;

  const plain = (htmlContent || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!plain) return '';
  return plain.length > 220 ? `${plain.slice(0, 217)}...` : plain;
}

export default function NewBlogPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const initial: BlogFormValues = {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    htmlContent: '',
    author: '',
    tags: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    coverImage: '',
    status: 'draft',
  };

  const handleSubmit = async (values: BlogFormValues) => {
    setSaving(true);
    try {
      const tagsArray = values.tags
        ? values.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
      const metaKeywordsArray = values.metaKeywords
        ? values.metaKeywords.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
      const htmlBody = values.htmlContent || values.content || '';
      const normalizedExcerpt = buildFallbackExcerpt(values.excerpt, htmlBody);

      const res = await fetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          excerpt: normalizedExcerpt,
          tags: tagsArray,
          metaKeywords: metaKeywordsArray,
          metaTitle: values.metaTitle || values.title,
          metaDescription: values.metaDescription || normalizedExcerpt,
          htmlContent: htmlBody,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 413) {
          throw new Error(
            data?.error || 'Request too large. Use smaller inline image or paste a hosted image URL.'
          );
        }
        const message = data?.error || data?.details || `Failed to create blog (${res.status})`;
        throw new Error(message);
      }

      toast({
        title: 'Blog created',
        description: values.status === 'published'
          ? 'Article published successfully.'
          : 'Draft saved successfully.',
      });
      router.push('/admin/dashboard/blog');
    } catch (error) {
      toast({
        title: 'Create failed',
        description: error instanceof Error ? error.message : 'Could not create blog.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Article</h1>
      <BlogEditorForm initial={initial} saving={saving} onSubmit={handleSubmit} mode="create" />
    </div>
  );
}
