import mongoose from 'mongoose';

const BlogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    index: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  excerpt: {
    type: String,
    required: true,
  },
  content: {
    type: Object, // TipTap JSON format
    required: true,
  },
  htmlContent: {
    type: String,
    required: true,
  },
  coverImage: {
    url: String,
    alt: String,
  },
  author: {
    type: String,
    required: true,
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
  publishedAt: Date,
  updatedAt: {
    type: Date,
    default: Date.now,
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
}, { timestamps: true });

// Indexes for performance
BlogSchema.index({ status: 1, publishedAt: -1 });
BlogSchema.index({ tags: 1, status: 1 });

const Blog = mongoose.models.Blog || mongoose.model('Blog', BlogSchema);

export default Blog;
