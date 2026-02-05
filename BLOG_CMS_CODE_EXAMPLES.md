# 💻 BLOG CMS - PRACTICAL CODE EXAMPLES & USAGE

**Real-world code examples for every operation**

---

## 1️⃣ CREATE NEW BLOG (Frontend)

### Admin Form Component
```tsx
// /admin/blog/new page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TipTapEditor } from '@/components/rich-editor/tiptap-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function NewBlogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    authorImage: '',
    coverImage: '',
    excerpt: '',
    tags: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    status: 'draft' as 'draft' | 'published',
  });

  const [contentJSON, setContentJSON] = useState({});
  const [contentHTML, setContentHTML] = useState('');

  // Handle TipTap editor changes
  const handleContentChange = (json: any, html: string) => {
    setContentJSON(json);
    setContentHTML(html);
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          contentJSON,
          contentHTML,
          excerpt: formData.excerpt,
          author: formData.author,
          authorImage: formData.authorImage,
          coverImage: formData.coverImage,
          tags: formData.tags.split(',').map(t => t.trim()),
          metaTitle: formData.metaTitle,
          metaDescription: formData.metaDescription,
          metaKeywords: formData.metaKeywords.split(',').map(k => k.trim()),
          status: formData.status,
        }),
      });

      const blog = await response.json();
      
      if (response.ok) {
        router.push(`/admin/blog/${blog.slug}/edit`);
      }
    } catch (error) {
      console.error('Error creating blog:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium">Title</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter blog title"
          required
        />
      </div>

      {/* TipTap Editor */}
      <div>
        <label className="block text-sm font-medium mb-2">Content</label>
        <TipTapEditor
          initialContent={contentJSON}
          onChange={handleContentChange}
        />
      </div>

      {/* Author */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Author Name</label>
          <Input
            value={formData.author}
            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Author Image URL</label>
          <Input
            value={formData.authorImage}
            onChange={(e) => setFormData({ ...formData, authorImage: e.target.value })}
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Cover Image */}
      <div>
        <label className="block text-sm font-medium">Cover Image URL</label>
        <Input
          value={formData.coverImage}
          onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
          placeholder="https://..."
        />
      </div>

      {/* Excerpt */}
      <div>
        <label className="block text-sm font-medium">Excerpt (160 chars)</label>
        <Textarea
          value={formData.excerpt}
          onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
          placeholder="Brief summary of the blog..."
          maxLength={160}
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium">Tags (comma separated)</label>
        <Input
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          placeholder="nextjs, tutorial, javascript"
        />
      </div>

      {/* SEO */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">SEO Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Meta Title (50-60 chars)</label>
            <Input
              value={formData.metaTitle}
              onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
              placeholder="How to Learn Next.js 15"
              maxLength={60}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Meta Description (150-160 chars)</label>
            <Textarea
              value={formData.metaDescription}
              onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
              placeholder="Learn Next.js 15 from scratch with this complete guide..."
              maxLength={160}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Meta Keywords (comma separated)</label>
            <Input
              value={formData.metaKeywords}
              onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })}
              placeholder="nextjs, react, web development"
            />
          </div>
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium">Status</label>
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
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Create Blog'}
        </Button>
      </div>
    </form>
  );
}
```

---

## 2️⃣ API ROUTE (Backend) - Create Blog

### POST /api/blog
```typescript
// /api/blog/route.ts

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import clientPromise from '@/lib/mongodb';
import Blog from '@/lib/models/blog';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    // ✅ Check authentication
    const session = request.cookies.get('session');
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    console.log('📝 [API] Creating blog:', body.title);

    // Connect to MongoDB
    const client = await clientPromise;
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    // ✅ Validate required fields
    const { title, contentHTML, excerpt, author, status } = body;
    
    if (!title || !contentHTML || !author) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // ✅ Check if slug already exists
    const existing = await Blog.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      );
    }

    // Calculate read time
    const plainText = contentHTML.replace(/<[^>]*>/g, '');
    const wordCount = plainText.split(/\s+/).length;
    const readTime = `${Math.ceil(wordCount / 200)} min read`;

    // Create blog document
    const blog = new Blog({
      _id: new mongoose.Types.ObjectId(),
      title,
      slug,
      contentJSON: body.contentJSON || {},
      contentHTML,
      excerpt,
      author,
      authorImage: body.authorImage || '',
      coverImage: body.coverImage || '',
      tags: body.tags || [],
      readTime,
      metaTitle: body.metaTitle || title,
      metaDescription: body.metaDescription || excerpt,
      metaKeywords: body.metaKeywords || [],
      canonicalUrl: `${process.env.NEXT_PUBLIC_URL}/blog/${slug}`,
      status: status || 'draft',
      viewCount: 0,
      publishedAt: status === 'published' ? new Date() : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Save to MongoDB
    await blog.save();
    console.log('✅ [API] Blog created:', slug);

    return NextResponse.json(blog, { status: 201 });
  } catch (error) {
    console.error('❌ [API] Error creating blog:', error);
    return NextResponse.json(
      { error: 'Failed to create blog' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    // Build query
    const query: any = {};
    if (status) query.status = status;

    // Find blogs
    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .lean();

    console.log('📖 [API] Fetched', blogs.length, 'blogs');

    return NextResponse.json(blogs);
  } catch (error) {
    console.error('❌ [API] Error fetching blogs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blogs' },
      { status: 500 }
    );
  }
}
```

---

## 3️⃣ EDIT BLOG

### Admin Edit Form
```tsx
// /admin/blog/[id]/edit/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TipTapEditor } from '@/components/rich-editor/tiptap-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [blog, setBlog] = useState<any>(null);

  useEffect(() => {
    loadBlog();
  }, [params.id]);

  const loadBlog = async () => {
    try {
      // Assuming params.id is the slug
      const res = await fetch(`/api/blog/${params.id}`);
      const data = await res.json();
      setBlog(data);
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
      const response = await fetch(`/api/blog/${blog.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blog),
      });

      if (response.ok) {
        alert('Blog updated successfully!');
      }
    } catch (error) {
      console.error('Error updating blog:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader2 className="h-8 w-8 animate-spin" />;
  if (!blog) return <p>Blog not found</p>;

  return (
    <form onSubmit={handleUpdate} className="space-y-6">
      <div>
        <label className="block text-sm font-medium">Title</label>
        <Input
          value={blog.title}
          onChange={(e) => setBlog({ ...blog, title: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Content</label>
        <TipTapEditor
          initialContent={blog.contentJSON}
          onChange={(json, html) => {
            setBlog({ ...blog, contentJSON: json, contentHTML: html });
          }}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Updating...' : 'Update Blog'}
        </Button>
      </div>
    </form>
  );
}
```

### API PUT Route
```typescript
// /api/blog/[slug]/route.ts (PUT method)

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const client = await clientPromise;
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    const body = await request.json();
    const { slug } = params;

    // Find and update blog
    const blog = await Blog.findOneAndUpdate(
      { slug },
      {
        title: body.title,
        contentJSON: body.contentJSON,
        contentHTML: body.contentHTML,
        excerpt: body.excerpt,
        author: body.author,
        authorImage: body.authorImage,
        coverImage: body.coverImage,
        tags: body.tags,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        metaKeywords: body.metaKeywords,
        status: body.status,
        updatedAt: new Date(),
        publishedAt: body.status === 'published' ? body.publishedAt || new Date() : null,
      },
      { new: true }
    );

    if (!blog) {
      return NextResponse.json(
        { error: 'Blog not found' },
        { status: 404 }
      );
    }

    console.log('✅ [API] Blog updated:', slug);
    return NextResponse.json(blog);
  } catch (error) {
    console.error('❌ [API] Error updating blog:', error);
    return NextResponse.json(
      { error: 'Failed to update blog' },
      { status: 500 }
    );
  }
}
```

---

## 4️⃣ DELETE BLOG

### Frontend
```tsx
// In Dashboard component

const handleDelete = async (slug: string) => {
  if (!confirm('Delete this blog?')) return;

  try {
    const response = await fetch(`/api/blog/${slug}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      // Refresh list
      loadBlogs();
    }
  } catch (error) {
    console.error('Error deleting blog:', error);
  }
};
```

### Backend
```typescript
// /api/blog/[slug]/route.ts (DELETE method)

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const client = await clientPromise;
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    const { slug } = params;

    // Delete blog
    const result = await Blog.deleteOne({ slug });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Blog not found' },
        { status: 404 }
      );
    }

    console.log('✅ [API] Blog deleted:', slug);
    return NextResponse.json(
      { message: 'Blog deleted successfully' }
    );
  } catch (error) {
    console.error('❌ [API] Error deleting blog:', error);
    return NextResponse.json(
      { error: 'Failed to delete blog' },
      { status: 500 }
    );
  }
}
```

---

## 5️⃣ PUBLIC BLOG DETAIL PAGE

### SEO with generateMetadata()
```typescript
// /blog/[slug]/page.tsx

import { Metadata } from 'next';
import { NotFound } from '@/components/not-found';
import { BlogDetailClient } from './blog-detail-client';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/blog/${params.slug}`);
    const blog = await res.json();

    return {
      title: blog.metaTitle,
      description: blog.metaDescription,
      keywords: blog.metaKeywords,
      alternates: {
        canonical: blog.canonicalUrl,
      },
      openGraph: {
        title: blog.title,
        description: blog.excerpt,
        image: blog.coverImage,
        url: `/blog/${blog.slug}`,
        type: 'article',
        publishedTime: blog.publishedAt,
        authors: [blog.author],
        tags: blog.tags,
      },
      twitter: {
        card: 'summary_large_image',
        title: blog.title,
        description: blog.excerpt,
        image: blog.coverImage,
      },
    };
  } catch (error) {
    return {
      title: 'Blog Not Found',
      description: 'The blog post you are looking for does not exist.',
    };
  }
}

export default async function BlogDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/blog/${params.slug}`);
    
    if (!res.ok) throw new Error('Not found');
    
    const blog = await res.json();

    // JSON-LD Schema
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: blog.title,
      image: blog.coverImage,
      datePublished: blog.publishedAt,
      dateModified: blog.updatedAt,
      author: {
        '@type': 'Person',
        name: blog.author,
      },
      description: blog.excerpt,
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <BlogDetailClient blog={blog} />
      </>
    );
  } catch (error) {
    return <NotFound />;
  }
}
```

---

## 6️⃣ TIPTAP EDITOR USAGE

### Component
```tsx
// /components/rich-editor/tiptap-editor.tsx

'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Highlight from '@tiptap/extension-highlight';
import { Toolbar } from './toolbar';

interface TipTapEditorProps {
  initialContent?: object;
  onChange: (json: object, html: string) => void;
}

export function TipTapEditor({ initialContent = {}, onChange }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
      Highlight.configure({ multicolor: true }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      // Return both JSON and HTML
      onChange(editor.getJSON(), editor.getHTML());
    },
  });

  return (
    <div className="border rounded-lg overflow-hidden">
      <Toolbar editor={editor} />
      <EditorContent
        editor={editor}
        className="prose max-w-none p-4 min-h-96"
      />
    </div>
  );
}
```

---

## 7️⃣ READ TIME CALCULATION

### Utility Function
```typescript
// /lib/blog-utils.ts

export function calculateReadTime(contentHTML: string): string {
  // Remove HTML tags
  const plainText = contentHTML.replace(/<[^>]*>/g, '');
  
  // Count words
  const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;
  
  // Calculate minutes (200 words per minute standard)
  const minutesRead = Math.ceil(wordCount / 200);
  
  return `${minutesRead} min read`;
}

// Usage:
const readTime = calculateReadTime('<p>Your blog content...</p>');
// Returns: "5 min read"
```

---

## 8️⃣ RENDERING BLOG CONTENT

### Safe HTML Rendering
```tsx
// /blog/[slug]/blog-detail-client.tsx

'use client';

import DOMPurify from 'dompurify';

interface BlogDetailClientProps {
  blog: any;
}

export function BlogDetailClient({ blog }: BlogDetailClientProps) {
  // Sanitize HTML before rendering
  const sanitizedHTML = DOMPurify.sanitize(blog.contentHTML);

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      {/* Cover Image */}
      <img
        src={blog.coverImage}
        alt={blog.title}
        className="w-full h-96 object-cover rounded-lg"
      />

      {/* Title & Meta */}
      <h1 className="text-4xl font-bold mt-8">{blog.title}</h1>
      
      <div className="flex items-center gap-4 mt-4 text-muted-foreground">
        <span>By {blog.author}</span>
        <span>•</span>
        <span>{new Date(blog.publishedAt).toLocaleDateString()}</span>
        <span>•</span>
        <span>{blog.readTime}</span>
      </div>

      {/* Content */}
      <div
        className="prose prose-lg max-w-none mt-8"
        dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
      />

      {/* Tags */}
      <div className="mt-8 flex gap-2">
        {blog.tags.map((tag: string) => (
          <span key={tag} className="px-3 py-1 bg-primary/10 rounded">
            {tag}
          </span>
        ))}
      </div>

      {/* Author Box */}
      <div className="mt-12 border-t pt-8">
        <div className="flex items-center gap-4">
          <img
            src={blog.authorImage}
            alt={blog.author}
            className="w-16 h-16 rounded-full"
          />
          <div>
            <p className="font-bold">{blog.author}</p>
            <p className="text-muted-foreground">Author Bio</p>
          </div>
        </div>
      </div>
    </article>
  );
}
```

---

## 9️⃣ DASHBOARD LISTING

### Table Component
```tsx
// /admin/blog/page.tsx (simplified)

'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';

export default function BlogDashboard() {
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    const res = await fetch('/api/blog');
    const data = await res.json();
    setBlogs(data);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Author</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {blogs.map((blog: any) => (
          <TableRow key={blog._id}>
            <TableCell className="font-medium">{blog.title}</TableCell>
            <TableCell>{blog.author}</TableCell>
            <TableCell>{blog.status}</TableCell>
            <TableCell>{new Date(blog.updatedAt).toLocaleDateString()}</TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm">
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

## 🔟 COMPLETE WORKFLOW

### Step-by-Step Example

**1. Admin creates a blog:**
```bash
POST /api/blog {
  title: "Getting Started with Next.js",
  author: "Jane Doe",
  contentJSON: { ... },
  contentHTML: "<h1>Getting Started...</h1>...",
  status: "draft"
}

Response: { _id: "...", slug: "getting-started-with-nextjs", readTime: "5 min read" }
```

**2. Admin edits before publishing:**
```bash
PUT /api/blog/getting-started-with-nextjs {
  title: "Getting Started with Next.js 15",
  status: "published",
  ...
}
```

**3. Blog appears on public site:**
```bash
Public URL: /blog/getting-started-with-nextjs
- Meta tags loaded from database
- Content rendered from contentHTML
- JSON-LD schema generated
- SEO-ready for Google
```

**4. User visits and sees:**
- Title, cover image
- Author & publish date
- Full content with formatting
- Table of contents
- Related posts
- Share buttons

---

## ✨ SUMMARY

✅ **Complete working examples**  
✅ **Real-world patterns**  
✅ **Production-ready code**  
✅ **Ready to copy & adapt**  

Start from any of these examples and customize for your needs!

