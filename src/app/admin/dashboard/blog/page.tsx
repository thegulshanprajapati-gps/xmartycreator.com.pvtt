'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, Plus, Eye, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';

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

  useEffect(() => {
    loadBlogs();
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Blog Posts</h1>
          <p className="text-muted-foreground">Manage and organize your blog content</p>
        </div>
        <Button onClick={() => router.push('/admin/blog/new')}>
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
                      <Link href={`/admin/blog/${blog.slug}/edit`}>
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