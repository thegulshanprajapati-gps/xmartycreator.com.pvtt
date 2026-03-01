'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { BlogEditorForm, BlogFormValues } from '@/components/admin/blog-editor-form';
import { useParams, useRouter } from 'next/navigation';
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

export default function EditBlogPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [blog, setBlog] = useState<BlogFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // map API blog to form values
  const mapToFormValues = (data: any): BlogFormValues => ({
    title: data.title || '',
    slug: data.slug || slug,
    excerpt: data.excerpt || '',
    content: data.htmlContent || data.content || '',
    htmlContent: data.htmlContent || data.content || '',
    author: data.author || '',
    tags: Array.isArray(data.tags) ? data.tags.join(', ') : '',
    metaTitle: data.metaTitle || data.title || '',
    metaDescription: data.metaDescription || data.excerpt || '',
    metaKeywords: Array.isArray(data.metaKeywords) ? data.metaKeywords.join(', ') : '',
    coverImage: typeof data.coverImage === 'string' ? data.coverImage : data.coverImage?.url || '',
    status: data.status || 'draft',
  });

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/blog/${slug}`);
        
        if (!res.ok) {
          if (res.status === 404) {
            router.replace('/404');
            return;
          }

          let message = `Failed to fetch blog (status ${res.status})`;
          try {
            const data = await res.json();
            if (data?.error) message = data.error;
            if (data?.details) message = `${message}: ${data.details}`;
          } catch (err) {
            // ignore JSON parse issues
          }
          throw new Error(message);
        }

        const data = await res.json();
        setBlog(mapToFormValues(data));
      } catch (err) {
        console.warn('Error fetching blog:', err);
        const message = err instanceof Error ? err.message : 'Failed to load blog';
        setError(message);
        toast({
          title: 'Load failed',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchBlog();
  }, [slug]);

  const handleSubmit = async (values: BlogFormValues) => {
    setSaving(true);
    try {
      const tagsArray = values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const metaKeywordsArray = values.metaKeywords ? values.metaKeywords.split(',').map(t => t.trim()).filter(Boolean) : [];
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
        const message = data?.error || data?.details || `Failed to update blog (${res.status})`;
        throw new Error(message);
      }

      toast({
        title: 'Blog updated',
        description: values.status === 'published'
          ? 'Published article updated successfully.'
          : 'Draft updated successfully.',
      });

      const updatedSlug = typeof data?.slug === 'string' ? data.slug : values.slug;
      if (updatedSlug && updatedSlug !== slug) {
        router.replace(`/admin/dashboard/blog/${updatedSlug}/edit`);
      }
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Error Loading Blog</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Blog Not Found</h1>
          <p className="text-muted-foreground">The requested blog could not be loaded.</p>
        </div>
      </div>
    );
  }

  return <BlogEditorForm initial={blog} saving={saving} onSubmit={handleSubmit} mode="edit" />;
}
