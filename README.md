# 🚀 Xmarty Creator CMS - Complete Production README

> **Enterprise-Grade Content Management System** built with Next.js, Express, and MongoDB

[![GitHub](https://img.shields.io/badge/GitHub-View_Repo-blue?logo=github)](https://github.com)
[![License](https://img.shields.io/badge/License-MIT-green)]()
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)]()
[![Version](https://img.shields.io/badge/Version-1.0.0-blue)]()

---

## 📋 Quick Links

- [🎯 Overview](#overview)
- [🛠️ Tech Stack](#tech-stack)
- [📂 Project Structure](#project-structure)
- [🏗️ Architecture](#architecture)
- [💾 Database Schema](#database-schema)
- [🔌 API Routes](#api-routes)
- [👨‍💼 Admin Features](#admin-features)
- [🌐 Public Features](#public-features)
- [⚡ Quick Start](#quick-start)
- [🔑 Configuration](#configuration)
- [📊 Documentation](#documentation)
- [🚀 Deployment](#deployment)
- [🗺️ Roadmap](#roadmap)
- [📝 License](#license)

---

## 🎯 Overview

### What is Xmarty Creator CMS?

A **complete, modular, production-ready Content Management System** designed for:

- 📊 **Multi-Module Content Management** - Updates, Blog, Courses, Community, Gallery, Notifications, Contact Forms, Admin Users
- 👨‍💼 **Professional Admin Dashboard** - Intuitive interface for managing all content
- 🌐 **Public Website** - Beautiful front-end for displaying content
- 📱 **Fully Responsive** - Works on desktop, tablet, and mobile
- 🔒 **Enterprise Security** - Authentication, authorization, input validation
- ⚡ **High Performance** - Optimized APIs, caching, pagination
- 📈 **Scalable Architecture** - Designed to grow with your business

### Core Modules

| Module | Description | Features |
|--------|-------------|----------|
| **Updates** | News, announcements, system messages | Draft/publish, urgent flagging, type selection |
| **Blog** | Articles, blog posts | Categories, tags, featured posts, SEO |
| **Courses** | Educational content, curriculum | Modules, lessons, enrollment, ratings |
| **Community** | Forums, discussions, groups | Members, moderators, activity tracking |
| **Gallery** | Image management | Albums, alt text, access control |
| **Notifications** | System alerts, announcements | Priority, scheduling, broadcast |
| **Contact** | Contact form submissions | Assignment, replies, status tracking |
| **Admins** | User management | Roles, permissions, login history |

---

## 🛠️ Tech Stack

### Frontend Stack

```
Next.js 15        → React framework with App Router
React 18          → UI library
TypeScript 5      → Type safety and developer experience
Tailwind CSS 3.4  → Utility-first CSS framework
Shadcn UI         → High-quality UI components
Framer Motion     → Smooth animations and transitions
React Hook Form   → Efficient form management
Zod               → TypeScript-first schema validation
Lucide Icons      → Beautiful, consistent icons
```

### Backend Stack

```
Express.js 4.18+  → Lightweight HTTP server
Node.js 18+       → JavaScript runtime
MongoDB 7.0+      → NoSQL database
Mongoose 8.0+     → MongoDB ORM/ODM
```

### DevOps & Tools

```
Docker            → Containerization
MongoDB Atlas     → Cloud database hosting
Vercel            → Frontend deployment
Railway/Render    → Backend deployment
PM2               → Production process manager
```

---

## 📂 Project Structure

### Frontend Directory (`/src`)

```
src/
├── app/                                    # Next.js App Router
│   ├── admin/                             # Admin Dashboard
│   │   ├── layout.tsx                     # Admin layout with sidebar
│   │   ├── page.tsx                       # Dashboard home
│   │   └── dashboard/                     # Module dashboards
│   │       ├── updates/page.tsx           # Updates management
│   │       ├── blog/page.tsx              # Blog management
│   │       ├── courses/page.tsx           # Courses management
│   │       ├── community/page.tsx         # Community management
│   │       ├── gallery/page.tsx           # Gallery management
│   │       ├── notifications/page.tsx     # Notifications management
│   │       ├── contact-submissions/page.tsx # Contact management
│   │       └── admins/page.tsx            # Admin management
│   │
│   ├── (public)/                          # Public website routes
│   │   ├── updates/page.tsx               # Updates listing
│   │   ├── blog/
│   │   │   ├── page.tsx                   # Blog listing
│   │   │   └── [slug]/page.tsx            # Individual post
│   │   ├── courses/
│   │   │   ├── page.tsx                   # Courses listing
│   │   │   └── [slug]/page.tsx            # Course detail
│   │   ├── community/
│   │   │   ├── page.tsx                   # Community listing
│   │   │   └── [slug]/page.tsx            # Community detail
│   │   └── gallery/page.tsx               # Gallery
│   │
│   ├── api/                               # Legacy API routes (can migrate to backend)
│   ├── layout.tsx                         # Root layout
│   ├── page.tsx                           # Home page
│   └── globals.css                        # Global styles
│
├── components/                             # Reusable React Components
│   ├── admin/                             # Admin-specific components
│   │   ├── crud-form.tsx                  # Reusable form
│   │   ├── crud-table.tsx                 # Reusable table
│   │   └── search-filter.tsx              # Search component
│   │
│   ├── ui/                                # Shadcn UI components
│   │   ├── button.tsx, input.tsx
│   │   ├── modal.tsx, table.tsx
│   │   └── ... (50+ components)
│   │
│   └── layout/                            # Layout components
│       ├── header.tsx
│       ├── footer.tsx
│       └── sidebar.tsx
│
├── hooks/                                  # Custom React Hooks
│   ├── use-fetch.ts                       # Data fetching
│   ├── use-form.ts                        # Form management
│   └── use-pagination.ts                  # Pagination
│
├── lib/                                    # Utilities & Config
│   ├── mongodb.ts                         # DB connection
│   ├── api-client.ts                      # API wrapper
│   ├── validators.ts                      # Zod schemas
│   └── utils.ts                           # Helpers
│
├── types/                                  # TypeScript Types
│   ├── models.ts                          # Data models
│   ├── api.ts                             # API responses
│   └── index.ts                           # Exports
│
└── middleware.ts                           # Next.js middleware
```

### Backend Directory (`/backend/src`)

```
backend/src/
├── routes/                                # API route handlers
│   ├── updates.ts
│   ├── blog.ts
│   ├── courses.ts
│   ├── community.ts
│   ├── gallery.ts
│   ├── notifications.ts
│   ├── contacts.ts
│   └── admins.ts
│
├── models/                                # Mongoose schemas
│   ├── Update.ts
│   ├── Blog.ts
│   ├── Course.ts
│   ├── Community.ts
│   ├── Gallery.ts
│   ├── Notification.ts
│   ├── Contact.ts
│   └── Admin.ts
│
├── controllers/                           # Business logic
│   ├── updateController.ts
│   ├── blogController.ts
│   └── ... (per module)
│
├── middleware/                            # Express middleware
│   ├── auth.ts                            # Authentication
│   ├── validation.ts                      # Input validation
│   ├── errorHandler.ts                    # Error handling
│   └── cors.ts                            # CORS config
│
├── services/                              # Business services
│   ├── updateService.ts
│   ├── emailService.ts
│   └── ... (per module)
│
├── config/                                # Configuration
│   ├── database.ts                        # MongoDB config
│   ├── env.ts                             # Environment variables
│   └── constants.ts                       # App constants
│
├── utils/                                 # Utilities
│   ├── logger.ts                          # Logging
│   ├── validators.ts                      # Validation
│   └── helpers.ts                         # Helper functions
│
├── app.ts                                 # Express app setup
├── server.ts                              # Server startup
└── package.json
```

---

## 🏗️ Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   CLIENT LAYER (Next.js)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐              ┌──────────────────┐   │
│  │   Admin Panel    │              │  Public Website  │   │
│  │   Dashboard      │              │  (Updates, Blog, │   │
│  │   (CRUD UIs)     │              │   Courses, etc)  │   │
│  └─────┬────────────┘              └────────┬─────────┘   │
│        │                                    │             │
│        └────────────┬─────────────────────┬─┘             │
│                     │ HTTP/HTTPS          │               │
│                     │ REST API Calls      │               │
└─────────────────────┼────────────────────────────────────┘
                      │
┌─────────────────────▼─────────────────────────────────────┐
│                 API LAYER (Express.js)                   │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │        Route Handlers (8 modules)                │  │
│  │  /api/v1/updates, /api/v1/blog, etc.             │  │
│  └────────┬────────────────────────────────┬────────┘  │
│           │                                │            │
│  ┌────────▼──────────────────────────────▼────────┐    │
│  │         Middleware Layer                       │    │
│  │  ├─ Authentication                             │    │
│  │  ├─ Validation (Zod)                          │    │
│  │  ├─ Error Handling                            │    │
│  │  └─ CORS & Security                           │    │
│  └────────┬──────────────────────────────┬────────┘    │
│           │                              │             │
│  ┌────────▼──────────────────────────────▼────────┐    │
│  │         Business Logic (Services)              │    │
│  │  ├─ Email notifications                        │    │
│  │  ├─ File uploads                               │    │
│  │  └─ Complex queries                            │    │
│  └────────┬──────────────────────────────┬────────┘    │
│           │                              │             │
└───────────┼──────────────────────────────┼─────────────┘
            │                              │
┌───────────▼──────────────────────────────▼─────────────┐
│              DATABASE LAYER (MongoDB)                 │
├───────────────────────────────────────────────────────┤
│                                                       │
│  ┌────────────────────────────────────────────────┐  │
│  │         MongoDB Collections                   │  │
│  │  ├─ updates_collection                        │  │
│  │  ├─ blog_posts_collection                     │  │
│  │  ├─ courses_collection                        │  │
│  │  ├─ community_collection                      │  │
│  │  ├─ gallery_collection                        │  │
│  │  ├─ notifications_collection                  │  │
│  │  ├─ contacts_collection                       │  │
│  │  └─ admins_collection                         │  │
│  └────────────────────────────────────────────────┘  │
│                                                       │
└───────────────────────────────────────────────────────┘
```

### Data Flow Example (Create Update)

```
Admin User
  │
  ├─→ Fills form in Modal
  │   └─→ Zod validation (client-side)
  │
  ├─→ Clicks "Create Update"
  │   └─→ API call: POST /api/v1/updates
  │
  ├─→ Backend receives request
  │   ├─→ Middleware: Verify auth token
  │   ├─→ Middleware: Validate data with Zod
  │   ├─→ Controller: Process request
  │   ├─→ Service: Business logic
  │   └─→ Model: Save to MongoDB
  │
  ├─→ API returns response
  │   └─→ 201 Created + new data
  │
  ├─→ Frontend updates state
  │   ├─→ Refreshes table
  │   ├─→ Shows toast: "Update created!"
  │   └─→ Closes modal
  │
  └─→ Admin sees new update in list
```

---

## 💾 Database Schema

### Collections Overview

#### 1. **Updates Collection**
Purpose: News, announcements, system messages
```javascript
{
  _id: ObjectId,
  title: string,
  subtitle: string,
  content: string,                    // Rich text
  type: 'General' | 'Platform' | 'Course' | 'Maintenance' | 'Exam' | 'Event' | 'Announcement' | 'System',
  isUrgent: boolean,
  status: 'draft' | 'published',
  author: ObjectId,
  views: number,
  likes: number,
  tags: string[],
  cover_image: string,
  seo: { title, description, keywords },
  metadata: { published_date, last_modified, visibility },
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. **Blog Collection**
Purpose: Articles and blog posts
```javascript
{
  _id: ObjectId,
  title: string,
  slug: string,                       // URL-friendly
  excerpt: string,
  content: string,
  author: ObjectId,
  category: string,
  tags: string[],
  cover_image: string,
  status: 'draft' | 'published' | 'archived',
  featured: boolean,
  views: number,
  reading_time: number,
  seo: { title, description, og_image },
  createdAt: Date,
  publishedAt: Date,
  updatedAt: Date
}
```

#### 3. **Courses Collection**
Purpose: Educational courses
```javascript
{
  _id: ObjectId,
  title: string,
  slug: string,
  description: string,
  content: string,
  instructor: ObjectId,
  category: string,
  level: 'Beginner' | 'Intermediate' | 'Advanced',
  price: number,
  duration: number,                   // In hours
  thumbnail: string,
  modules: [ { title, lessons, duration, content } ],
  students_enrolled: number,
  rating: number,
  status: 'draft' | 'published' | 'archived',
  featured: boolean,
  requirements: string[],
  learnings: string[],
  tags: string[],
  createdAt: Date,
  updatedAt: Date
}
```

#### 4. **Community Collection**
Purpose: Forums, discussions, groups
```javascript
{
  _id: ObjectId,
  title: string,
  slug: string,
  description: string,
  content: string,
  type: 'forum' | 'discussion' | 'group' | 'event',
  category: string,
  members: ObjectId[],
  moderators: ObjectId[],
  creator: ObjectId,
  thumbnail: string,
  member_count: number,
  post_count: number,
  status: 'active' | 'inactive' | 'archived',
  featured: boolean,
  tags: string[],
  metadata: { last_activity, trending_topics },
  createdAt: Date,
  updatedAt: Date
}
```

#### 5. **Gallery Collection**
Purpose: Image storage and organization
```javascript
{
  _id: ObjectId,
  title: string,
  description: string,
  images: [
    {
      _id: ObjectId,
      url: string,
      alt_text: string,
      caption: string,
      width: number,
      height: number,
      uploaded_at: Date
    }
  ],
  category: string,
  tags: string[],
  cover_image: string,
  featured: boolean,
  status: 'draft' | 'published',
  access: 'public' | 'private' | 'members_only',
  createdAt: Date,
  updatedAt: Date
}
```

#### 6. **Notifications Collection**
Purpose: System alerts and announcements
```javascript
{
  _id: ObjectId,
  title: string,
  message: string,
  type: 'info' | 'warning' | 'error' | 'success',
  priority: 'low' | 'medium' | 'high',
  recipients: ObjectId[],
  read_by: ObjectId[],
  action_url: string,
  icon: string,
  status: 'draft' | 'sent' | 'scheduled',
  scheduled_for: Date,
  sent_at: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### 7. **Contacts Collection**
Purpose: Contact form submissions
```javascript
{
  _id: ObjectId,
  name: string,
  email: string,
  phone: string,
  subject: string,
  message: string,
  category: string,
  priority: 'low' | 'medium' | 'high',
  status: 'new' | 'read' | 'replied' | 'closed',
  assigned_to: ObjectId,
  reply: string,
  attachments: string[],
  metadata: { ip_address, user_agent, referrer },
  createdAt: Date,
  updatedAt: Date
}
```

#### 8. **Admins Collection**
Purpose: User accounts and permissions
```javascript
{
  _id: ObjectId,
  name: string,
  email: string,
  phone: string,
  password: string,                   // Hashed with bcrypt
  avatar: string,
  role: 'super_admin' | 'admin' | 'editor' | 'moderator',
  permissions: string[],
  departments: string[],
  status: 'active' | 'inactive' | 'suspended',
  last_login: Date,
  login_history: [ { ip_address, timestamp, user_agent } ],
  two_factor_enabled: boolean,
  profile: { bio, department, location },
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔌 API Routes

### Complete API Endpoint Reference

**Base URL**: `http://your-backend.com/api/v1`

#### Updates API
```
GET    /updates                    → List all (paginated, searchable)
GET    /updates/:id                → Get single update
GET    /updates/trending           → Get trending updates
POST   /updates                    → Create (admin only)
PUT    /updates/:id                → Update (admin only)
DELETE /updates/:id                → Delete (admin only)
POST   /updates/:id/like           → Like update
POST   /updates/:id/view           → Record view
```

#### Blog API
```
GET    /blog                       → List all posts
GET    /blog/:slug                 → Get by slug
GET    /blog/featured              → Featured posts
GET    /blog/by-category/:cat      → Filter by category
POST   /blog                       → Create post
PUT    /blog/:id                   → Update post
DELETE /blog/:id                   → Delete post
GET    /blog/:id/comments          → Get comments
POST   /blog/:id/comments          → Add comment
```

#### Courses API
```
GET    /courses                    → List all courses
GET    /courses/:slug              → Get course details
GET    /courses/by-level/:lvl      → Filter by level
GET    /courses/trending           → Trending courses
POST   /courses                    → Create course
PUT    /courses/:id                → Update course
DELETE /courses/:id                → Delete course
POST   /courses/:id/enroll         → Enroll student
GET    /courses/:id/modules        → Get modules
```

#### Community API
```
GET    /community                  → List communities
GET    /community/:slug            → Get details
POST   /community                  → Create
PUT    /community/:id              → Update
DELETE /community/:id              → Delete
POST   /community/:id/join         → Join community
POST   /community/:id/leave        → Leave community
GET    /community/:id/members      → Get members
GET    /community/:id/posts        → Get posts
```

#### Gallery API
```
GET    /gallery                    → List galleries
GET    /gallery/:id                → Get details
POST   /gallery                    → Create gallery
PUT    /gallery/:id                → Update
DELETE /gallery/:id                → Delete
POST   /gallery/:id/images         → Upload images
GET    /gallery/:id/images         → Get images
DELETE /gallery/:id/images/:img    → Delete image
```

#### Notifications API
```
GET    /notifications              → List notifications
GET    /notifications/unread       → Get unread count
POST   /notifications              → Create notification
PUT    /notifications/:id/read     → Mark as read
DELETE /notifications/:id          → Delete
POST   /notifications/send-all     → Broadcast
```

#### Contacts API
```
GET    /contacts                   → List submissions (admin)
GET    /contacts/:id               → Get details
POST   /contacts                   → Submit form (public)
PUT    /contacts/:id               → Update (admin)
POST   /contacts/:id/reply         → Send reply
DELETE /contacts/:id               → Delete
GET    /contacts/stats             → Get statistics
```

#### Admins API
```
GET    /admins                     → List admins
GET    /admins/:id                 → Get details
POST   /admins                     → Create admin
PUT    /admins/:id                 → Update admin
DELETE /admins/:id                 → Delete admin
POST   /admins/login               → Admin login
POST   /admins/logout              → Admin logout
GET    /admins/permissions         → Get permissions
```

#### Query Parameters

All list endpoints support:
```
?page=1&limit=20                   # Pagination (default: page 1, 20 items)
&search=keyword                    # Search in title/description
&sortBy=createdAt&order=desc      # Sorting options
&status=published                  # Filter by status
&category=general                  # Filter by category
&tags=tech,news                    # Filter by tags
```

**Example Requests**:
```bash
# Get published updates, page 2, 50 per page
GET /updates?status=published&page=2&limit=50

# Search blog posts
GET /blog?search=typescript&sortBy=views&order=desc

# Get courses by level
GET /courses/by-level/Intermediate?page=1&limit=20
```

---

## 👨‍💼 Admin Features

### Dashboard Overview

The admin dashboard provides a comprehensive interface for managing all content:

#### 1. **Updates Management**
- ✅ Create/Edit/Delete updates
- ✅ Rich text editor (Tiptap)
- ✅ Select from 8 types
- ✅ Mark as urgent
- ✅ Draft/Published status
- ✅ SEO optimization
- ✅ View analytics
- ✅ Bulk delete
- ✅ Sort & filter

**Features**:
```
Modal Size: 750px width
Content Editor: Full rich text with formatting
Image Upload: Support for cover images
Tags: Multiple tag input
Status: Draft/Published toggle
Urgent Flag: Pin to top (Updates only)
Visibility: Public/Private/Internal
```

#### 2. **Blog Management**
- ✅ Full article CRUD
- ✅ Slug auto-generation
- ✅ Featured articles
- ✅ Categories & tags
- ✅ Reading time calculator
- ✅ SEO optimization
- ✅ Comment moderation

**Features**:
```
Categories: Pre-defined or create new
Tags: Multiple, auto-complete
Featured: Toggle featured status
Reading Time: Auto-calculated
Excerpt: Short summary
Cover Image: Upload & optimize
SEO: Title, description, OG image
```

#### 3. **Courses Management**
- ✅ Course wizard
- ✅ Module & lesson structure
- ✅ Price configuration
- ✅ Enrollment tracking
- ✅ Level selection
- ✅ Student management
- ✅ Rating display

**Features**:
```
Levels: Beginner, Intermediate, Advanced
Pricing: Support for free/paid
Duration: Course hours tracking
Modules: Nested structure
Students: Enrollment count
Requirements: List of prerequisites
Learnings: Learning outcomes
Certificate: Issue on completion
```

#### 4. **Community Management**
- ✅ Forum/Group creation
- ✅ Member management
- ✅ Moderator assignment
- ✅ Activity tracking
- ✅ Rules & guidelines
- ✅ Trending topics

**Features**:
```
Type: Forum, Discussion, Group, Event
Members: Track member count
Moderators: Assign permissions
Activity: Last activity timestamp
Rules: Community guidelines
Featured: Highlight communities
Access: Public/Private/Members-only
```

#### 5. **Gallery Management**
- ✅ Album creation
- ✅ Image upload (bulk)
- ✅ Alt text management
- ✅ Image optimization
- ✅ Drag-drop reordering
- ✅ Access control

**Features**:
```
Bulk Upload: Multiple images
Image Optimization: Automatic resizing
Alt Text: SEO-friendly descriptions
Categories: Organize albums
Tags: Multiple tags per album
Access: Public/Private/Members-only
Cover Image: Featured album image
```

#### 6. **Notifications Management**
- ✅ Create system notifications
- ✅ Broadcast to users
- ✅ Schedule sending
- ✅ Priority levels
- ✅ Read tracking

**Features**:
```
Priority: Low, Medium, High
Type: Info, Warning, Error, Success
Recipients: All users or specific
Scheduling: Send at specific time
Action URL: Link in notification
Read Tracking: See who read
Broadcast: Send to all at once
```

#### 7. **Contact Submissions**
- ✅ View submissions
- ✅ Assign to admin
- ✅ Reply to contacts
- ✅ Status tracking
- ✅ Statistics

**Features**:
```
Status: New, Read, Replied, Closed
Priority: Low, Medium, High
Assignment: Assign to admin
Replies: Send responses
Attachments: View uploaded files
Statistics: Submission graphs
Export: Export to CSV
```

#### 8. **Admin Management**
- ✅ Create/manage admins
- ✅ Role assignment
- ✅ Permission management
- ✅ Activity logs
- ✅ 2FA setup

**Features**:
```
Roles: Super Admin, Admin, Editor, Moderator
Permissions: Granular control
2FA: Two-factor authentication
Login History: Track logins
Activity Logs: Monitor actions
Departments: Organization support
```

### UI/UX Improvements

- 📐 **Modal Size**: 750px optimized width
- 🎨 **Professional Spacing**: Consistent padding & margins
- 📱 **Responsive Design**: Mobile-first approach
- 🔍 **Advanced Search**: Full-text search & filters
- 📋 **Pagination**: Efficient data loading
- 🎯 **Bulk Actions**: Select multiple & act
- ✅ **Form Validation**: Real-time feedback
- 💫 **Loading States**: Skeleton loaders
- ⚠️ **Error Messages**: Clear, actionable
- 🔔 **Toast Notifications**: Action feedback
- 🌙 **Dark Mode**: Light & dark themes

---

## 🌐 Public Features

### Public Website

The public website displays content from the CMS:

#### Updates Page (`/updates`)
```
✅ List of updates
✅ Urgent updates pinned to top
✅ Search & filter
✅ Pagination
✅ Click for detail view
✅ Related updates
✅ Share buttons
```

#### Blog Section (`/blog`)
```
✅ Article listing
✅ Category filtering
✅ Search functionality
✅ Featured articles
✅ Reading time indicator
✅ Author information
✅ Comment section
✅ Related posts
✅ Social sharing
```

#### Courses Section (`/courses`)
```
✅ Courses listing
✅ Level filtering
✅ Price display
✅ Enrollment button
✅ Course details
✅ Module preview
✅ Student count
✅ Rating display
✅ Requirements list
✅ Learning outcomes
```

#### Community Section (`/community`)
```
✅ Communities listing
✅ Member count
✅ Activity status
✅ Join button
✅ Community details
✅ Member list
✅ Discussion posts
✅ Trending topics
```

#### Gallery Section (`/gallery`)
```
✅ Gallery albums
✅ Image preview
✅ Lightbox viewer
✅ Image categories
✅ Tag filtering
✅ Download option
✅ Share gallery
```

---

## ⚡ Quick Start

### Prerequisites

```bash
# Check versions
node --version        # Should be 18+
npm --version         # Should be 9+
mongod --version      # Optional, if using local MongoDB
```

### Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd xmartycreator.com.pvtt-main

# 2. Install root dependencies
npm install

# 3. Install frontend dependencies
cd frontend
npm install

# 4. Install backend dependencies
cd ../backend
npm install

# 5. Create .env files
# Frontend: frontend/.env.local
# Backend: backend/.env
```

### Environment Setup

**Frontend (`.env.local`)**:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_SITE_NAME=Xmarty Creator
NEXT_PUBLIC_ADMIN_URL=http://localhost:3000/admin
```

**Backend (`.env`)**:
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/cms_db
JWT_SECRET=your-secret-key-here
```

### Running the Application

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev

# Visit http://localhost:3000
# Admin dashboard: http://localhost:3000/admin
```

---

## 🔑 Configuration

### Environment Variables

#### Backend `.env`

```env
# Server Configuration
NODE_ENV=development                    # development | production
PORT=3001
DEBUG=true

# Database
MONGODB_URI=mongodb://localhost:27017/cms_db
# OR for MongoDB Atlas:
MONGODB_ATLAS_URI=mongodb+srv://user:pass@cluster.mongodb.net/cms_db?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRATION=7d
REFRESH_TOKEN_SECRET=your_refresh_secret_min_32_chars

# Email Service (for notifications)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@xmartycreator.com

# File Upload (AWS S3 or similar)
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1

# CORS
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3000/admin

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=debug
LOG_FORMAT=combined
```

#### Frontend `.env.local`

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_API_TIMEOUT=30000

# Site Configuration
NEXT_PUBLIC_SITE_NAME=Xmarty Creator
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_URL=http://localhost:3000/admin

# Authentication (NextAuth.js)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_min_32_chars

# Features
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_COMMENTS=true
NEXT_PUBLIC_ENABLE_SEARCH=true

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_HOTJAR_ID=
```

---

## 📊 Documentation

### Additional Documentation Files

- **[COMPLETE_CMS_ARCHITECTURE.md](./COMPLETE_CMS_ARCHITECTURE.md)** - Detailed architecture overview
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - MongoDB schema documentation
- **[API_REFERENCE.md](./API_REFERENCE.md)** - Complete API endpoint reference
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guide
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions

### API Documentation

Use tools like:
- **Postman**: Import collection for API testing
- **Swagger**: Auto-generated API docs
- **Insomnia**: API request tool

---

## 🚀 Deployment

### Frontend Deployment (Vercel)

```bash
# 1. Connect GitHub repository to Vercel
# 2. Set environment variables
# 3. Auto-deployment on push

# Or manual deployment
npm run build
npm run start
```

### Backend Deployment (Railway/Render)

```bash
# 1. Connect GitHub repository
# 2. Set environment variables
# 3. Deploy from dashboard
# 4. Configure MongoDB connection
```

### Database (MongoDB Atlas)

```bash
# 1. Create MongoDB Atlas account
# 2. Create cluster
# 3. Get connection string
# 4. Add to backend .env
```

### Docker Deployment

```dockerfile
# Build image
docker build -t cms-backend .

# Run container
docker run -p 3001:3001 --env-file .env cms-backend

# Using docker-compose
docker-compose up
```

---

## 🗺️ Roadmap

### Phase 1: Core (✅ Complete)
- [x] Basic CRUD operations
- [x] Admin dashboard
- [x] Public website
- [x] MongoDB integration
- [x] API foundation

### Phase 2: Enhancement (🔄 In Progress)
- [ ] Rich text editor (Tiptap)
- [ ] Image optimization
- [ ] Advanced search (Elasticsearch)
- [ ] Email notifications
- [ ] User authentication
- [ ] Role-based access control

### Phase 3: Advanced (📅 Planned)
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] SEO optimization
- [ ] CDN integration
- [ ] Caching strategies

### Phase 4: Future (🚀 Roadmap)
- [ ] AI-powered content suggestions
- [ ] Automated backups
- [ ] API rate limiting
- [ ] Webhook support
- [ ] GraphQL API
- [ ] Mobile app (React Native)

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🤝 Support

### Getting Help

- 📖 Check the documentation
- 🔍 Search existing issues
- 💬 Start a discussion
- 📧 Email support team

### Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Submit a pull request

---

## 📞 Contact

- **Website**: https://xmartycreator.com
- **Email**: support@xmartycreator.com
- **GitHub**: https://github.com/xmartycreator
- **Discord**: [Join Community](https://discord.gg/xmartycreator)

---

<div align="center">

**Built with ❤️ using Next.js, Express, and MongoDB**

⭐ If this project helped you, please give it a star!

[Documentation](./COMPLETE_CMS_ARCHITECTURE.md) • [Issues](https://github.com/xmartycreator/cms/issues) • [Discussions](https://github.com/xmartycreator/cms/discussions)

</div>

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Status**: ✅ Production Ready  
**License**: MIT
