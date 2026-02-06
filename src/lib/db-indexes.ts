import mongoose from 'mongoose';
import Blog from '@/lib/models/blog';
import connectDB from '@/lib/db-connection';

export async function addBlogIndexes() {
  try {
    await connectDB();

    // Performance-critical indexes
    await Blog.collection.createIndex({ slug: 1 }, { unique: true, background: true });
    await Blog.collection.createIndex({ status: 1, publishedAt: -1 }, { background: true });
    await Blog.collection.createIndex({ tags: 1, status: 1 }, { background: true });
    await Blog.collection.createIndex({ title: 'text', excerpt: 'text', content: 'text' }, { background: true });
    await Blog.collection.createIndex({ author: 1, status: 1 }, { background: true });
    await Blog.collection.createIndex({ createdAt: -1 }, { background: true });
    await Blog.collection.createIndex({ updatedAt: -1 }, { background: true });
    await Blog.collection.createIndex({ views: -1 }, { background: true });

    console.log('✅ Blog indexes created');
  } catch (error) {
    console.error('❌ Index creation failed:', error);
  }
}

export async function ensureIndexes() {
  try {
    await connectDB();
    await Blog.syncIndexes();
    console.log('✅ Indexes synchronized');
  } catch (error) {
    console.error('❌ Sync failed:', error);
  }
}
