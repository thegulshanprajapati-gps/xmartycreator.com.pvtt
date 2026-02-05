// Initialize all services on startup
import connectDB from '@/lib/db-connection';
import { addBlogIndexes } from '@/lib/db-indexes';
import Blog from '@/lib/models/blog';

let isInitialized = false;

export async function initializeApp() {
  if (isInitialized) return;

  try {
    console.log('🚀 Initializing application...');

    // Connect to MongoDB
    await connectDB();
    console.log('✅ Database connected');

    // Create indexes
    await addBlogIndexes();
    console.log('✅ Database indexes created');

    isInitialized = true;
    console.log('✅ Application initialized');
  } catch (error) {
    console.error('❌ Initialization error:', error);
    throw error;
  }
}

export function isAppInitialized(): boolean {
  return isInitialized;
}
