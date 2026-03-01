'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BlogEditorForm, BlogFormValues } from '@/components/admin/blog-editor-form';
import { useToast } from '@/hooks/use-toast';

interface Props {
  slug: string;
}

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

export default function BlogEditClient({ slug }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initial, setInitial] = useState<BlogFormValues>({
    title: '',
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
    slug,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/blog/${slug}`);
        if (res.ok) {
          const data = await res.json();
          const htmlBody = typeof data.htmlContent === 'string'
            ? data.htmlContent
            : typeof data.content === 'string'
              ? data.content
              : '';
          setInitial({
            title: data.title || '',
            excerpt: data.excerpt || '',
            content: htmlBody,
            htmlContent: htmlBody,
            author: data.author || '',
            coverImage: typeof data.coverImage === 'string' ? data.coverImage : data.coverImage?.url || '',
            status: data.status || 'draft',
            slug: data.slug || slug,
            tags: Array.isArray(data.tags) ? data.tags.join(', ') : '',
            metaTitle: data.metaTitle || data.title || '',
            metaDescription: data.metaDescription || data.excerpt || '',
            metaKeywords: Array.isArray(data.metaKeywords) ? data.metaKeywords.join(', ') : '',
          });
        } else {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || `Failed to load blog (${res.status})`);
        }
      } catch (error) {
        toast({
          title: 'Load failed',
          description: error instanceof Error ? error.message : 'Could not load blog.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

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

      const res = await fetch(`/api/blog/${slug}`, {
        method: 'PUT',
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
        throw new Error(data?.error || data?.details || `Failed to update blog (${res.status})`);
      }

      toast({
        title: 'Blog updated',
        description: values.status === 'published'
          ? 'Published article updated successfully.'
          : 'Draft updated successfully.',
      });
      router.push('/admin/dashboard/blog');
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Could not update blog.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Edit Article</h1>
      <BlogEditorForm initial={initial} saving={saving} onSubmit={handleSubmit} mode="edit" />
    </div>
  );
}
