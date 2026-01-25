'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TipTapEditor } from '@/components/rich-editor/tiptap-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function NewBlogPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [contentJSON, setContentJSON] = useState({});
  const [contentHTML, setContentHTML] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    authorImage: '',
    coverImage: '',
    excerpt: '',
    tags: '',
    metaTitle: '',
    metaDescription: '',
    status: 'draft' as 'draft' | 'published',
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!contentHTML.trim()) {
      newErrors.content = 'Content is required';
    }
    if (!formData.author.trim()) {
      newErrors.author = 'Author name is required';
    }
    if (!formData.excerpt.trim()) {
      newErrors.excerpt = 'Excerpt is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          content: contentJSON,
          contentJSON: contentJSON,
          htmlContent: contentHTML,
          contentHTML: contentHTML,
          excerpt: formData.excerpt,
          author: formData.author,
          authorImage: formData.authorImage,
          coverImage: formData.coverImage,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
          metaTitle: formData.metaTitle,
          metaDescription: formData.metaDescription,
          status: formData.status,
        }),
      });

      if (response.ok) {
        const blog = await response.json();
        toast({
          title: 'Success',
          description: 'Blog created successfully',
          variant: 'default',
        });
        router.push(`/admin/blog/${blog.slug}/edit`);
      } else {
        const error = await response.json();
        console.error('Error:', error);
        toast({
          title: 'Error',
          description: error.error || 'Failed to create blog',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to create blog',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Create New Blog Post</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.title}
            onChange={(e) => {
              setFormData({ ...formData, title: e.target.value });
              if (errors.title) setErrors({ ...errors, title: '' });
            }}
            placeholder="Enter blog title"
            className={errors.title ? 'border-red-500 focus:border-red-500' : ''}
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Content <span className="text-red-500">*</span>
          </label>
          <div className={errors.content ? 'border-2 border-red-500 rounded-md p-2' : ''}>
            <TipTapEditor
              initialContent={contentJSON}
              onChange={(json, html) => {
                setContentJSON(json);
                setContentHTML(html);
                if (errors.content) setErrors({ ...errors, content: '' });
              }}
            />
          </div>
          {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Author Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.author}
              onChange={(e) => {
                setFormData({ ...formData, author: e.target.value });
                if (errors.author) setErrors({ ...errors, author: '' });
              }}
              placeholder="John Doe"
              className={errors.author ? 'border-red-500 focus:border-red-500' : ''}
            />
            {errors.author && <p className="text-red-500 text-sm mt-1">{errors.author}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Author Image URL</label>
            <Input
              value={formData.authorImage}
              onChange={(e) => setFormData({ ...formData, authorImage: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Cover Image URL</label>
          <Input
            value={formData.coverImage}
            onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Excerpt <span className="text-red-500">*</span>
          </label>
          <Textarea
            value={formData.excerpt}
            onChange={(e) => {
              setFormData({ ...formData, excerpt: e.target.value });
              if (errors.excerpt) setErrors({ ...errors, excerpt: '' });
            }}
            placeholder="Brief summary..."
            maxLength={160}
            className={errors.excerpt ? 'border-red-500 focus:border-red-500' : ''}
          />
          {errors.excerpt && <p className="text-red-500 text-sm mt-1">{errors.excerpt}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Tags</label>
          <Input
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="nextjs, tutorial, javascript"
          />
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">SEO Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Meta Title</label>
              <Input
                value={formData.metaTitle}
                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                placeholder="SEO title"
                maxLength={60}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Meta Description</label>
              <Textarea
                value={formData.metaDescription}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                placeholder="SEO description"
                maxLength={160}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Blog
          </Button>
        </div>
      </form>
    </div>
  );
}
