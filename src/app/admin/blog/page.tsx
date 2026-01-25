'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Trash2,
  Edit,
  Plus,
  Search,
  Eye,
  FileText,
  Loader2,
  Check,
  Circle,
  MoreVertical,
} from 'lucide-react';
import { BlogPost } from '@/types/blog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

export default function AdminBlogPage() {
  const { toast } = useToast();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; blog?: BlogPost }>({
    open: false,
  });

  // Fetch blogs
  useEffect(() => {
    fetchBlogs();
  }, [statusFilter, searchQuery]);

  const fetchBlogs = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        limit: '100',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery }),
      });

      const res = await fetch(`/api/blog?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        // API returns array directly, not wrapped in {posts}
        const blogs = Array.isArray(data) ? data : data.posts || [];
        setBlogs(blogs);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (slug: string) => {
    try {
      const res = await fetch(`/api/blog/${slug}`, { method: 'DELETE' });
      if (res.ok) {
        setBlogs(blogs.filter(b => b.slug !== slug));
        setDeleteDialog({ open: false });
        toast({
          title: 'Success',
          description: 'Blog deleted successfully',
          variant: 'default',
        });
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

  const toggleStatus = async (blog: BlogPost) => {
    try {
      const newStatus = blog.status === 'draft' ? 'published' : 'draft';
      const res = await fetch(`/api/blog/${blog.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...blog,
          status: newStatus,
          publishedAt: newStatus === 'published' ? new Date() : null,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setBlogs(blogs.map(b => (b.slug === blog.slug ? updated : b)));
        toast({
          title: 'Success',
          description: `Blog ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`,
          variant: 'default',
        });
      } else {
        const error = await res.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to update blog status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating blog status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update blog status',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Blog Management</h1>
          <p className="text-muted-foreground">Manage your blog posts</p>
        </div>
        <Button asChild>
          <Link href="/admin/blog/new">
            <Plus className="h-4 w-4 mr-2" />
            New Blog
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search blogs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : blogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-muted/50">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No blogs found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blogs.map(blog => (
                <TableRow key={blog._id?.toString()} className="hover:bg-muted/50">
                  <TableCell className="max-w-xs">
                    <div>
                      <p className="font-medium line-clamp-1">{blog.title}</p>
                      <p className="text-sm text-muted-foreground">{blog.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell>{blog.author}</TableCell>
                  <TableCell>
                    <Badge variant={blog.status === 'published' ? 'default' : 'secondary'}>
                      {blog.status === 'published' ? (
                        <Check className="h-3 w-3 mr-1" />
                      ) : (
                        <Circle className="h-3 w-3 mr-1" />
                      )}
                      {blog.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{blog.views || 0}</TableCell>
                  <TableCell>
                    {blog.publishedAt
                      ? new Date(blog.publishedAt).toLocaleDateString()
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/blog/${blog.slug}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/blog/${blog.slug}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleStatus(blog)}>
                          {blog.status === 'draft' ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Publish
                            </>
                          ) : (
                            <>
                              <Circle className="h-4 w-4 mr-2" />
                              Unpublish
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteDialog({ open: true, blog })}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={open => setDeleteDialog({ open })}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Blog</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{deleteDialog.blog?.title}"? This action cannot be
            undone.
          </AlertDialogDescription>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog.blog && handleDelete(deleteDialog.blog.slug)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
