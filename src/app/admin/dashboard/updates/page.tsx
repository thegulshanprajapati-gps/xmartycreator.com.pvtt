'use client';

import { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  Loader,
  Search,
  Filter,
  Eye,
  Copy,
  FileText,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';

interface Update {
  _id: string;
  title: string;
  subtitle: string;
  content: string;
  details?: string;
  type: 'general' | 'platform' | 'course' | 'maintenance' | 'exam' | 'event' | 'announcement' | 'system';
  isUrgent: boolean;
  status: 'draft' | 'published';
  author: string;
  createdAt: string;
  updatedAt: string;
  documentLink?: string;
  readMoreLink?: string;
}

export default function UpdatesManagementPage() {
  const { theme } = useTheme();
  const [updates, setUpdates] = useState<Update[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    content: '',
    details: '',
    type: 'platform' as Update['type'],
    isUrgent: false,
    status: 'draft' as 'draft' | 'published',
    author: 'Admin',
    documentLink: '',
    readMoreLink: ''
  });
  const { toast } = useToast();

  // Fetch updates
  const fetchUpdates = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/updates');
      if (!res.ok) throw new Error('Failed to fetch updates');
      const data = await res.json();
      setUpdates(data.updates || []);
    } catch (error) {
      console.error('Error fetching updates:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch updates',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.title || !formData.content) {
        toast({
          title: 'Error',
          description: 'Title and content are required',
          variant: 'destructive'
        });
        return;
      }

      if (editingId) {
        // Update existing
        const res = await fetch(`/api/updates/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (!res.ok) throw new Error('Failed to update');

        toast({
          title: 'Success',
          description: 'Update modified successfully'
        });
      } else {
        // Create new
        const res = await fetch('/api/updates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (!res.ok) throw new Error('Failed to create');

        toast({
          title: 'Success',
          description: 'Update created successfully'
        });
      }

      // Reset form
      setFormData({
        title: '',
        subtitle: '',
        content: '',
        details: '',
        type: 'platform',
        isUrgent: false,
        status: 'draft',
        author: 'Admin',
        documentLink: '',
        readMoreLink: ''
      });
      setEditingId(null);
      setIsDialogOpen(false);
      fetchUpdates();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: editingId ? 'Failed to update' : 'Failed to create update',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this update?')) return;

    try {
      const res = await fetch(`/api/updates/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');

      toast({
        title: 'Success',
        description: 'Update deleted successfully'
      });

      fetchUpdates();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete update',
        variant: 'destructive'
      });
    }
  };

  // Handle edit
  const handleEdit = (update: Update) => {
    setFormData({
      title: update.title,
      subtitle: update.subtitle,
      content: update.content,
      details: update.details || '',
      type: update.type,
      isUrgent: update.isUrgent,
      status: update.status,
      author: update.author,
      documentLink: update.documentLink || '',
      readMoreLink: update.readMoreLink || ''
    });
    setEditingId(update._id);
    setIsDialogOpen(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData({
      title: '',
      subtitle: '',
      content: '',
      details: '',
      type: 'platform',
      isUrgent: false,
      status: 'draft',
      author: 'Admin',
      documentLink: '',
      readMoreLink: ''
    });
  };

  // Filter updates
  const filteredUpdates = updates.filter(update => {
    const matchesSearch = update.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         update.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || update.type === filterType;
    const matchesStatus = filterStatus === 'all' || update.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'platform':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'course':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'general':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'maintenance':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'exam':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'event':
        return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      case 'announcement':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'system':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'published'
      ? 'bg-green-500/20 text-green-400 border-green-500/30'
      : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Updates Management</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage platform, course, and general updates
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => handleCloseDialog()}>
                <Plus className="h-4 w-4" />
                New Update
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'Edit Update' : 'Create New Update'}
                </DialogTitle>
                <DialogDescription>
                  {editingId
                    ? 'Modify the update details and save changes'
                    : 'Fill in the details to create a new update'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Title */}
                <div>
                  <label className="text-sm font-medium">Title *</label>
                  <Input
                    placeholder="Update title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <label className="text-sm font-medium">Subtitle</label>
                  <Input
                    placeholder="Update subtitle (optional)"
                    value={formData.subtitle}
                    onChange={(e) =>
                      setFormData({ ...formData, subtitle: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="text-sm font-medium">Content *</label>
                  <Textarea
                    placeholder="Update content"
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    className="mt-2 min-h-[100px]"
                  />
                </div>

                {/* Details */}
                <div>
                  <label className="text-sm font-medium">📋 Add Details (Optional)</label>
                  <Textarea
                    placeholder="Add detailed information, features, or description about this update..."
                    value={formData.details}
                    onChange={(e) =>
                      setFormData({ ...formData, details: e.target.value })
                    }
                    className="mt-2 min-h-[150px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">This will be shown in the detailed view when users click 'Read'</p>
                </div>

                {/* Type */}
                <div>
                  <label className="text-sm font-medium">Type *</label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="platform">Platform</SelectItem>
                      <SelectItem value="course">Course</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="exam">Exam</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Document Link */}
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Document Link
                  </label>
                  <Input
                    type="url"
                    placeholder="https://example.com/document.pdf"
                    value={formData.documentLink}
                    onChange={(e) =>
                      setFormData({ ...formData, documentLink: e.target.value })
                    }
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Optional: Link to a document or resource</p>
                </div>

                {/* Read More Link */}
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Read More Link
                  </label>
                  <Input
                    type="url"
                    placeholder="https://example.com/article"
                    value={formData.readMoreLink}
                    onChange={(e) =>
                      setFormData({ ...formData, readMoreLink: e.target.value })
                    }
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Optional: External link for more information</p>
                </div>

                {/* Urgent Toggle */}
                <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <label className="text-sm font-medium flex-1">
                    Mark as Urgent
                  </label>
                  <input
                    type="checkbox"
                    checked={formData.isUrgent}
                    onChange={(e) =>
                      setFormData({ ...formData, isUrgent: e.target.checked })
                    }
                    className="h-4 w-4 cursor-pointer"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Author */}
                <div>
                  <label className="text-sm font-medium">Author</label>
                  <Input
                    placeholder="Author name"
                    value={formData.author}
                    onChange={(e) =>
                      setFormData({ ...formData, author: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      {editingId ? 'Updating...' : 'Creating...'}
                    </>
                  ) : editingId ? (
                    'Update'
                  ) : (
                    'Create'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search updates..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full lg:w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="platform">Platform</SelectItem>
              <SelectItem value="course">Course</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="exam">Exam</SelectItem>
              <SelectItem value="event">Event</SelectItem>
              <SelectItem value="announcement">Announcement</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full lg:w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredUpdates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {updates.length === 0 ? 'No updates yet' : 'No updates found'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {updates.length === 0
                ? 'Create your first update to get started'
                : 'Try adjusting your filters'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {filteredUpdates.map((update, index) => (
              <motion.div
                key={update._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-all">
                  <CardContent className="pt-6">
                    <div className="flex flex-col gap-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold">{update.title}</h3>
                          {update.subtitle && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {update.subtitle}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(update)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(update._id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Content Preview */}
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {update.content}
                      </p>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${getTypeColor(
                            update.type
                          )}`}
                        >
                          {update.type}
                        </span>
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            update.status
                          )}`}
                        >
                          {update.status}
                        </span>
                        {update.isUrgent && (
                          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium border bg-red-500/20 text-red-400 border-red-500/30">
                            ⚠️ Urgent
                          </span>
                        )}
                      </div>

                      {/* Links Preview */}
                      {(update.documentLink || update.readMoreLink) && (
                        <div className="flex flex-wrap gap-2">
                          {update.documentLink && (
                            <a
                              href={update.documentLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 px-2 py-1 bg-blue-500/10 rounded border border-blue-500/30"
                            >
                              <FileText className="h-3 w-3" />
                              Document
                            </a>
                          )}
                          {update.readMoreLink && (
                            <a
                              href={update.readMoreLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 px-2 py-1 bg-blue-500/10 rounded border border-blue-500/30"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Read More
                            </a>
                          )}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                        <div>
                          <p>By {update.author}</p>
                          <p>Created {formatDate(update.createdAt)}</p>
                        </div>
                        <p>Updated {formatDate(update.updatedAt)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{updates.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-500">
              {updates.filter(u => u.status === 'published').length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-500">
              {updates.filter(u => u.status === 'draft').length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Urgent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">
              {updates.filter(u => u.isUrgent).length}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}






