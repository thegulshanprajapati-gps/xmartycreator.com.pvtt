'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BlogEditorForm, BlogFormValues } from '@/components/admin/blog-editor-form';

export default function NewBlogPage() {
  const router = useRouter();
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
      await fetch('/api/blog', {
        method: 'POST',
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

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Article</h1>
      <BlogEditorForm initial={initial} saving={saving} onSubmit={handleSubmit} mode="create" />
    </div>
  );
}
