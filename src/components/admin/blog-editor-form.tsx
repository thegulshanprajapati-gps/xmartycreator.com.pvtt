'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ImageIcon } from 'lucide-react';
import { BlogRichEditor } from './blog-rich-editor';
import { useToast } from '@/hooks/use-toast';

export type BlogFormValues = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  htmlContent?: string;
  author: string;
  tags: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  coverImage: string;
  status: 'draft' | 'published';
};

interface BlogEditorFormProps {
  initial?: BlogFormValues;
  saving?: boolean;
  onSubmit: (values: BlogFormValues) => Promise<void>;
  mode?: 'create' | 'edit';
}

const DEFAULT_INITIAL: BlogFormValues = {
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

export function BlogEditorForm({ initial, saving = false, onSubmit, mode = 'create' }: BlogEditorFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const resolvedInitial = initial ?? DEFAULT_INITIAL;
  const [values, setValues] = useState<BlogFormValues>(resolvedInitial);
  const [statusOverride, setStatusOverride] = useState<'draft' | 'published'>(resolvedInitial.status);

  useEffect(() => {
    const next = initial ?? DEFAULT_INITIAL;
    setValues(next);
    setStatusOverride(next.status);
  }, [initial]);

  // Auto-slugify on title change (only if slug empty or auto)
  useEffect(() => {
    if (!values.title) return;
    if (!values.slug || values.slug === (initial?.slug || '')) {
      const slug = values.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      setValues((v) => ({ ...v, slug }));
    }
  }, [values.title]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (key: keyof BlogFormValues, val: string) => {
    setValues((v) => ({ ...v, [key]: val }));
  };

  const coverPreview = useMemo(() => values.coverImage?.trim(), [values.coverImage]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const contentRef = useRef<HTMLTextAreaElement | null>(null);

  const handleFileSelect = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return alert('Please select an image file');
    if (file.size > 5 * 1024 * 1024) return alert('Max file size is 5MB');
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result?.toString() || '';
      if (url) setValues((v) => ({ ...v, coverImage: url }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (desiredStatus?: 'draft' | 'published') => {
    if (!values.title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a blog title before saving.',
        variant: 'destructive',
      });
      return;
    }

    if (!values.slug.trim()) {
      toast({
        title: 'Slug required',
        description: 'Please enter a valid slug.',
        variant: 'destructive',
      });
      return;
    }

    if (!values.author.trim()) {
      toast({
        title: 'Author required',
        description: 'Please enter author name.',
        variant: 'destructive',
      });
      return;
    }

    const htmlBody = (values.content || values.htmlContent || '').trim();
    if (!htmlBody) {
      toast({
        title: 'Content required',
        description: 'Please add blog content before saving.',
        variant: 'destructive',
      });
      return;
    }

    const nextStatus = desiredStatus || statusOverride;
    await onSubmit({ ...values, status: nextStatus, htmlContent: values.content });
  };

  const wrapSelection = (before: string, after: string = before) => {
    const ta = contentRef.current;
    if (!ta) return;
    const { selectionStart, selectionEnd, value } = ta;
    const selected = value.slice(selectionStart, selectionEnd) || 'text';
    const newValue = value.slice(0, selectionStart) + before + selected + after + value.slice(selectionEnd);
    setValues((v) => ({ ...v, content: newValue }));
    // restore selection inside wrapped text
    requestAnimationFrame(() => {
      const pos = selectionStart + before.length;
      const end = pos + selected.length;
      ta.focus();
      ta.setSelectionRange(pos, end);
    });
  };

  const applyStyle = (css: string) => wrapSelection(`<span style="${css}">`, '</span>');
  const applyBlock = (css: string) => wrapSelection(`<div style="${css}">`, '</div>');
  const clearFormatting = () => wrapSelection('', '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/admin/dashboard/blog">
            <ArrowLeft className="h-4 w-4" />
            Back to Articles
          </Link>
        </Button>
        <div className="flex-1" />
        <Badge variant={statusOverride === 'published' ? 'default' : 'secondary'}>
          {statusOverride === 'published' ? 'Published' : 'Draft'}
        </Badge>
      </div>

      {/* Featured Image */}
      <section className="rounded-2xl border border-border bg-card/70 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Featured Image *</h2>
          <p className="text-sm text-muted-foreground">Paste an image URL (PNG, JPG, WebP). Max ~5MB.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-[2fr_3fr] items-start">
          <div
            className="aspect-video w-full rounded-xl border border-dashed border-muted-foreground/30 bg-muted/40 flex items-center justify-center overflow-hidden relative"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              handleFileSelect(file);
            }}
          >
            {coverPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverPreview}
                alt="Cover preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center text-muted-foreground gap-2">
                <ImageIcon className="h-8 w-8" />
                <span className="text-sm text-center px-4">Drop an image file or paste URL to preview</span>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <Input
              value={values.coverImage}
              onChange={(e) => handleChange('coverImage', e.target.value)}
              placeholder="https://images.example.com/your-cover.jpg"
            />
            <div className="flex gap-3 text-xs text-muted-foreground items-center">
              <span>Tip: Use 16:9 images for best fit.</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Article Details */}
      <section className="rounded-2xl border border-border bg-card/70 shadow-sm p-4 sm:p-6 space-y-4">
        <h2 className="text-lg font-semibold">Article Details</h2>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Headline *</label>
            <Input
              value={values.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Enter article headline (10-200 characters)"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">{values.title.length}/200</p>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Slug *</label>
            <Input
              value={values.slug}
              onChange={(e) => handleChange('slug', e.target.value)}
              placeholder="my-awesome-article"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Excerpt (Optional)</label>
            <Textarea
              rows={3}
              value={values.excerpt}
              onChange={(e) => handleChange('excerpt', e.target.value)}
              placeholder="Brief summary of the article..."
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground">{values.excerpt.length}/300</p>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Author *</label>
            <Input
              value={values.author}
              onChange={(e) => handleChange('author', e.target.value)}
              placeholder="Author name"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Tags (comma separated)</label>
            <Input
              value={values.tags}
              onChange={(e) => handleChange('tags', e.target.value)}
              placeholder="ai, startup, technology"
            />
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="rounded-2xl border border-border bg-card/70 shadow-sm p-4 sm:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Article Content *</h2>
          <span className="text-xs text-muted-foreground">Rich editor with HTML output</span>
        </div>
        <BlogRichEditor
          value={values.content}
          onChange={(html) => handleChange('content', html)}
        />
      </section>

      {/* SEO */}
      <section className="rounded-2xl border border-border bg-card/70 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">SEO Settings</h2>
          <span className="text-xs text-muted-foreground">Optional but recommended</span>
        </div>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Meta Title</label>
            <Input
              value={values.metaTitle}
              onChange={(e) => handleChange('metaTitle', e.target.value)}
              placeholder="SEO title (auto-generated if empty)"
              maxLength={60}
            />
            <p className="text-xs text-muted-foreground">{values.metaTitle.length}/60</p>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Meta Description</label>
            <Textarea
              rows={3}
              value={values.metaDescription}
              onChange={(e) => handleChange('metaDescription', e.target.value)}
              placeholder="SEO description (auto-generated if empty)..."
              maxLength={160}
            />
            <p className="text-xs text-muted-foreground">{values.metaDescription.length}/160</p>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Meta Keywords (comma separated)</label>
            <Input
              value={values.metaKeywords}
              onChange={(e) => handleChange('metaKeywords', e.target.value)}
              placeholder="ai, product, release"
            />
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-end">
        <Button
          variant="secondary"
          onClick={() => router.push('/admin/dashboard/blog')}
          type="button"
        >
          Cancel
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setStatusOverride('draft');
            handleSubmit('draft');
          }}
          disabled={saving}
        >
          {saving && statusOverride === 'draft' ? 'Saving...' : 'Save as Draft'}
        </Button>
        <Button
          onClick={() => {
            setStatusOverride('published');
            handleSubmit('published');
          }}
          disabled={saving}
        >
          {saving && statusOverride === 'published' ? 'Publishing...' : 'Publish Article'}
        </Button>
      </div>
    </div>
  );
}
