# 🔌 Complete API Reference

Full REST API endpoint documentation for Xmarty Creator CMS.

---

## Table of Contents

- [Base URL & Authentication](#base-url--authentication)
- [Updates API](#updates-api)
- [Blog API](#blog-api)
- [Courses API](#courses-api)
- [Community API](#community-api)
- [Gallery API](#gallery-api)
- [Notifications API](#notifications-api)
- [Contacts API](#contacts-api)
- [Admins API](#admins-api)
- [Query Parameters](#query-parameters)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

---

## Base URL & Authentication

### Base URL

```
http://localhost:3001/api/v1          # Development
https://api.xmartycreator.com/api/v1  # Production
```

### Authentication

All endpoints (except public reads and contact form) require JWT token in header:

```
Authorization: Bearer <JWT_TOKEN>
```

### Getting a Token

```http
POST /api/v1/admins/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}

Response 200:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "admin": {
    "id": "64abc123def456",
    "name": "Admin Name",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

---

## Updates API

### 1. Get All Updates

```http
GET /updates?page=1&limit=20&status=published&sortBy=createdAt&order=desc

Query Parameters:
- page: number (default: 1)
- limit: number (default: 20, max: 100)
- status: 'draft' | 'published' (default: all)
- type: string (filter by type)
- search: string (full-text search)
- sortBy: 'createdAt' | 'views' | 'likes' (default: createdAt)
- order: 'asc' | 'desc' (default: desc)
- tags: comma-separated values

Response 200:
{
  "success": true,
  "data": [
    {
      "_id": "64abc123def456",
      "title": "New Update",
      "subtitle": "Subtitle",
      "content": "Full content here...",
      "type": "General",
      "isUrgent": false,
      "status": "published",
      "author": {
        "_id": "64xyz789",
        "name": "Admin Name"
      },
      "views": 150,
      "likes": 25,
      "tags": ["important", "news"],
      "cover_image": "https://...",
      "createdAt": "2026-01-23T10:00:00Z",
      "updatedAt": "2026-01-23T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### 2. Get Single Update

```http
GET /updates/:id

Response 200:
{
  "success": true,
  "data": {
    "_id": "64abc123def456",
    "title": "Update Title",
    "content": "Full content...",
    "author": {
      "_id": "64xyz789",
      "name": "Author Name",
      "email": "author@example.com"
    },
    "seo": {
      "title": "SEO Title",
      "description": "SEO Description",
      "keywords": ["tech", "news"]
    },
    "metadata": {
      "published_date": "2026-01-23T10:00:00Z",
      "visibility": "public"
    },
    "createdAt": "2026-01-23T10:00:00Z",
    "updatedAt": "2026-01-23T10:00:00Z"
  }
}
```

### 3. Get Trending Updates

```http
GET /updates/trending?limit=5

Response 200:
{
  "success": true,
  "data": [
    {
      "_id": "64abc123def456",
      "title": "Trending Update",
      "views": 1000,
      "likes": 250,
      // ... other fields
    }
  ]
}
```

### 4. Create Update (Admin)

```http
POST /updates
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "title": "New Update",
  "subtitle": "Short subtitle",
  "content": "Full rich text content here...",
  "type": "General",
  "isUrgent": false,
  "status": "draft",
  "tags": ["news", "important"],
  "cover_image": "https://...",
  "seo": {
    "title": "SEO Title",
    "description": "SEO Description",
    "keywords": ["key1", "key2"]
  }
}

Response 201:
{
  "success": true,
  "message": "Update created successfully",
  "data": {
    "_id": "64abc123def456",
    // ... full update object
  }
}

Response 400: Validation error
Response 401: Unauthorized
Response 403: Forbidden
```

### 5. Update Existing Update (Admin)

```http
PUT /updates/:id
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content...",
  "status": "published",
  // ... fields to update
}

Response 200:
{
  "success": true,
  "message": "Update modified successfully",
  "data": {
    "_id": "64abc123def456",
    // ... updated object
  }
}
```

### 6. Delete Update (Admin)

```http
DELETE /updates/:id
Authorization: Bearer <TOKEN>

Response 200:
{
  "success": true,
  "message": "Update deleted successfully"
}

Response 404: Not found
Response 403: Forbidden
```

### 7. Like Update

```http
POST /updates/:id/like
Authorization: Bearer <TOKEN>

Response 200:
{
  "success": true,
  "message": "Update liked",
  "likes": 26
}
```

### 8. Record View

```http
POST /updates/:id/view

Response 200:
{
  "success": true,
  "views": 151
}
```

---

## Blog API

### 1. Get All Blog Posts

```http
GET /blog?page=1&limit=20&category=tech&featured=true

Query Parameters:
- page, limit, sortBy, order (same as updates)
- search: string
- category: string
- featured: boolean
- status: 'draft' | 'published' | 'archived'
- tags: comma-separated

Response 200:
{
  "success": true,
  "data": [
    {
      "_id": "64abc123def456",
      "title": "Blog Post Title",
      "slug": "blog-post-title",
      "excerpt": "Short excerpt...",
      "author": {
        "_id": "64xyz789",
        "name": "Author"
      },
      "category": "tech",
      "featured": true,
      "views": 500,
      "reading_time": 5,
      "cover_image": "https://...",
      "status": "published",
      "createdAt": "2026-01-23T10:00:00Z",
      "publishedAt": "2026-01-23T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

### 2. Get Post by Slug

```http
GET /blog/:slug

Response 200:
{
  "success": true,
  "data": {
    "_id": "64abc123def456",
    "title": "Blog Post",
    "content": "Full rich text content...",
    "author": {
      "_id": "64xyz789",
      "name": "Author",
      "bio": "Author bio",
      "avatar": "https://..."
    },
    "seo": {
      "title": "SEO Title",
      "description": "Description",
      "og_image": "https://..."
    },
    "comments_count": 12,
    // ... full post
  }
}
```

### 3. Get Featured Posts

```http
GET /blog/featured?limit=5

Response 200:
{
  "success": true,
  "data": [ ... array of featured posts ... ]
}
```

### 4. Get Posts by Category

```http
GET /blog/by-category/:category?page=1&limit=20

Response 200:
{
  "success": true,
  "data": [ ... posts in category ... ],
  "pagination": { ... }
}
```

### 5. Create Blog Post

```http
POST /blog
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "title": "New Blog Post",
  "excerpt": "Short excerpt",
  "content": "Full content...",
  "category": "tech",
  "tags": ["javascript", "tutorial"],
  "featured": false,
  "status": "draft",
  "cover_image": "https://...",
  "seo": { ... }
}

Response 201:
{
  "success": true,
  "message": "Blog post created",
  "data": { ... full post object ... }
}
```

### 6. Update Blog Post

```http
PUT /blog/:id
Authorization: Bearer <TOKEN>

// Same fields as create
Response 200:
{
  "success": true,
  "message": "Blog post updated",
  "data": { ... }
}
```

### 7. Delete Blog Post

```http
DELETE /blog/:id
Authorization: Bearer <TOKEN>

Response 200:
{
  "success": true,
  "message": "Blog post deleted"
}
```

### 8. Get Comments

```http
GET /blog/:id/comments?page=1&limit=10

Response 200:
{
  "success": true,
  "data": [
    {
      "_id": "comment_id",
      "author": { ... },
      "content": "Comment text",
      "createdAt": "2026-01-23T10:00:00Z"
    }
  ]
}
```

### 9. Add Comment

```http
POST /blog/:id/comments
Authorization: Bearer <TOKEN>

{
  "content": "Great article!"
}

Response 201:
{
  "success": true,
  "message": "Comment added",
  "data": { ... comment object ... }
}
```

---

## Courses API

### 1. Get All Courses

```http
GET /courses?page=1&level=Beginner&category=programming

Query Parameters:
- page, limit, sortBy, order
- search: string
- category: string
- level: 'Beginner' | 'Intermediate' | 'Advanced'
- featured: boolean
- status: 'draft' | 'published' | 'archived'

Response 200:
{
  "success": true,
  "data": [
    {
      "_id": "64abc123def456",
      "title": "Course Title",
      "slug": "course-title",
      "description": "Course description",
      "level": "Beginner",
      "price": 99.99,
      "currency": "USD",
      "duration": 20,
      "students_enrolled": 150,
      "rating": 4.5,
      "thumbnail": "https://...",
      "featured": true,
      "createdAt": "2026-01-23T10:00:00Z"
    }
  ]
}
```

### 2. Get Course Details

```http
GET /courses/:slug

Response 200:
{
  "success": true,
  "data": {
    "_id": "64abc123def456",
    "title": "Course Title",
    "content": "Full course description",
    "instructor": {
      "_id": "instructor_id",
      "name": "Instructor Name",
      "bio": "Bio"
    },
    "modules": [
      {
        "_id": "module_id",
        "title": "Module 1",
        "lessons": 5,
        "duration": 120,
        "content": "Module content"
      }
    ],
    "requirements": ["Req 1", "Req 2"],
    "learnings": ["Learn 1", "Learn 2"],
    "price": 99.99,
    "featured": true,
    "rating": 4.5,
    "reviews_count": 32,
    // ... full course
  }
}
```

### 3. Get Courses by Level

```http
GET /courses/by-level/:level?page=1

Response 200:
{
  "success": true,
  "data": [ ... courses of that level ... ]
}
```

### 4. Get Trending Courses

```http
GET /courses/trending?limit=5

Response 200:
{
  "success": true,
  "data": [ ... top courses by students/rating ... ]
}
```

### 5. Create Course

```http
POST /courses
Authorization: Bearer <TOKEN>

{
  "title": "New Course",
  "description": "Course description",
  "content": "Full content",
  "category": "programming",
  "level": "Beginner",
  "price": 99.99,
  "currency": "USD",
  "duration": 20,
  "modules": [
    {
      "title": "Module 1",
      "lessons": 5,
      "duration": 120,
      "content": "Module content"
    }
  ],
  "requirements": ["Requirement 1"],
  "learnings": ["Learning outcome 1"],
  "tags": ["python", "beginner"],
  "featured": false,
  "status": "draft"
}

Response 201: Course created
```

### 6. Update Course

```http
PUT /courses/:id
Authorization: Bearer <TOKEN>

// Same fields as create
Response 200: Course updated
```

### 7. Delete Course

```http
DELETE /courses/:id
Authorization: Bearer <TOKEN>

Response 200: Course deleted
```

### 8. Enroll Student

```http
POST /courses/:id/enroll
Authorization: Bearer <TOKEN>

Response 200:
{
  "success": true,
  "message": "Successfully enrolled",
  "students_enrolled": 151
}
```

### 9. Get Course Modules

```http
GET /courses/:id/modules

Response 200:
{
  "success": true,
  "data": [
    {
      "_id": "module_id",
      "title": "Module 1",
      "lessons": 5,
      "duration": 120
    }
  ]
}
```

---

## Community API

### 1. Get All Communities

```http
GET /community?page=1&type=forum&category=tech

Query Parameters:
- page, limit, sortBy, order
- search: string
- type: 'forum' | 'discussion' | 'group' | 'event'
- category: string
- featured: boolean
- status: 'active' | 'inactive' | 'archived'

Response 200:
{
  "success": true,
  "data": [
    {
      "_id": "community_id",
      "title": "Community Title",
      "slug": "community-title",
      "type": "forum",
      "description": "Description",
      "member_count": 250,
      "post_count": 150,
      "featured": true,
      "status": "active",
      "thumbnail": "https://..."
    }
  ]
}
```

### 2. Get Community Details

```http
GET /community/:slug

Response 200:
{
  "success": true,
  "data": {
    "_id": "community_id",
    "title": "Community",
    "content": "Full description",
    "creator": { ... },
    "members": [ ... ],
    "moderators": [ ... ],
    "member_count": 250,
    "post_count": 150,
    "rules": "Community rules",
    "metadata": {
      "last_activity": "2026-01-23T10:00:00Z",
      "trending_topics": ["topic1", "topic2"]
    }
  }
}
```

### 3. Create Community

```http
POST /community
Authorization: Bearer <TOKEN>

{
  "title": "New Community",
  "description": "Description",
  "type": "forum",
  "category": "tech",
  "rules": "Community rules",
  "tags": ["tech", "learning"]
}

Response 201: Community created
```

### 4. Update Community

```http
PUT /community/:id
Authorization: Bearer <TOKEN>

Response 200: Community updated
```

### 5. Delete Community

```http
DELETE /community/:id
Authorization: Bearer <TOKEN>

Response 200: Community deleted
```

### 6. Join Community

```http
POST /community/:id/join
Authorization: Bearer <TOKEN>

Response 200:
{
  "success": true,
  "message": "Joined community",
  "member_count": 251
}
```

### 7. Leave Community

```http
POST /community/:id/leave
Authorization: Bearer <TOKEN>

Response 200:
{
  "success": true,
  "message": "Left community",
  "member_count": 250
}
```

### 8. Get Members

```http
GET /community/:id/members?page=1&limit=20

Response 200:
{
  "success": true,
  "data": [ ... list of members ... ]
}
```

### 9. Get Community Posts

```http
GET /community/:id/posts?page=1&limit=20

Response 200:
{
  "success": true,
  "data": [ ... community posts ... ]
}
```

---

## Gallery API

### 1. Get All Galleries

```http
GET /gallery?page=1&category=photography

Query Parameters:
- page, limit
- search: string
- category: string
- featured: boolean
- access: 'public' | 'private' | 'members_only'

Response 200:
{
  "success": true,
  "data": [
    {
      "_id": "gallery_id",
      "title": "Gallery Title",
      "description": "Description",
      "album_count": 50,
      "featured": true,
      "access": "public",
      "cover_image": "https://..."
    }
  ]
}
```

### 2. Get Gallery Details

```http
GET /gallery/:id

Response 200:
{
  "success": true,
  "data": {
    "_id": "gallery_id",
    "title": "Gallery",
    "description": "Full description",
    "images": [
      {
        "_id": "image_id",
        "url": "https://...",
        "alt_text": "Image description",
        "caption": "Caption",
        "width": 800,
        "height": 600
      }
    ],
    "category": "photography",
    "tags": ["nature", "landscape"],
    "album_count": 50
  }
}
```

### 3. Create Gallery

```http
POST /gallery
Authorization: Bearer <TOKEN>

{
  "title": "New Gallery",
  "description": "Gallery description",
  "category": "photography",
  "tags": ["nature", "landscape"],
  "access": "public"
}

Response 201: Gallery created
```

### 4. Update Gallery

```http
PUT /gallery/:id
Authorization: Bearer <TOKEN>

Response 200: Gallery updated
```

### 5. Delete Gallery

```http
DELETE /gallery/:id
Authorization: Bearer <TOKEN>

Response 200: Gallery deleted
```

### 6. Upload Images

```http
POST /gallery/:id/images
Authorization: Bearer <TOKEN>
Content-Type: multipart/form-data

FormData:
- images: File[] (multiple images)
- alt_text: string (for each image)
- captions: string[] (optional)

Response 201:
{
  "success": true,
  "message": "Images uploaded",
  "data": [ ... uploaded images ... ]
}
```

### 7. Get Gallery Images

```http
GET /gallery/:id/images?page=1

Response 200:
{
  "success": true,
  "data": [ ... images in gallery ... ]
}
```

### 8. Delete Image

```http
DELETE /gallery/:id/images/:imageId
Authorization: Bearer <TOKEN>

Response 200: Image deleted
```

---

## Notifications API

### 1. Get Notifications

```http
GET /notifications?page=1&unread=true

Query Parameters:
- page, limit
- unread: boolean
- type: 'info' | 'warning' | 'error' | 'success'
- priority: 'low' | 'medium' | 'high'

Response 200:
{
  "success": true,
  "data": [
    {
      "_id": "notification_id",
      "title": "Notification",
      "message": "Notification message",
      "type": "info",
      "priority": "high",
      "action_url": "https://...",
      "read": false,
      "createdAt": "2026-01-23T10:00:00Z"
    }
  ]
}
```

### 2. Get Unread Count

```http
GET /notifications/unread

Response 200:
{
  "success": true,
  "unread_count": 5
}
```

### 3. Create Notification

```http
POST /notifications
Authorization: Bearer <TOKEN>

{
  "title": "Notification",
  "message": "Notification message",
  "type": "info",
  "priority": "medium",
  "recipients": ["user_id_1", "user_id_2"],
  "action_url": "https://...",
  "status": "draft",
  "scheduled_for": "2026-01-25T10:00:00Z"
}

Response 201: Notification created
```

### 4. Mark as Read

```http
PUT /notifications/:id/read
Authorization: Bearer <TOKEN>

Response 200:
{
  "success": true,
  "message": "Marked as read"
}
```

### 5. Delete Notification

```http
DELETE /notifications/:id
Authorization: Bearer <TOKEN>

Response 200: Notification deleted
```

### 6. Send to All Users

```http
POST /notifications/send-all
Authorization: Bearer <TOKEN>

{
  "title": "System Announcement",
  "message": "Message for all users",
  "type": "info",
  "priority": "high"
}

Response 200: Notification sent to all
```

---

## Contacts API

### 1. Get Submissions (Admin)

```http
GET /contacts?page=1&status=new&category=support

Query Parameters:
- page, limit
- status: 'new' | 'read' | 'replied' | 'closed'
- category: string
- priority: 'low' | 'medium' | 'high'

Response 200:
{
  "success": true,
  "data": [
    {
      "_id": "contact_id",
      "name": "Sender Name",
      "email": "sender@example.com",
      "subject": "Contact Subject",
      "category": "support",
      "priority": "medium",
      "status": "new",
      "createdAt": "2026-01-23T10:00:00Z"
    }
  ]
}
```

### 2. Get Submission Details

```http
GET /contacts/:id

Response 200:
{
  "success": true,
  "data": {
    "_id": "contact_id",
    "name": "Name",
    "email": "email@example.com",
    "phone": "1234567890",
    "subject": "Subject",
    "message": "Full message",
    "category": "support",
    "priority": "medium",
    "status": "new",
    "assigned_to": "admin_id",
    "reply": "Reply message (if replied)",
    "attachments": [ ... ]
  }
}
```

### 3. Submit Contact Form (Public)

```http
POST /contacts
Content-Type: application/json

{
  "name": "Your Name",
  "email": "your@email.com",
  "phone": "1234567890",
  "subject": "Contact Subject",
  "message": "Your message here",
  "category": "general"
}

Response 201:
{
  "success": true,
  "message": "Thank you for contacting us",
  "data": {
    "_id": "contact_id",
    // ... submission data
  }
}
```

### 4. Update Submission

```http
PUT /contacts/:id
Authorization: Bearer <TOKEN>

{
  "status": "read",
  "priority": "high",
  "assigned_to": "admin_id"
}

Response 200: Submission updated
```

### 5. Send Reply

```http
POST /contacts/:id/reply
Authorization: Bearer <TOKEN>

{
  "reply": "Thank you for contacting us..."
}

Response 200:
{
  "success": true,
  "message": "Reply sent"
}
```

### 6. Delete Submission

```http
DELETE /contacts/:id
Authorization: Bearer <TOKEN>

Response 200: Submission deleted
```

### 7. Get Statistics

```http
GET /contacts/stats

Response 200:
{
  "success": true,
  "data": {
    "total": 150,
    "new": 12,
    "read": 45,
    "replied": 85,
    "closed": 8,
    "by_category": { ... },
    "by_priority": { ... }
  }
}
```

---

## Admins API

### 1. Get All Admins

```http
GET /admins?page=1&role=admin&status=active
Authorization: Bearer <TOKEN> (super_admin only)

Response 200:
{
  "success": true,
  "data": [
    {
      "_id": "admin_id",
      "name": "Admin Name",
      "email": "admin@example.com",
      "role": "admin",
      "status": "active",
      "createdAt": "2026-01-23T10:00:00Z"
    }
  ]
}
```

### 2. Get Admin Details

```http
GET /admins/:id
Authorization: Bearer <TOKEN>

Response 200:
{
  "success": true,
  "data": {
    "_id": "admin_id",
    "name": "Admin Name",
    "email": "admin@example.com",
    "phone": "1234567890",
    "role": "admin",
    "permissions": [ ... ],
    "departments": [ ... ],
    "status": "active",
    "profile": { ... },
    "last_login": "2026-01-23T10:00:00Z"
  }
}
```

### 3. Create Admin

```http
POST /admins
Authorization: Bearer <TOKEN> (super_admin only)

{
  "name": "New Admin",
  "email": "newadmin@example.com",
  "password": "SecurePassword123!",
  "phone": "1234567890",
  "role": "admin",
  "permissions": ["create_updates", "edit_blog"],
  "departments": ["content", "marketing"]
}

Response 201: Admin created
```

### 4. Update Admin

```http
PUT /admins/:id
Authorization: Bearer <TOKEN>

{
  "name": "Updated Name",
  "phone": "9876543210",
  "role": "editor",
  "permissions": [ ... ]
}

Response 200: Admin updated
```

### 5. Delete Admin

```http
DELETE /admins/:id
Authorization: Bearer <TOKEN> (super_admin only)

Response 200: Admin deleted
```

### 6. Admin Login

```http
POST /admins/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "SecurePassword123!"
}

Response 200:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "admin": {
    "_id": "admin_id",
    "name": "Admin Name",
    "email": "admin@example.com",
    "role": "admin"
  }
}

Response 401: Invalid credentials
```

### 7. Admin Logout

```http
POST /admins/logout
Authorization: Bearer <TOKEN>

Response 200:
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 8. Get Permissions

```http
GET /admins/permissions
Authorization: Bearer <TOKEN>

Response 200:
{
  "success": true,
  "data": {
    "create_updates": "Create updates",
    "edit_updates": "Edit updates",
    "delete_updates": "Delete updates",
    // ... all permissions
  }
}
```

---

## Query Parameters

### Standard Query Parameters (All List Endpoints)

```
page          : number (default: 1)              # Page number for pagination
limit         : number (default: 20, max: 100)  # Items per page
search        : string                           # Full-text search
sortBy        : string (depends on collection)  # Sort field
order         : 'asc' | 'desc' (default: desc)  # Sort direction
```

### Pagination Example

```http
GET /updates?page=2&limit=50

Response includes:
{
  "pagination": {
    "page": 2,
    "limit": 50,
    "total": 500,
    "pages": 10,
    "hasNext": true,
    "hasPrev": true
  }
}
```

### Filtering Examples

```http
# Filter by status
GET /blog?status=published

# Filter by multiple fields
GET /courses?category=programming&level=Beginner

# Search text
GET /blog?search=javascript

# Filter by date range
GET /updates?fromDate=2026-01-01&toDate=2026-01-31
```

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Resource data here
  },
  "message": "Operation successful"
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": "Error type",
  "message": "Human readable error message",
  "details": {
    // Validation errors (if applicable)
  }
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

### Error Examples

```json
// Validation Error
{
  "success": false,
  "error": "Validation Error",
  "message": "Request validation failed",
  "details": {
    "title": "Title is required",
    "content": "Content must be at least 20 characters"
  }
}

// Not Found
{
  "success": false,
  "error": "Not Found",
  "message": "Update with ID 64abc123def456 not found"
}

// Unauthorized
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

---

## Rate Limiting

### Rate Limits

- **Public endpoints**: 100 requests per 15 minutes
- **Authenticated endpoints**: 1000 requests per 15 minutes
- **Upload endpoints**: 50 requests per hour

### Rate Limit Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1674489000
```

### Rate Limit Error

```json
{
  "success": false,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Retry after 60 seconds",
  "retryAfter": 60
}
```

---

## Examples

### Example 1: Create an Update and Publish It

```bash
# 1. Login
curl -X POST http://localhost:3001/api/v1/admins/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# Response includes token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 2. Create update (draft)
curl -X POST http://localhost:3001/api/v1/updates \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New System Update",
    "content": "We have released a new feature...",
    "type": "System",
    "isUrgent": true,
    "status": "draft"
  }'

# Response: Update created with _id: 64abc123def456

# 3. Publish update
curl -X PUT http://localhost:3001/api/v1/updates/64abc123def456 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"status": "published"}'
```

### Example 2: Search and Filter Blog Posts

```bash
# Get published tech posts, sorted by views (descending)
curl "http://localhost:3001/api/v1/blog?category=tech&status=published&sortBy=views&order=desc&limit=10"

# Get featured posts
curl "http://localhost:3001/api/v1/blog?featured=true&limit=5"

# Search blog posts
curl "http://localhost:3001/api/v1/blog?search=javascript&limit=20"
```

### Example 3: Enroll in a Course

```bash
curl -X POST http://localhost:3001/api/v1/courses/:courseId/enroll \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

---

**Last Updated**: January 2026  
**API Version**: 1.0
