'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TipTapEditor } from '@/components/rich-editor/tiptap-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Blog {
  _id: string;
  slug: string;
  title: string;
  contentJSON: object;
  contentHTML: string;
  excerpt: string;
  author: string;
  authorImage: string;
  coverImage: string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  status: 'draft' | 'published';
}

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [blog, setBlog] = useState<Blog | null>(null);
  const [contentJSON, setContentJSON] = useState({});
  const [contentHTML, setContentHTML] = useState('');
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

  useEffect(() => {
    loadBlog();
  }, [params.id]);

  const loadBlog = async () => {
    try {
      const res = await fetch(`/api/blog/${params.id}`);
      if (!res.ok) {
        console.error('Failed to load blog');
        return;
      }
      const data = await res.json();
      setBlog(data);
      setContentJSON(data.content || data.contentJSON || { type: 'doc', content: [] });
      setContentHTML(data.htmlContent || data.contentHTML || '');
      setFormData({
        title: data.title || '',
        author: data.author || '',
        authorImage: data.authorImage || '',
        coverImage: data.coverImage || '',
        excerpt: data.excerpt || '',
        tags: data.tags?.join(', ') || '',
        metaTitle: data.metaTitle || '',
        metaDescription: data.metaDescription || '',
        status: data.status || 'draft',
      });
    } catch (error) {
      console.error('Error loading blog:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`/api/blog/${blog?.slug}`, {
        method: 'PUT',
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
        toast({
          title: 'Success',
          description: 'Blog updated successfully',
          variant: 'default',
        });
        router.push('/admin/blog');
      } else {
        const error = await response.json();
        console.error('Error:', error);
        toast({
          title: 'Error',
          description: error.error || 'Failed to update blog',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating blog:', error);
      toast({
        title: 'Error',
        description: 'Failed to update blog',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this blog?')) return;
    try {
      const res = await fetch(`/api/blog/${params.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Blog deleted successfully',
          variant: 'default',
        });
        router.push('/admin/blog');
      } else {
        const error = await res.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to delete blog',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting blog:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete blog',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!blog) {
    return <div className="p-8">Blog not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Edit Blog</h1>
        <Button variant="outline" size="sm" onClick={() => router.back()}>Back</Button>
      </div>

      <form onSubmit={handleUpdate} className="space-y-6">
        {/* Title & Author */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Title *</label>
            <Input
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Author *</label>
            <Input
              required
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            />
          </div>
        </div>

        {/* Editor */}
        <div>
          <label className="text-sm font-medium mb-2 block">Content *</label>
          <TipTapEditor
            initialContent={contentJSON}
            onChange={(json, html) => {
              setContentJSON(json);
              setContentHTML(html);
            }}
          />
        </div>

        {/* Excerpt & Tags */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Excerpt</label>
            <Textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Tags (comma-separated)</label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="tag1, tag2, tag3"
            />
          </div>
        </div>

        {/* Images */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Author Image URL</label>
            <Input
              value={formData.authorImage}
              onChange={(e) => setFormData({ ...formData, authorImage: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Cover Image URL</label>
            <Input
              value={formData.coverImage}
              onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
            />
          </div>
        </div>

        {/* SEO */}
        <div>
          <label className="text-sm font-medium">Meta Title</label>
          <Input
            value={formData.metaTitle}
            onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Meta Description</label>
          <Textarea
            value={formData.metaDescription}
            onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
            rows={3}
          />
        </div>

        {/* Status */}
        <div>
          <label className="text-sm font-medium">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={submitting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Update
          </Button>
        </div>
      </form>
    </div>
  );
}
