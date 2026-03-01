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
import { useToast } from '@/hooks/use-toast';

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

type Notice = {
  tone: 'success' | 'error' | 'info';
  message: string;
} | null;

const DEFAULT_HERO_CONTENT = {
  badgeText: 'Student Insights',
  title: 'Blog for Diploma Success',
  description: 'Clear explanations, PYQs, exam updates, and real guidance for better results.',
  primaryButton: { text: 'Explore Blog', href: '/blog' },
  secondaryButton: { text: 'Latest Posts', href: '/blog' },
  pills: [
    { title: 'Study Guides', description: 'Semester-wise notes and PYQs' },
    { title: 'Exam Updates', description: 'SBTE notices and key dates' },
  ],
};

const toPlainText = (value: unknown): string =>
  String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeHeroText = (
  value: unknown,
  fallback: string,
  options?: { treatBlogAsEmpty?: boolean }
) => {
  const plain = toPlainText(value);
  if (!plain) return fallback;
  if (options?.treatBlogAsEmpty && /^blog$/i.test(plain)) return fallback;
  return plain;
};

const normalizeHeroPayload = (input: any) => ({
  badgeText: normalizeHeroText(input?.badgeText, DEFAULT_HERO_CONTENT.badgeText),
  title: normalizeHeroText(input?.title, DEFAULT_HERO_CONTENT.title, { treatBlogAsEmpty: true }),
  description: normalizeHeroText(input?.description, DEFAULT_HERO_CONTENT.description),
  primaryButton: {
    text: normalizeHeroText(
      input?.primaryButton?.text,
      DEFAULT_HERO_CONTENT.primaryButton.text
    ),
    href: toPlainText(input?.primaryButton?.href) || DEFAULT_HERO_CONTENT.primaryButton.href,
  },
  secondaryButton: {
    text: normalizeHeroText(
      input?.secondaryButton?.text,
      DEFAULT_HERO_CONTENT.secondaryButton.text
    ),
    href: toPlainText(input?.secondaryButton?.href) || DEFAULT_HERO_CONTENT.secondaryButton.href,
  },
  pills: [0, 1].map((index) => {
    const fallback = DEFAULT_HERO_CONTENT.pills[index];
    const source = Array.isArray(input?.pills) ? input.pills[index] : undefined;
    return {
      title: normalizeHeroText(source?.title, fallback.title),
      description: normalizeHeroText(source?.description, fallback.description),
    };
  }),
});

export default function BlogDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hero, setHero] = useState<any>(DEFAULT_HERO_CONTENT);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [deletingSlugs, setDeletingSlugs] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadBlogs();
    loadHero();
  }, []);

  const loadBlogs = async () => {
    try {
      const res = await fetch('/api/blog?status=all&limit=200&fresh=true', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Failed to fetch blogs (${res.status})`);
      }
      setBlogs(Array.isArray(data) ? data : data.posts || []);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      setNotice({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Could not load blog posts.',
      });
      toast({
        title: 'Fetch failed',
        description: error instanceof Error ? error.message : 'Could not load blog posts.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadHero = async () => {
    try {
      const res = await fetch('/api/pages/blog');
      if (res.ok) {
        const data = await res.json();
        setHero(normalizeHeroPayload(data?.hero || {}));
      }
    } catch (error) {
      console.error('Error fetching blog hero content:', error);
    }
  };

  const saveHero = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const normalizedHero = normalizeHeroPayload(hero);
      setHero(normalizedHero);

      const res = await fetch('/api/pages/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hero: normalizedHero }),
      });
      if (!res.ok) {
        throw new Error('Failed to save');
      }
      setSaveMessage('Saved: Blog hero updated.');
      toast({
        title: 'Saved',
        description: 'Blog hero content updated successfully.',
      });
    } catch (error) {
      console.error(error);
      setSaveMessage('Error: Could not save blog hero.');
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Could not save blog hero.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (deletingSlugs.has(slug)) return;
    if (!confirm('Delete this blog?')) return;

    setDeletingSlugs((prev) => {
      const next = new Set(prev);
      next.add(slug);
      return next;
    });
    setNotice({ tone: 'info', message: 'Deleting blog post...' });

    try {
      const res = await fetch(`/api/blog/${encodeURIComponent(slug)}`, {
        method: 'DELETE',
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 404) {
        setBlogs((prev) => prev.filter((blog) => blog.slug !== slug));
        setNotice({ tone: 'success', message: 'Blog was already deleted. Removed from list.' });
        toast({
          title: 'Already deleted',
          description: 'This post no longer exists in database.',
        });
        return;
      }

      if (!res.ok) {
        throw new Error(data?.error || `Delete failed (${res.status})`);
      }

      setBlogs((prev) => prev.filter((blog) => blog.slug !== slug));
      setNotice({ tone: 'success', message: 'Blog deleted successfully.' });
      toast({
        title: 'Deleted',
        description: 'Blog deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting blog:', error);
      setNotice({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Could not delete blog.',
      });
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Could not delete blog.',
        variant: 'destructive',
      });
    } finally {
      setDeletingSlugs((prev) => {
        const next = new Set(prev);
        next.delete(slug);
        return next;
      });
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

      {notice && (
        <div
          className={`mb-4 rounded-md border px-3 py-2 text-sm ${
            notice.tone === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : notice.tone === 'error'
                ? 'border-red-500/40 bg-red-500/10 text-red-300'
                : 'border-blue-500/40 bg-blue-500/10 text-blue-300'
          }`}
          role="status"
          aria-live="polite"
        >
          {notice.message}
        </div>
      )}

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
                  <TableCell>{blog.readTime || '--'}</TableCell>
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
                      disabled={deletingSlugs.has(blog.slug)}
                      onClick={() => handleDelete(blog.slug)}>
                      {deletingSlugs.has(blog.slug) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
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
