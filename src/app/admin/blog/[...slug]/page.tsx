'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { TipTapDebug } from '@/components/rich-editor/tiptap-debug';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Save,
  Eye,
  Loader2,
  X,
  Plus,
  ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';
import {
  generateSlug,
  calculateReadTime,
  extractPlainText,
  generateExcerpt,
  validateBlogData,
} from '@/lib/blog-utils';
import { validateSEOBestPractices } from '@/lib/seo-utils';
import { BlogPost } from '@/types/blog';
import Image from 'next/image';

export default function BlogEditorPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const isEditMode = params.slug && params.slug !== 'new';

  const [isLoading, setIsLoading] = useState(isEditMode ? true : false);
  const [isSaving, setIsSaving] = useState(false);
  const [publishDialog, setPublishDialog] = useState(false);

  const [blog, setBlog] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: null,
    htmlContent: '',
    coverImage: { url: '', alt: '' },
    author: '',
    authorImage: '',
    tags: [] as string[],
    status: 'draft' as 'draft' | 'published',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: [] as string[],
    canonicalUrl: '',
  });

  const [tagInput, setTagInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [seoScore, setSeoScore] = useState<{ score: number; warnings: string[] }>({
    score: 0,
    warnings: [],
  });

  // Load blog if editing
  useEffect(() => {
    if (isEditMode) {
      loadBlog();
    }
  }, [isEditMode, params.slug]);

  // Calculate SEO score whenever blog data changes
  useEffect(() => {
    if (blog.title && blog.slug) {
      const score = validateSEOBestPractices(blog as BlogPost);
      setSeoScore(score);
    }
  }, [blog]);

  const loadBlog = async () => {
    try {
      const res = await fetch(`/api/blog/${params.slug}`);
      if (res.ok) {
        const data = await res.json();
        setBlog(data);
      }
    } catch (error) {
      console.error('Error loading blog:', error);
      toast({ title: 'Error', description: 'Failed to load blog' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setBlog(prev => ({
      ...prev,
      title,
      slug: generateSlug(title),
      metaTitle: title.length <= 60 ? title : title.substring(0, 57) + '...',
    }));
  };

  const handleContentChange = (content: any, html: string) => {
    const plainText = extractPlainText(content);
    const readTime = calculateReadTime(plainText);
    const excerpt = generateExcerpt(html, 160);

    setBlog(prev => ({
      ...prev,
      content,
      htmlContent: html,
      excerpt,
      metaDescription:
        prev.metaDescription || generateExcerpt(html, 160),
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && blog.tags.length < 10) {
      setBlog(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.toLowerCase().trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setBlog(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && blog.metaKeywords.length < 10) {
      setBlog(prev => ({
        ...prev,
        metaKeywords: [...prev.metaKeywords, keywordInput.trim()],
      }));
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setBlog(prev => ({
      ...prev,
      metaKeywords: prev.metaKeywords.filter(k => k !== keyword),
    }));
  };

  const handleSave = async (status: 'draft' | 'published' = 'draft') => {
    try {
      const validation = validateBlogData({
        ...blog,
        status,
      });

      if (!validation.valid) {
        toast({
          title: 'Validation Error',
          description: validation.errors.join(', '),
          variant: 'destructive',
        });
        return;
      }

      setIsSaving(true);
      const method = isEditMode ? 'PUT' : 'POST';
      const endpoint = isEditMode ? `/api/blog/${params.slug}` : '/api/blog';

      const payload = {
        ...blog,
        status,
      };

      console.log('Sending blog payload:', payload);

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json();
      console.log('Response status:', res.status, 'Data:', responseData);

      if (res.ok) {
        toast({
          title: 'Success',
          description: `Blog ${status === 'published' ? 'published' : 'saved'} successfully`,
        });

        if (!isEditMode) {
          router.push(`/admin/blog/${responseData.slug}/edit`);
        } else {
          setBlog(responseData);
        }

        setPublishDialog(false);
      } else {
        const errorMessage = responseData?.error || responseData?.details || 'Failed to save blog';
        console.error('API Error:', res.status, errorMessage);
        toast({
          title: `Error ${res.status}`,
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving blog:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save blog',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/admin/blog" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="flex gap-2">
          {blog.slug && blog.status === 'published' && (
            <Button variant="outline" asChild>
              <Link href={`/blog/${blog.slug}`}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </Link>
            </Button>
          )}
          <Button onClick={() => handleSave('draft')} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Draft
          </Button>
          <Button onClick={() => setPublishDialog(true)} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Publish
          </Button>
        </div>
      </div>

      <Tabs defaultValue="editor" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        {/* Editor Tab */}
        <TabsContent value="editor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={blog.title}
                  onChange={handleTitleChange}
                  placeholder="Enter blog title"
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={blog.slug}
                  onChange={e => setBlog(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="url-friendly-slug"
                />
              </div>

              <div>
                <Label htmlFor="author">Author *</Label>
                <Input
                  id="author"
                  value={blog.author}
                  onChange={e => setBlog(prev => ({ ...prev, author: e.target.value }))}
                  placeholder="Author name"
                />
              </div>

              <div>
                <Label htmlFor="authorImage">Author Image URL</Label>
                <Input
                  id="authorImage"
                  value={blog.authorImage}
                  onChange={e => setBlog(prev => ({ ...prev, authorImage: e.target.value }))}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label htmlFor="coverImageUrl">Cover Image URL</Label>
                <Input
                  id="coverImageUrl"
                  value={blog.coverImage.url}
                  onChange={e =>
                    setBlog(prev => ({
                      ...prev,
                      coverImage: { ...prev.coverImage, url: e.target.value },
                    }))
                  }
                  placeholder="https://..."
                />
              </div>

              {blog.coverImage.url && (
                <div className="relative h-48 w-full">
                  <Image
                    src={blog.coverImage.url}
                    alt="Cover"
                    fill
                    className="object-cover rounded"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="coverImageAlt">Cover Image Alt Text</Label>
                <Input
                  id="coverImageAlt"
                  value={blog.coverImage.alt}
                  onChange={e =>
                    setBlog(prev => ({
                      ...prev,
                      coverImage: { ...prev.coverImage, alt: e.target.value },
                    }))
                  }
                  placeholder="Describe the image"
                />
              </div>

              <div>
                <Label htmlFor="excerpt">Excerpt *</Label>
                <Textarea
                  id="excerpt"
                  value={blog.excerpt}
                  onChange={e => setBlog(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Brief summary of your blog post (auto-generated from content, but you can edit)"
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {blog.excerpt.length} / 160
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content *</CardTitle>
            </CardHeader>
            <CardContent>
              <TipTapDebug initialContent={blog.content} onChange={handleContentChange} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tags & Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAddTag()}
                  placeholder="Add a tag"
                />
                <Button onClick={handleAddTag} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {blog.tags.map(tag => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO Score: {seoScore.score}/100</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {seoScore.warnings.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-4">
                  <h4 className="font-semibold text-sm mb-2">Warnings:</h4>
                  <ul className="text-sm space-y-1">
                    {seoScore.warnings.map((w, i) => (
                      <li key={i}>• {w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Meta Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="metaTitle">
                  Meta Title (50-60 chars optimal)
                </Label>
                <Input
                  id="metaTitle"
                  value={blog.metaTitle}
                  onChange={e =>
                    setBlog(prev => ({ ...prev, metaTitle: e.target.value }))
                  }
                  placeholder={blog.title}
                  maxLength={70}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {blog.metaTitle.length} / 70
                </p>
              </div>

              <div>
                <Label htmlFor="metaDescription">
                  Meta Description (150-160 chars optimal)
                </Label>
                <Textarea
                  id="metaDescription"
                  value={blog.metaDescription}
                  onChange={e =>
                    setBlog(prev => ({ ...prev, metaDescription: e.target.value }))
                  }
                  placeholder={blog.excerpt}
                  rows={3}
                  maxLength={170}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {blog.metaDescription.length} / 170
                </p>
              </div>

              <div>
                <Label htmlFor="canonicalUrl">Canonical URL (optional)</Label>
                <Input
                  id="canonicalUrl"
                  value={blog.canonicalUrl}
                  onChange={e =>
                    setBlog(prev => ({ ...prev, canonicalUrl: e.target.value }))
                  }
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label>Meta Keywords</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={keywordInput}
                    onChange={e => setKeywordInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleAddKeyword()}
                    placeholder="Add a keyword"
                  />
                  <Button onClick={handleAddKeyword} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {blog.metaKeywords.map(kw => (
                    <Badge key={kw} variant="outline">
                      {kw}
                      <button
                        onClick={() => handleRemoveKeyword(kw)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">{blog.title || 'Your Title'}</h2>
                <p className="text-muted-foreground mb-4">{blog.metaDescription || blog.excerpt}</p>
              </div>

              {blog.coverImage.url && (
                <div className="relative h-64 w-full">
                  <Image
                    src={blog.coverImage.url}
                    alt="Cover"
                    fill
                    className="object-cover rounded"
                  />
                </div>
              )}

              <div className="prose prose-lg dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: blog.htmlContent }} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Publish Dialog */}
      <AlertDialog open={publishDialog} onOpenChange={setPublishDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>Publish Blog</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to publish this blog? It will be visible to the public.
          </AlertDialogDescription>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleSave('published')}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Publish
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
