# 💾 MongoDB Database Schema Reference

Complete MongoDB schema definitions for the Xmarty Creator CMS.

---

## Table of Contents

1. [Collections Overview](#collections-overview)
2. [Mongoose Models](#mongoose-models)
3. [Relationships](#relationships)
4. [Indexes](#indexes)
5. [Validation Rules](#validation-rules)
6. [Migration Guide](#migration-guide)

---

## Collections Overview

The CMS uses 8 MongoDB collections to store all data:

| Collection | Purpose | Documents | Indexes |
|-----------|---------|-----------|---------|
| **updates** | News & announcements | Dynamic | 5 |
| **blog_posts** | Articles & blog content | Dynamic | 6 |
| **courses** | Educational content | Dynamic | 6 |
| **communities** | Forums & discussions | Dynamic | 5 |
| **galleries** | Image storage | Dynamic | 4 |
| **notifications** | System alerts | Dynamic | 4 |
| **contacts** | Contact submissions | Dynamic | 4 |
| **admins** | User accounts | Limited | 5 |

---

## Mongoose Models

### 1. Updates Model

```typescript
// File: backend/src/models/Update.ts

const updateSchema = new Schema({
  // Core Fields
  title: {
    type: String,
    required: [true, 'Title is required'],
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters'],
    trim: true,
    index: true
  },
  
  subtitle: {
    type: String,
    maxlength: 300,
    trim: true
  },
  
  content: {
    type: String,
    required: [true, 'Content is required'],
    minlength: [20, 'Content must be at least 20 characters'],
    trim: true
  },
  
  // Type and Status
  type: {
    type: String,
    enum: [
      'General',
      'Platform',
      'Course',
      'Maintenance',
      'Exam',
      'Event',
      'Announcement',
      'System'
    ],
    default: 'General',
    index: true
  },
  
  isUrgent: {
    type: Boolean,
    default: false,
    index: true
  },
  
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
    index: true
  },
  
  // Author and References
  author: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  
  likes: {
    type: Number,
    default: 0
  },
  
  // Tags and SEO
  tags: [
    {
      type: String,
      trim: true,
      lowercase: true
    }
  ],
  
  cover_image: {
    type: String,
    match: /^https?:\/\/.+/i
  },
  
  seo: {
    title: {
      type: String,
      maxlength: 60
    },
    description: {
      type: String,
      maxlength: 160
    },
    keywords: [String]
  },
  
  // Metadata
  metadata: {
    published_date: Date,
    last_modified: Date,
    visibility: {
      type: String,
      enum: ['public', 'private', 'internal'],
      default: 'public'
    }
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  collection: 'updates'
});

// Indexes
updateSchema.index({ title: 'text', subtitle: 'text', content: 'text' });
updateSchema.index({ author: 1, createdAt: -1 });
updateSchema.index({ status: 1, isUrgent: -1, createdAt: -1 });
updateSchema.index({ type: 1 });
updateSchema.index({ tags: 1 });

export default mongoose.model('Update', updateSchema);
```

### 2. Blog Post Model

```typescript
// File: backend/src/models/BlogPost.ts

const blogPostSchema = new Schema({
  // Core Fields
  title: {
    type: String,
    required: [true, 'Title is required'],
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters'],
    trim: true,
    index: true
  },
  
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  },
  
  excerpt: {
    type: String,
    maxlength: 500,
    trim: true
  },
  
  content: {
    type: String,
    required: [true, 'Content is required'],
    minlength: [50, 'Content must be at least 50 characters']
  },
  
  // Author
  author: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  
  // Categorization
  category: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  
  tags: [
    {
      type: String,
      trim: true,
      lowercase: true
    }
  ],
  
  // Media
  cover_image: {
    type: String,
    match: /^https?:\/\/.+/i
  },
  
  // Publishing Status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true
  },
  
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  
  comments_count: {
    type: Number,
    default: 0
  },
  
  reading_time: {
    type: Number,           // in minutes
    default: 0
  },
  
  // SEO
  seo: {
    title: {
      type: String,
      maxlength: 60
    },
    description: {
      type: String,
      maxlength: 160
    },
    og_image: String,
    og_title: String,
    og_description: String
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  publishedAt: {
    type: Date,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  collection: 'blog_posts'
});

// Indexes
blogPostSchema.index({ title: 'text', excerpt: 'text', content: 'text' });
blogPostSchema.index({ author: 1, publishedAt: -1 });
blogPostSchema.index({ category: 1, status: 1 });
blogPostSchema.index({ featured: 1, publishedAt: -1 });
blogPostSchema.index({ tags: 1 });
blogPostSchema.index({ status: 1, publishedAt: -1 });

export default mongoose.model('BlogPost', blogPostSchema);
```

### 3. Course Model

```typescript
// File: backend/src/models/Course.ts

const courseSchema = new Schema({
  // Basic Info
  title: {
    type: String,
    required: [true, 'Course title is required'],
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters'],
    trim: true,
    index: true
  },
  
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  
  content: String,
  
  // Instructor
  instructor: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  
  // Categorization
  category: {
    type: String,
    required: true,
    index: true
  },
  
  subcategory: String,
  
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true,
    index: true
  },
  
  // Pricing
  price: {
    type: Number,
    default: 0,
    min: 0
  },
  
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'INR']
  },
  
  // Duration
  duration: {
    type: Number,          // in hours
    required: true
  },
  
  // Media
  thumbnail: String,
  cover_image: String,
  
  // Course Structure
  modules: [
    {
      _id: Schema.Types.ObjectId,
      title: {
        type: String,
        required: true
      },
      lessons: {
        type: Number,
        default: 0
      },
      duration: {
        type: Number,      // in minutes
        default: 0
      },
      content: String,
      order: Number
    }
  ],
  
  // Enrollment & Rating
  students_enrolled: {
    type: Number,
    default: 0
  },
  
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  
  reviews_count: {
    type: Number,
    default: 0
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true
  },
  
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Learning Outcomes
  requirements: [String],
  
  learnings: [String],
  
  tags: [String],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  collection: 'courses'
});

// Indexes
courseSchema.index({ title: 'text', description: 'text', content: 'text' });
courseSchema.index({ instructor: 1, status: 1 });
courseSchema.index({ category: 1, level: 1 });
courseSchema.index({ featured: 1, rating: -1 });
courseSchema.index({ tags: 1 });
courseSchema.index({ status: 1, students_enrolled: -1 });

export default mongoose.model('Course', courseSchema);
```

### 4. Community Model

```typescript
// File: backend/src/models/Community.ts

const communitySchema = new Schema({
  // Basic Info
  title: {
    type: String,
    required: [true, 'Community title is required'],
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters'],
    trim: true,
    index: true
  },
  
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  
  description: {
    type: String,
    maxlength: 1000
  },
  
  content: String,
  
  // Type
  type: {
    type: String,
    enum: ['forum', 'discussion', 'group', 'event'],
    required: true,
    index: true
  },
  
  category: {
    type: String,
    index: true
  },
  
  // Members
  members: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Admin'
    }
  ],
  
  moderators: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Admin'
    }
  ],
  
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  
  // Media
  thumbnail: String,
  
  // Statistics
  member_count: {
    type: Number,
    default: 0
  },
  
  post_count: {
    type: Number,
    default: 0
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active',
    index: true
  },
  
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Tags
  tags: [String],
  
  // Rules
  rules: String,
  
  // Metadata
  metadata: {
    last_activity: Date,
    most_active_member: {
      type: Schema.Types.ObjectId,
      ref: 'Admin'
    },
    trending_topics: [String]
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  collection: 'communities'
});

// Indexes
communitySchema.index({ title: 'text', description: 'text', content: 'text' });
communitySchema.index({ type: 1, status: 1 });
communitySchema.index({ creator: 1, createdAt: -1 });
communitySchema.index({ featured: 1, member_count: -1 });
communitySchema.index({ tags: 1 });

export default mongoose.model('Community', communitySchema);
```

### 5. Gallery Model

```typescript
// File: backend/src/models/Gallery.ts

const gallerySchema = new Schema({
  // Basic Info
  title: {
    type: String,
    required: [true, 'Gallery title is required'],
    trim: true,
    index: true
  },
  
  description: String,
  
  // Images
  images: [
    {
      _id: Schema.Types.ObjectId,
      url: {
        type: String,
        required: true,
        match: /^https?:\/\/.+/i
      },
      alt_text: String,
      caption: String,
      width: Number,
      height: Number,
      size: Number,              // in bytes
      mime_type: String,         // image/jpeg, image/png, etc.
      uploaded_at: {
        type: Date,
        default: Date.now
      }
    }
  ],
  
  // Categorization
  category: {
    type: String,
    index: true
  },
  
  tags: [String],
  
  cover_image: String,
  
  // Statistics
  album_count: {
    type: Number,
    default: 1
  },
  
  // Status
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
    index: true
  },
  
  access: {
    type: String,
    enum: ['public', 'private', 'members_only'],
    default: 'public'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  collection: 'galleries'
});

// Indexes
gallerySchema.index({ title: 'text', description: 'text' });
gallerySchema.index({ category: 1, status: 1 });
gallerySchema.index({ featured: 1 });
gallerySchema.index({ tags: 1 });

export default mongoose.model('Gallery', gallerySchema);
```

### 6. Notification Model

```typescript
// File: backend/src/models/Notification.ts

const notificationSchema = new Schema({
  // Content
  title: {
    type: String,
    required: [true, 'Title is required'],
    maxlength: 100
  },
  
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxlength: 500
  },
  
  // Type and Priority
  type: {
    type: String,
    enum: ['info', 'warning', 'error', 'success'],
    default: 'info',
    index: true
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
    index: true
  },
  
  // Recipients
  recipients: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Admin'
    }
  ],
  
  read_by: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'Admin'
      },
      read_at: {
        type: Date,
        default: Date.now
      }
    }
  ],
  
  // Action
  action_url: String,
  
  icon: String,
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'sent', 'scheduled'],
    default: 'draft',
    index: true
  },
  
  scheduled_for: {
    type: Date,
    index: true
  },
  
  sent_at: {
    type: Date,
    index: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  collection: 'notifications'
});

// Indexes
notificationSchema.index({ type: 1, priority: 1 });
notificationSchema.index({ status: 1, scheduled_for: 1 });
notificationSchema.index({ recipients: 1 });
notificationSchema.index({ createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
```

### 7. Contact Model

```typescript
// File: backend/src/models/Contact.ts

const contactSchema = new Schema({
  // Sender Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100,
    index: true
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    match: [/.+@.+\..+/, 'Please enter a valid email'],
    lowercase: true,
    index: true
  },
  
  phone: {
    type: String,
    match: [/^\d{10,}$/, 'Please enter a valid phone number']
  },
  
  // Message
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: 200
  },
  
  message: {
    type: String,
    required: [true, 'Message is required'],
    minlength: [10, 'Message must be at least 10 characters'],
    maxlength: [5000, 'Message cannot exceed 5000 characters']
  },
  
  // Categorization
  category: {
    type: String,
    enum: ['general', 'support', 'feedback', 'complaint', 'partnership', 'other'],
    default: 'general',
    index: true
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  
  // Status & Assignment
  status: {
    type: String,
    enum: ['new', 'read', 'replied', 'closed'],
    default: 'new',
    index: true
  },
  
  assigned_to: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    index: true
  },
  
  // Reply
  reply: String,
  
  reply_at: Date,
  
  replied_by: {
    type: Schema.Types.ObjectId,
    ref: 'Admin'
  },
  
  // Attachments
  attachments: [
    {
      url: String,
      name: String,
      size: Number,
      mime_type: String
    }
  ],
  
  // Metadata
  metadata: {
    ip_address: String,
    user_agent: String,
    referrer: String
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  collection: 'contacts'
});

// Indexes
contactSchema.index({ email: 1, createdAt: -1 });
contactSchema.index({ category: 1, status: 1 });
contactSchema.index({ assigned_to: 1, status: 1 });
contactSchema.index({ priority: 1, status: 1 });

export default mongoose.model('Contact', contactSchema);
```

### 8. Admin Model

```typescript
// File: backend/src/models/Admin.ts

const adminSchema = new Schema({
  // Personal Info
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/.+@.+\..+/, 'Please enter a valid email'],
    index: true
  },
  
  phone: {
    type: String,
    match: [/^\d{10,}$/, 'Please enter a valid phone number']
  },
  
  // Authentication
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false                  // Don't return by default
  },
  
  avatar: String,
  
  // Authorization
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'editor', 'moderator'],
    default: 'admin',
    index: true
  },
  
  permissions: [String],          // Granular permissions
  
  departments: [String],
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
    index: true
  },
  
  // Activity Tracking
  last_login: Date,
  
  login_history: [
    {
      ip_address: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      user_agent: String
    }
  ],
  
  // Security
  two_factor_enabled: {
    type: Boolean,
    default: false
  },
  
  two_factor_secret: {
    type: String,
    select: false
  },
  
  // Profile
  profile: {
    bio: String,
    department: String,
    location: String
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  collection: 'admins'
});

// Indexes
adminSchema.index({ email: 1 });
adminSchema.index({ role: 1, status: 1 });
adminSchema.index({ createdAt: -1 });

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
adminSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('Admin', adminSchema);
```

---

## Relationships

### Reference Diagram

```
┌─────────────┐
│   Admin     │
├─────────────┤
│ _id (PK)    │◄─────┐
│ email (U)   │      │
│ password    │      │
│ role        │      │
└─────────────┘      │
      ▲              │
      │              │
      │           Referenced By:
      │           • Update.author
      │           • BlogPost.author
      │           • Course.instructor
      │           • Community.creator
      │           • Contact.assigned_to
      │           • Notification.recipients
      │
┌─────────────────────────────────────────┐
│        Content Collections              │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │   Updates    │  │  BlogPosts   │   │
│  │  (News)      │  │ (Articles)   │   │
│  └──────────────┘  └──────────────┘   │
│                                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │   Courses    │  │ Communities  │   │
│  │(Learning)    │  │(Forums/Disc) │   │
│  └──────────────┘  └──────────────┘   │
│                                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │  Galleries   │  │ Contacts     │   │
│  │ (Images)     │  │(Submissions) │   │
│  └──────────────┘  └──────────────┘   │
│                                         │
└─────────────────────────────────────────┘
        ▲
        │
        │ References
        │
    Admins
```

### Data Relationships

```
1. Admin → Updates
   One Admin can create many Updates

2. Admin → BlogPosts
   One Admin can create many BlogPosts

3. Admin → Courses
   One Admin can create many Courses

4. Admin → Communities
   One Admin can create many Communities

5. Contacts ← Admin
   One Admin can be assigned many Contact submissions

6. Notifications → Multiple Admins
   One Notification can be sent to multiple Admins
```

---

## Indexes

### Index Strategy

All collections use strategic indexing for performance:

| Collection | Index | Type | Purpose |
|-----------|-------|------|---------|
| **updates** | title, subtitle, content | Text | Full-text search |
| | author, createdAt | Compound | Recent author posts |
| | status, isUrgent, createdAt | Compound | Urgent sorting |
| | type | Single | Type filtering |
| | tags | Array | Tag filtering |
| **blog_posts** | title, excerpt, content | Text | Full-text search |
| | author, publishedAt | Compound | Published posts |
| | featured, publishedAt | Compound | Featured articles |
| | tags | Array | Tag filtering |
| **courses** | title, description | Text | Search |
| | category, level | Compound | Filter |
| | featured, rating | Compound | Top courses |
| **communities** | title, description | Text | Search |
| | type, status | Compound | Status filter |
| | tags | Array | Tag filtering |
| **galleries** | title, description | Text | Search |
| | category, status | Compound | Filter |
| **notifications** | type, priority | Compound | Type & priority |
| | status, scheduled_for | Compound | Scheduling |
| **contacts** | email, createdAt | Compound | Recent contacts |
| | category, status | Compound | Status filter |
| **admins** | email | Unique | Login |
| | role, status | Compound | Role filter |

---

## Validation Rules

### Client-Side Validation (Zod Schemas)

```typescript
// Example: Update validation
const createUpdateSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title cannot exceed 200 characters'),
  
  content: z.string()
    .min(20, 'Content must be at least 20 characters'),
  
  type: z.enum(['General', 'Platform', 'Course', 'Maintenance', 'Exam', 'Event', 'Announcement', 'System']),
  
  isUrgent: z.boolean(),
  
  status: z.enum(['draft', 'published']),
  
  tags: z.array(z.string()).optional(),
  
  cover_image: z.string().url().optional()
});
```

### Server-Side Validation

```typescript
// Express middleware
const validateCreateUpdate = (req, res, next) => {
  try {
    const validated = createUpdateSchema.parse(req.body);
    req.validated = validated;
    next();
  } catch (error) {
    res.status(400).json({
      error: 'Validation failed',
      details: error.errors
    });
  }
};
```

---

## Migration Guide

### Creating Collections

```bash
# Method 1: Mongoose Auto-Creates
# Just define models and insert first document

# Method 2: Explicit Creation
db.createCollection('updates');
db.createCollection('blog_posts');
db.createCollection('courses');
# ... etc
```

### Adding Indexes

```bash
# Create all indexes
db.updates.createIndex({ title: "text", subtitle: "text", content: "text" });
db.updates.createIndex({ author: 1, createdAt: -1 });
# ... etc

# Or use Mongoose (auto on schema definition)
```

### Data Migration Example

```typescript
// Migrate from old structure to new
async function migrateData() {
  const updates = await OldUpdate.find();
  
  for (const update of updates) {
    await Update.create({
      title: update.title,
      content: update.body,
      type: update.type || 'General',
      status: update.published ? 'published' : 'draft',
      author: update.authorId,
      // ... other fields
    });
  }
  
  console.log('Migration complete');
}
```

---

**Last Updated**: January 2026  
**Schema Version**: 1.0
