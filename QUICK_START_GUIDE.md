# Developer Quick Reference

## 🚀 First-Time Setup (5 min)

```bash
# 1. Install packages
npm install

# 2. Create .env.local
cat > .env.local << EOF
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/yourdb
NEXT_PUBLIC_URL=https://yourdomain.com
NEXT_PUBLIC_SITE_NAME=Your Site
EOF

# 3. Run dev server
npm run dev

# 4. Create first blog
# Go to: http://localhost:9002/admin/blog/new
```

---

## 📝 Creating a Blog (Admin)

1. **Navigate**: `http://localhost:9002/admin/blog`
2. **Click**: "New Blog" button
3. **Fill in**:
   - Title (auto-generates slug)
   - Author name
   - Content in rich editor
4. **Click**: "Save Draft" or "Publish"
5. **View**: `/blog/[slug]`

---

## 🔗 Main URLs

| Page | URL | Purpose |
|------|-----|---------|
| Blog Home | `/blog` | List all posts, searchable, filterable |
| Blog Post | `/blog/my-post-slug` | Single post with TOC &related posts |
| Admin List | `/admin/blog` | Manage all blogs (edit/delete) |
| Edit/New | `/admin/blog/new` or `/admin/blog/slug/edit` | Rich editor |
| Sitemap | `/sitemap.xml` | For Google |
| RSS Feed | `/api/feed` | For subscribers |
| Robots | `/robots.txt` | Crawler rules |

---

## ⚙️ API Endpoints Reference

### List Blogs
```bash
GET /api/blog?page=1&limit=10&status=published&sortBy=newest
# Response: { posts: [], total, page, pages, hasNext, hasPrev }
```

### Create Blog
```bash
POST /api/blog
{
  "title": "My Blog",
  "slug": "my-blog",
  "content": { ... TipTap JSON },
  "htmlContent": "<p>...</p>",
  "excerpt": "Summary",
  "author": "Name",
  "tags": ["nextjs"],
  "status": "published"
}
```

### Get Single Blog
```bash
GET /api/blog/my-blog-slug
# Increments views automatically
```

### Update Blog
```bash
PUT /api/blog/my-blog-slug
{ ...same fields as POST }
```

### Delete Blog
```bash
DELETE /api/blog/my-blog-slug
```

### Get Related Posts
```bash
GET /api/blog/related?slug=my-blog&limit=3
```

### Get RSS Feed
```bash
GET /api/feed
# Returns XML feed with 50 latest posts
```

---

## 🧠 Key Utility Functions

### Read Time Calculation
```typescript
import { calculateReadTime, extractPlainText } from '@/lib/blog-utils';

const plainText = extractPlainText(tiptapJSON);
const readTime = calculateReadTime(plainText);
// Returns: "5 min read" or "Less than 1 min"
```

### Slug Generation
```typescript
import { generateSlug, isValidSlug } from '@/lib/blog-utils';

const slug = generateSlug("My Blog Title");
// Returns: "my-blog-title"
```

### Excerpt Generation
```typescript
import { generateExcerpt } from '@/lib/blog-utils';

const excerpt = generateExcerpt(htmlContent, 160);
// Returns: First 160 chars with "..." if needed
```

### Table of Contents
```typescript
import { generateTableOfContents } from '@/lib/blog-utils';

const toc = generateTableOfContents(tiptapJSON);
// Returns: [{ id: "heading-0", level: 1, text: "Title" }, ...]
```

### SEO Validation
```typescript
import { validateSEOBestPractices } from '@/lib/seo-utils';

const { score, warnings } = validateSEOBestPractices(blog);
// score: 0-100
// warnings: [...SEO issues]
```

---

## 📊 TipTap Editor Usage

### In Your Component
```typescript
import { TipTapEditor } from '@/components/rich-editor/tiptap-editor';

<TipTapEditor
  initialContent={blog.content}
  onChange={(json, html) => {
    setBlog({...blog, content: json, htmlContent: html})
  }}
  editable={true}
/>
```

### Output Format
```typescript
// JSON format (stored in DB)
{
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Title' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Text...' }] },
  ]
}

// HTML format (rendered)
<h1>Title</h1>
<p>Text...</p>
```

---

## 🎨 Customizing UI

### Blog Card Component
Located in: `src/app/blog/page.tsx`
```tsx
<Card className="hover:shadow-2xl">
  <Image src={blog.coverImage.url} />
  <CardTitle>{blog.title}</CardTitle>
  <CardDescription>{blog.excerpt}</CardDescription>
  <Button>Read More</Button>
</Card>
```

### Related Posts
Located in: `src/app/blog/[slug]/page.tsx`
```tsx
{relatedBlogs.map(post => (
  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
))}
```

---

## 🔍 Database Queries

### Find Published Blogs
```javascript
db.blogs.find({ status: 'published' })
```

### Find by Tags
```javascript
db.blogs.find({ tags: { $in: ['nextjs'] } })
```

### Search
```javascript
db.blogs.find({
  $or: [
    { title: /search/i },
    { excerpt: /search/i }
  ]
})
```

### Most Viewed
```javascript
db.blogs.find({ status: 'published' }).sort({ views: -1 })
```

---

## 🧪 Testing Your Blog

### Manual Testing Checklist
```
Blog Creation:
  ☐ Create blog with all fields
  ☐ Auto-slug generation works
  ☐ Cover image displays
  ☐ Read time calculates
  ☐ Status toggles between draft/published

Blog Display:
  ☐ Blog listing page loads
  ☐ Pagination works
  ☐ Search filters results
  ☐ Tag filtering works
  ☐ Blog detail page displays
  ☐ Table of contents shows
  ☐ Related posts appear
  ☐ Social share buttons work

Admin:
  ☐ Admin dashboard loads
  ☐ Can edit blog
  ☐ Can delete with confirmation
  ☐ Can toggle status
  ☐ Can view blog

SEO:
  ☐ Sitemap.xml valid
  ☐ Meta tags present
  ☐ JSON-LD correct
  ☐ Breadcrumbs work
  ☐ No 404 links
```

---

## 🐛 Debugging Tips

### Check MongoDB Connection
```typescript
// In any API route
const client = await clientPromise;
console.log('DB connected:', !!client);
```

### Log Blog Object
```typescript
console.log('Blog:', JSON.stringify(blog, null, 2));
```

### Test TipTap Output
```typescript
const handleContentChange = (content, html) => {
  console.log('JSON:', content);
  console.log('HTML:', html);
}
```

### Check SEO Score
```typescript
const seo = validateSEOBestPractices(blog);
console.log('SEO Score:', seo.score);
console.log('Warnings:', seo.warnings);
```

---

## 📦 Adding Features

### Add Comments
1. Create new collection: `comments`
2. Schema: `{ blogId, author, text, createdAt }`
3. API route: `GET/POST /api/blog/[slug]/comments`
4. Component: Show in blog detail

### Add Reactions/Likes
```typescript
// Update blog likes
PUT /api/blog/[slug]
{ $inc: { likes: 1 } }

// Display
<button onClick={() => likeBlog(slug)}>
  👍 {blog.likes}
</button>
```

### Add Subscribe to Tag
```typescript
// Create newsletter collection
// API: POST /api/subscribe
{ email, tags }
```

---

## 🚢 Deployment

### Environment Variables
```env
MONGODB_URI=mongodb+srv://...
NEXT_PUBLIC_URL=https://yourdomain.com
NEXT_PUBLIC_SITE_NAME=Your Site
```

### Build Command
```bash
npm run build
```

### Start Command
```bash
npm start
```

### Platforms
- **Vercel**: `next.config.ts` already optimized
- **Railway**: Simple env setup
- **Render**: Deploy from GitHub
- **AWS**: Use Amplify or EC2

---

## 📚 File Locations

| File | Purpose |
|------|---------|
| `src/lib/blog-utils.ts` | Core utilities (30+ functions) |
| `src/lib/seo-utils.ts` | SEO schemas & metadata |
| `src/lib/models/blog.ts` | Mongoose schema |
| `src/types/blog.ts` | TypeScript types |
| `src/components/rich-editor/tiptap-editor.tsx` | Editor component |
| `src/app/blog/page.tsx` | Blog listing page |
| `src/app/blog/[slug]/page.tsx` | Blog detail page |
| `src/app/admin/blog/page.tsx` | Admin dashboard |
| `src/app/admin/blog/[...slug]/page.tsx` | Blog editor |
| `src/app/api/blog/route.ts` | List & create |
| `src/app/api/blog/[slug]/route.ts` | Read, update, delete |
| `src/app/robots.ts` | Robots.txt |
| `src/app/sitemap.ts` | Sitemap.xml |

---

## 🎯 Performance Tips

### For Fast Loading
```typescript
// Use ISR for blog detail
export const revalidate = 3600; // 1 hour

// Use lean() for read-only queries
Blog.find().lean().exec();

// Lazy load editor (admin only)
const TipTapEditor = dynamic(() => 
  import('@/components/rich-editor/tiptap-editor')
);
```

### Database Optimization
```javascript
// Indexes created automatically, but verify:
db.blogs.getIndexes()

// Should have:
// { status: 1, publishedAt: -1 }
// { tags: 1, status: 1 }
// { slug: 1 }
```

---

## 💬 Common Questions

**Q: Can I add comments?**
A: Yes, create a `comments` collection and new API routes

**Q: How to moderate blogs?**
A: Add `moderationStatus` field to schema, check in queries

**Q: Multi-author support?**
A: Add `authorId` field, add author permissions in API

**Q: Blog preview before publish?**
A: Already supported! Draft status = preview only

**Q: How to backup blogs?**
A: MongoDB Atlas has built-in backups

**Q: Can I import from other platforms?**
A: Create migration script reading old format, insert into new

---

## 🎓 Learning Resources

- TipTap Docs: https://tiptap.dev
- Next.js App Router: https://nextjs.org/docs/app
- Mongoose: https://mongoosejs.com
- SEO Guide: https://developers.google.com/search
- TypeScript: https://www.typescriptlang.org/docs

---

**Everything is ready to go! Start writing amazing blogs. 🚀**
