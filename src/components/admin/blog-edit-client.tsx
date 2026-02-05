'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BlogEditorForm, BlogFormValues } from '@/components/admin/blog-editor-form';

interface Props {
  slug: string;
}

export default function BlogEditClient({ slug }: Props) {
  const router = useRouter();
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
          setInitial({
            title: data.title || '',
            excerpt: data.excerpt || '',
            content: data.content || data.htmlContent || '',
            htmlContent: data.htmlContent || data.content || '',
            author: data.author || '',
            coverImage: data.coverImage || '',
            status: data.status || 'draft',
            slug: data.slug || slug,
            tags: Array.isArray(data.tags) ? data.tags.join(', ') : '',
            metaTitle: data.metaTitle || data.title || '',
            metaDescription: data.metaDescription || data.excerpt || '',
            metaKeywords: Array.isArray(data.metaKeywords) ? data.metaKeywords.join(', ') : '',
          });
        }
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
      await fetch(`/api/blog/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          tags: tagsArray,
          metaKeywords: metaKeywordsArray,
          metaTitle: values.metaTitle || values.title,
          metaDescription: values.metaDescription || values.excerpt,
          htmlContent: values.htmlContent || values.content,
        }),
      });
      router.push('/admin/dashboard/blog');
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
