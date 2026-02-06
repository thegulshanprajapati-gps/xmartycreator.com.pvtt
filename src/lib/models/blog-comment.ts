import mongoose from 'mongoose';

const BlogCommentSchema = new mongoose.Schema(
  {
    blogSlug: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    blogTitle: {
      type: String,
      default: '',
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 120,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
    collection: 'blog_comments',
  }
);

BlogCommentSchema.index({ blogSlug: 1, createdAt: -1 }, { background: true });

const BlogComment =
  mongoose.models.BlogComment || mongoose.model('BlogComment', BlogCommentSchema);

export default BlogComment;
