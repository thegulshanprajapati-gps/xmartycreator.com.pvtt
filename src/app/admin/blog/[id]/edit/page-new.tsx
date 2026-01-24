'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TipTapEditor } from '@/components/rich-editor/tiptap-editor-new';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Trash2 } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [blog, setBlog] = useState<Blog | null>(null);

  useEffect(() => {
    loadBlog();
  }, [params.id]);

  const loadBlog = async () => {
    try {
      const res = await fetch(`/api/blog/${params.id}`);
      const data = await res.json();
      setBlog(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blog) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/blog/${blog.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blog),
      });

      if (response.ok) {
        alert('Blog updated!');
        router.push('/admin/dashboard/blog');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!blog || !confirm('Delete this blog?')) return;

    try {
      await fetch(`/api/blog/${blog.slug}`, { method: 'DELETE' });
      router.push('/admin/dashboard/blog');
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!blog) return <div className="p-8">Blog not found</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Edit Blog Post</h1>
        <Button variant="destructive" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      <form onSubmit={handleUpdate} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <Input
            value={blog.title}
            onChange={(e) => setBlog({ ...blog, title: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Content</label>
          <TipTapEditor
            initialContent={blog.contentJSON}
            onChange={(json, html) => {
              setBlog({ ...blog, contentJSON: json, contentHTML: html });
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Author</label>
            <Input
              value={blog.author}
              onChange={(e) => setBlog({ ...blog, author: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Author Image</label>
            <Input
              value={blog.authorImage}
              onChange={(e) => setBlog({ ...blog, authorImage: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Cover Image</label>
          <Input
            value={blog.coverImage}
            onChange={(e) => setBlog({ ...blog, coverImage: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Excerpt</label>
          <Textarea
            value={blog.excerpt}
            onChange={(e) => setBlog({ ...blog, excerpt: e.target.value })}
            maxLength={160}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Tags</label>
          <Input
            value={blog.tags.join(', ')}
            onChange={(e) => setBlog({ ...blog, tags: e.target.value.split(',').map(t => t.trim()) })}
          />
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">SEO</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Meta Title</label>
              <Input
                value={blog.metaTitle}
                onChange={(e) => setBlog({ ...blog, metaTitle: e.target.value })}
                maxLength={60}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Meta Description</label>
              <Textarea
                value={blog.metaDescription}
                onChange={(e) => setBlog({ ...blog, metaDescription: e.target.value })}
                maxLength={160}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <select
            value={blog.status}
            onChange={(e) => setBlog({ ...blog, status: e.target.value as 'draft' | 'published' })}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Update Blog
          </Button>
        </div>
      </form>
    </div>
  );
}
