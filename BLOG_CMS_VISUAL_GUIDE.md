# 📊 BLOG CMS - VISUAL ARCHITECTURE & FLOW DIAGRAMS

## 🏗️ SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                     NEXT.JS 15 + APP ROUTER                     │
├──────────────────────────┬──────────────────┬──────────────────┤
│      ADMIN PANEL         │   PUBLIC PAGES   │   DYNAMIC SEO    │
│   (/admin/blog/*)        │   (/blog/*)      │   (Sitemap, RSS) │
└───────────┬──────────────┴────────┬─────────┴──────────┬────────┘
            │                       │                    │
            ▼                       ▼                    ▼
    ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐
    │   TipTap Editor  │  │ HTML Renderer    │  │ SEO Schema   │
    │                  │  │                  │  │ JSON-LD      │
    │ - Rich editing   │  │ - TOC generation │  │ OpenGraph    │
    │ - Preview        │  │ - Share buttons  │  │ Twitter      │
    │ - Draft/Publish  │  │ - Related posts  │  │              │
    └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘
             │                     │                   │
             └─────────────────────┼───────────────────┘
                                   ▼
                        ┌──────────────────────┐
                        │   REST API ROUTES    │
                        │   (/api/blog/*)      │
                        │                      │
                        │ - GET /api/blog      │
                        │ - POST /api/blog     │
                        │ - PUT /api/blog/:id  │
                        │ - DELETE /api/blog   │
                        │ - GET /api/feed      │
                        └──────────┬───────────┘
                                   ▼
                        ┌──────────────────────┐
                        │  MONGODB DATABASE    │
                        │                      │
                        │ - Blogs Collection   │
                        │ - Indexes            │
                        │ - Validation         │
                        └──────────────────────┘
```

---

## 👤 USER JOURNEY (ADMIN)

```
Dashboard (/admin/blog)
    │
    ├─ "Add New Post" Button
    │   └─► New Post Form (/admin/blog/new)
    │        │
    │        ├─ Fill: Title, Author, Cover
    │        ├─ Edit: TipTap Content
    │        ├─ Set: Tags, SEO
    │        └─ Save/Publish
    │            │
    │            └─► POST /api/blog
    │                │
    │                └─► MongoDB ✅
    │
    ├─ Edit Button
    │   └─► Edit Form (/admin/blog/{id}/edit)
    │        │
    │        ├─ GET /api/blog/{id}
    │        ├─ Load existing content
    │        ├─ Update TipTap
    │        └─ PUT /api/blog/{id}
    │            │
    │            └─► MongoDB ✅
    │
    └─ Delete Button
        └─► Confirmation Dialog
            │
            └─► DELETE /api/blog/{id}
                │
                └─► MongoDB ✅
```

---

## 👁️ USER JOURNEY (PUBLIC)

```
Public Blog Listing (/blog)
    │
    ├─ GET /api/blog?status=published
    │
    ├─ Show: All published blogs
    ├─ Features: Search, Filter, Pagination
    │
    └─ Click Blog Title
        │
        └─► Blog Detail Page (/blog/{slug})
            │
            ├─ GET /api/blog/{slug}
            │
            ├─ Render:
            │   ├─ Cover image
            │   ├─ Title + Author
            │   ├─ Table of Contents
            │   ├─ Full HTML content
            │   ├─ Share buttons
            │   ├─ Author box
            │   └─ Related posts
            │
            └─ SEO Meta Tags + JSON-LD ✅
```

---

## 🔄 DATA FLOW

### CREATE NEW BLOG
```
┌─────────────────────────────────────────────────────────────┐
│ ADMIN FORM (/admin/blog/new)                                │
│                                                              │
│ Input fields:                                                │
│ ├─ Title: "How to Learn Next.js 15"                        │
│ ├─ TipTap: Rich content (JSON + HTML)                       │
│ ├─ Author: "John Doe"                                       │
│ ├─ Cover: Upload image                                      │
│ ├─ Tags: ["nextjs", "tutorial"]                            │
│ ├─ SEO Title: "Learn Next.js 15"                           │
│ └─ Status: "draft" or "published"                          │
└───────────────────┬──────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ PROCESSING (React client)                                    │
│                                                              │
│ ├─ Validate inputs                                          │
│ ├─ Generate slug: "how-to-learn-nextjs-15"                │
│ ├─ Calculate read time: "5 min read"                        │
│ ├─ Extract excerpt (160 chars)                              │
│ └─ Prepare JSON payload                                     │
└───────────────────┬──────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ API REQUEST (POST /api/blog)                                │
│                                                              │
│ Headers: Content-Type: application/json                     │
│ Body: { title, slug, contentJSON, contentHTML, ... }       │
└───────────────────┬──────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ SERVER VALIDATION (Next.js API Route)                       │
│                                                              │
│ ├─ Check authentication ✅                                  │
│ ├─ Validate data types                                      │
│ ├─ Sanitize HTML                                            │
│ ├─ Check slug uniqueness                                    │
│ └─ Generate unique ID                                       │
└───────────────────┬──────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ DATABASE SAVE (MongoDB)                                      │
│                                                              │
│ INSERT into blogs collection:                               │
│ {                                                            │
│   _id: ObjectId,                                            │
│   title: "How to Learn Next.js 15",                         │
│   slug: "how-to-learn-nextjs-15",                          │
│   contentJSON: {...},                                       │
│   contentHTML: "<p>...</p>",                                │
│   readTime: "5 min read",                                   │
│   status: "draft",                                          │
│   createdAt: Date,                                          │
│   ...                                                        │
│ }                                                            │
└───────────────────┬──────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ RESPONSE (JSON)                                              │
│                                                              │
│ {                                                            │
│   _id: "507f1f77bcf86...",                                 │
│   slug: "how-to-learn-nextjs-15",                          │
│   status: "draft",                                          │
│   createdAt: "2026-01-24T10:30:00Z",                       │
│   ...                                                        │
│ }                                                            │
└───────────────────┬──────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ USER REDIRECTED                                              │
│                                                              │
│ router.push("/admin/blog/how-to-learn-nextjs-15/edit")    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 COMPONENT HIERARCHY

```
AdminLayout
├─ Header
├─ Sidebar
└─ Main Content
    │
    ├─ Dashboard (/admin/blog)
    │   └─ BlogListTable
    │       ├─ Search
    │       ├─ Filter (Status)
    │       ├─ Sort
    │       └─ BlogRow (each with Edit/Delete buttons)
    │
    ├─ New Blog (/admin/blog/new)
    │   └─ BlogForm
    │       ├─ BasicInfo (Title, Author)
    │       ├─ TipTapEditor
    │       ├─ MediaUpload (Cover)
    │       ├─ SEOSettings
    │       └─ PublishButton
    │
    └─ Edit Blog (/admin/blog/{id}/edit)
        └─ BlogForm (same as above, pre-filled)

PublicLayout
├─ Header
├─ Main Content
│   │
│   ├─ Blog Listing (/blog)
│   │   └─ BlogCard (repeated)
│   │       ├─ CoverImage
│   │       ├─ Title
│   │       ├─ Excerpt
│   │       └─ Meta (Author, Date, ReadTime)
│   │
│   └─ Blog Detail (/blog/{slug})
│       ├─ CoverImage
│       ├─ TitleSection
│       ├─ AuthorBox
│       ├─ TableOfContents
│       ├─ BlogContent (HTML rendering)
│       ├─ ShareButtons
│       ├─ RelatedPosts
│       └─ CommentSection (ready for integration)
│
└─ Footer
```

---

## 🗄️ DATABASE SCHEMA VISUAL

```
┌─── BLOGS COLLECTION ────────────────────────────────────────┐
│                                                              │
│ Document Structure:                                         │
│                                                              │
│ {                                                            │
│   _id: ObjectId                                            │
│   title: String              ← Unique, required            │
│   slug: String               ← Unique index, required       │
│   contentJSON: Object        ← TipTap format               │
│   contentHTML: String        ← Rendered HTML              │
│   excerpt: String            ← 160 chars                   │
│   author: String             ← Text index                  │
│   authorImage: String        ← URL                         │
│   coverImage: String         ← URL                         │
│   tags: [String]             ← Index for filtering        │
│   readTime: String           ← Auto calculated            │
│   metaTitle: String          ← SEO                        │
│   metaDescription: String    ← SEO                        │
│   metaKeywords: [String]     ← SEO                        │
│   canonicalUrl: String       ← SEO                        │
│   status: String             ← Index (draft/published)    │
│   viewCount: Number          ← Analytics                  │
│   publishedAt: Date          ← Nullable                   │
│   updatedAt: Date                                         │
│   createdAt: Date            ← Index (descending)         │
│ }                                                            │
│                                                              │
│ Indexes for Performance:                                    │
│ ├─ slug (unique)             → Fast lookup                │
│ ├─ status (ascending)        → Quick filtering            │
│ ├─ tags (ascending)          → Tag filtering              │
│ ├─ createdAt (descending)    → Sort by date              │
│ ├─ text index (title, content) → Full-text search        │
│ └─ author (ascending)        → Author filtering          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔀 EDIT FLOW

```
Click Edit Button on Dashboard
    │
    ▼
/admin/blog/{id}/edit page loads
    │
    ├─ GET /api/blog/{slug}
    │
    ▼
Show form with pre-filled data
    │
    ├─ Title field: "How to Learn Next.js 15"
    ├─ TipTap Editor: Loads contentJSON
    ├─ Author: "John Doe"
    ├─ All other fields pre-filled
    │
    ▼
User makes changes
    │
    ├─ Edit content in TipTap
    ├─ Change title
    ├─ Update SEO
    │
    ▼
Click "Update Blog"
    │
    ├─ PUT /api/blog/{slug}
    │
    ▼
MongoDB updates document
    │
    ├─ updatedAt: new timestamp
    ├─ All changed fields
    │
    ▼
Success message
    │
    └─ Dashboard reloads
```

---

## 🗑️ DELETE FLOW

```
Click Delete Button
    │
    ▼
Show confirmation dialog
    │
    "Are you sure? This cannot be undone."
    │
    ├─ Cancel → Back to dashboard
    │
    └─ Confirm Delete
        │
        ▼
        DELETE /api/blog/{slug}
        │
        ▼
        MongoDB removes document
        │
        ▼
        Toast: "Blog deleted successfully"
        │
        └─ Dashboard list refreshes
```

---

## 🌐 PUBLIC BLOG PAGE FLOW

```
User visits /blog/{slug}
    │
    ├─ generateMetadata() runs server-side
    │   ├─ GET /api/blog/{slug}
    │   ├─ Extract SEO fields
    │   └─ Return meta tags
    │
    ▼
Page component renders
    │
    ├─ GET /api/blog/{slug} (fetch blog data)
    │
    ├─ Extract content HTML
    │
    ├─ Client component processes:
    │   ├─ Generate Table of Contents from headings
    │   ├─ Render HTML safely (dangerouslySetInnerHTML)
    │   ├─ Setup social share links
    │   ├─ Fetch related posts
    │   └─ Generate JSON-LD schema
    │
    ▼
User sees:
    │
    ├─ Cover image
    ├─ Title
    ├─ Author info
    ├─ Table of Contents (sticky sidebar)
    ├─ Full blog content
    ├─ Share buttons
    ├─ Author profile card
    ├─ Related posts
    └─ Breadcrumbs
```

---

## 📊 API RESPONSE FLOW

### Create Blog (POST)
```
CLIENT                          SERVER                     DATABASE
  │                              │                            │
  ├─ Prepare data               │                            │
  │                              │                            │
  ├─ POST /api/blog ────────────>│                            │
  │  { title, content, ... }    │                            │
  │                              ├─ Validate ✓               │
  │                              ├─ Sanitize HTML            │
  │                              ├─ Generate slug            │
  │                              ├─ Calculate readTime       │
  │                              │                            │
  │                              ├─ INSERT ─────────────────>│
  │                              │  new blog document        │
  │                              │                            │
  │                              │<─ _id ─────────────────────┤
  │                              │                            │
  │<─ { _id, slug, ... } ────────┤                            │
  │                              │                            │
  ├─ Update UI                   │                            │
  └─ Redirect to edit page       │                            │
```

---

## 🔍 SEARCH & FILTER FLOW

```
Dashboard Search
    │
    ├─ User types: "nextjs"
    │
    ├─ onChange triggered
    │
    ├─ Filter blogs in memory:
    │   ├─ title.includes("nextjs")
    │   ├─ author.includes("nextjs")
    │   └─ slug.includes("nextjs")
    │
    └─ Update table display

Dashboard Filter by Status
    │
    ├─ Select: "Published"
    │
    ├─ Filter blogs:
    │   └─ status === "published"
    │
    └─ Show only published blogs
```

---

## ✨ COMPLETE REQUEST/RESPONSE EXAMPLES

### GET All Blogs (Dashboard)
```bash
REQUEST:
GET /api/blog HTTP/1.1
Accept: application/json

RESPONSE:
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "title": "How to Learn Next.js 15",
    "slug": "how-to-learn-nextjs-15",
    "author": "John Doe",
    "status": "published",
    "readTime": "5 min read",
    "createdAt": "2026-01-24T10:30:00Z",
    "updatedAt": "2026-01-24T14:30:00Z",
    ...
  },
  { ... more blogs ... }
]
```

### POST Create Blog
```bash
REQUEST:
POST /api/blog HTTP/1.1
Content-Type: application/json

{
  "title": "How to Learn Next.js 15",
  "contentJSON": { "type": "doc", "content": [...] },
  "contentHTML": "<h1>How to Learn Next.js 15</h1>...",
  "excerpt": "Learn Next.js 15 with this complete guide",
  "author": "John Doe",
  "authorImage": "https://...",
  "coverImage": "https://...",
  "tags": ["nextjs", "tutorial"],
  "status": "draft"
}

RESPONSE:
201 Created
{
  "_id": "507f1f77bcf86cd799439011",
  "slug": "how-to-learn-nextjs-15",
  "status": "draft",
  "readTime": "5 min read",
  "createdAt": "2026-01-24T10:30:00Z",
  ...
}
```

### GET Single Blog (Detail Page)
```bash
REQUEST:
GET /api/blog/how-to-learn-nextjs-15 HTTP/1.1

RESPONSE:
200 OK
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "How to Learn Next.js 15",
  "slug": "how-to-learn-nextjs-15",
  "contentJSON": { ... },
  "contentHTML": "<h1>How to Learn...</h1><p>Content...</p>",
  "excerpt": "Learn Next.js 15...",
  "author": "John Doe",
  "authorImage": "https://...",
  "readTime": "5 min read",
  "metaTitle": "How to Learn Next.js 15 - Complete Guide",
  "metaDescription": "Learn Next.js 15 with this complete guide",
  "tags": ["nextjs", "tutorial"],
  "viewCount": 1234,
  ...
}
```

---

## 🎯 SUMMARY

✅ **Complete end-to-end blog system**  
✅ **Admin dashboard with CRUD**  
✅ **Public blog pages with SEO**  
✅ **Production-grade architecture**  
✅ **Scalable from one blog to thousands**  

**Status**: Ready for production 🚀

