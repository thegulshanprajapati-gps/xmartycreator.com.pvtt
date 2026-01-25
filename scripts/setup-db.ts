import connectDB from '@/lib/db-connection';
import { addBlogIndexes } from '@/lib/db-indexes';
import Blog from '@/lib/models/blog';

async function setupDatabase() {
  console.log('📦 Setting up database...');

  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    await addBlogIndexes();
    console.log('✅ Created indexes');

    // Verify indexes
    const indexes = await Blog.collection.getIndexes();
    console.log(`✅ Active indexes: ${Object.keys(indexes).length}`);

    console.log('✅ Database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
