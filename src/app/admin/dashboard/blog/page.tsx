'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, Plus, Eye, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';

interface BlogPost {
  _id: string;
  title: string;
  author: string;
  status: 'draft' | 'published';
  slug: string;
  readTime: string;
  updatedAt: string;
  publishedAt?: string;
}

export default function BlogDashboardPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hero, setHero] = useState<any>({
    badgeText: '',
    title: '',
    description: '',
    primaryButton: { text: '', href: '' },
    secondaryButton: { text: '', href: '' },
    pills: [
      { title: '', description: '' },
      { title: '', description: '' },
    ],
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    loadBlogs();
    loadHero();
  }, []);

  const loadBlogs = async () => {
    try {
      const res = await fetch('/api/blog');
      const data = await res.json();
      setBlogs(Array.isArray(data) ? data : data.posts || []);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHero = async () => {
    try {
      const res = await fetch('/api/pages/blog');
      if (res.ok) {
        const data = await res.json();
        setHero({
          badgeText: data?.hero?.badgeText || '',
          title: data?.hero?.title || '',
          description: data?.hero?.description || '',
          primaryButton: data?.hero?.primaryButton || { text: '', href: '' },
          secondaryButton: data?.hero?.secondaryButton || { text: '', href: '' },
          pills: Array.isArray(data?.hero?.pills) && data.hero.pills.length >= 2
            ? data.hero.pills.slice(0,2)
            : [{ title: '', description: '' }, { title: '', description: '' }],
        });
      }
    } catch (error) {
      console.error('Error fetching blog hero content:', error);
    }
  };

  const saveHero = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch('/api/pages/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hero }),
      });
      if (!res.ok) {
        throw new Error('Failed to save');
      }
      setSaveMessage('Saved: Blog hero updated.');
    } catch (error) {
      console.error(error);
      setSaveMessage('Error: Could not save blog hero.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('Delete this blog?')) return;
    try {
      await fetch(`/api/blog/${slug}`, { method: 'DELETE' });
      loadBlogs();
    } catch (error) {
      console.error('Error deleting blog:', error);
    }
  };

  const filtered = blogs.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.author.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-6 mb-10 lg:grid-cols-[1fr]">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Blog Hero Content</h2>
              <p className="text-sm text-muted-foreground">Controls the header section on /blog</p>
            </div>
            <Button onClick={saveHero} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
          {saveMessage && (
            <div className="mb-4 text-sm text-muted-foreground">{saveMessage}</div>
          )}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Badge Text</label>
              <Input value={hero.badgeText} onChange={(e)=>setHero({...hero, badgeText:e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input value={hero.title} onChange={(e)=>setHero({...hero, title:e.target.value})} />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium">Subtitle</label>
              <Textarea rows={3} value={hero.description} onChange={(e)=>setHero({...hero, description:e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Primary Button Text</label>
              <Input value={hero.primaryButton.text} onChange={(e)=>setHero({...hero, primaryButton:{...hero.primaryButton, text:e.target.value}})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Primary Button Link</label>
              <Input value={hero.primaryButton.href} onChange={(e)=>setHero({...hero, primaryButton:{...hero.primaryButton, href:e.target.value}})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Secondary Button Text</label>
              <Input value={hero.secondaryButton.text} onChange={(e)=>setHero({...hero, secondaryButton:{...hero.secondaryButton, text:e.target.value}})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Secondary Button Link</label>
              <Input value={hero.secondaryButton.href} onChange={(e)=>setHero({...hero, secondaryButton:{...hero.secondaryButton, href:e.target.value}})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pill 1 Title</label>
              <Input value={hero.pills[0]?.title} onChange={(e)=>setHero({...hero, pills:[{...hero.pills[0], title:e.target.value}, hero.pills[1]]})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pill 1 Description</label>
              <Input value={hero.pills[0]?.description} onChange={(e)=>setHero({...hero, pills:[{...hero.pills[0], description:e.target.value}, hero.pills[1]]})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pill 2 Title</label>
              <Input value={hero.pills[1]?.title} onChange={(e)=>setHero({...hero, pills:[hero.pills[0], {...hero.pills[1], title:e.target.value}]})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pill 2 Description</label>
              <Input value={hero.pills[1]?.description} onChange={(e)=>setHero({...hero, pills:[hero.pills[0], {...hero.pills[1], description:e.target.value}]})} />
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Blog Posts</h1>
          <p className="text-muted-foreground">Manage and organize your blog content</p>
        </div>
        <Button onClick={() => router.push('/admin/dashboard/blog/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Post
        </Button>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search blogs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="border rounded-lg overflow-hidden bg-white dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Read Time</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2 opacity-50" />
                  <p className="text-muted-foreground">No blogs found</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(blog => (
                <TableRow key={blog._id} className="hover:bg-muted/50">
                  <TableCell className="font-medium max-w-xs truncate">{blog.title}</TableCell>
                  <TableCell>{blog.author}</TableCell>
                  <TableCell>
                    <Badge variant={blog.status === 'published' ? 'default' : 'secondary'}>
                      {blog.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {blog.publishedAt
                      ? new Date(blog.publishedAt).toLocaleDateString()
                      : new Date(blog.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{blog.readTime || '—'}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      asChild>
                      <Link href={`/blog/${blog.slug}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      asChild>
                      <Link href={`/admin/dashboard/blog/${blog.slug}/edit`}>
                        <Edit2 className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(blog.slug)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
