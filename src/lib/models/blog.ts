import mongoose from 'mongoose';

const BlogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    index: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    sparse: true,
    index: true,
  },
  excerpt: {
    type: String,
    required: true,
  },
  content: {
    type: Object, // TipTap JSON format
    required: true,
    select: false, // Don't fetch by default
  },
  htmlContent: {
    type: String,
    required: true,
    select: false, // Don't fetch by default
  },
  coverImage: {
    url: String,
    alt: String,
  },
  author: {
    type: String,
    required: true,
    index: true,
  },
  authorImage: {
    type: String,
  },
  readTime: {
    type: String, // e.g., "5 min read"
    required: true,
  },
  tags: {
    type: [String],
    default: [],
    index: true,
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
    index: true,
  },
  metaTitle: String,
  metaDescription: String,
  metaKeywords: [String],
  canonicalUrl: String,
  publishedAt: {
    type: Date,
    index: true,
    sparse: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  views: {
    type: Number,
    default: 0,
  },
  likes: {
    type: Number,
    default: 0,
  },
  isCached: {
    type: Boolean,
    default: false,
    index: true,
  },
}, { timestamps: true, collection: 'blogs' });

// Compound indexes for common queries - critical for high traffic
BlogSchema.index({ status: 1, publishedAt: -1 }, { background: true });
BlogSchema.index({ tags: 1, status: 1 }, { background: true });
BlogSchema.index({ author: 1, status: 1 }, { background: true });
BlogSchema.index({ views: -1, status: 1 }, { background: true }); // Popular posts
BlogSchema.index({ createdAt: -1, status: 1 }, { background: true });

// Text index for search - optional, can be heavy under load
BlogSchema.index({ title: 'text', excerpt: 'text' }, { background: true, sparse: true });

BlogSchema.set('lean', { defaults: true });

const Blog = mongoose.models.Blog || mongoose.model('Blog', BlogSchema);

export default Blog;
