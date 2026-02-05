import mongoose from 'mongoose';
import connectDB from '@/lib/db-connection';
import Blog from '@/lib/models/blog';

async function diagnoseBlog() {
  console.log('\n=== 🔍 BLOG SYSTEM DIAGNOSTIC ===\n');
  
  try {
    console.log('📍 Step 1: Connecting to MongoDB...');
    await connectDB();
    console.log('✅ MongoDB Connected\n');

    console.log('📍 Step 2: Checking blog collection...');
    const totalCount = await Blog.countDocuments();
    console.log(`✅ Total blogs in database: ${totalCount}\n`);

    if (totalCount === 0) {
      console.log('⚠️  No blogs found! Create a blog first.\n');
      process.exit(0);
    }

    console.log('📍 Step 3: Fetching published blogs (without htmlContent)...');
    const publishedBasic = await Blog.find({ status: 'published' })
      .select('_id title slug status publishedAt htmlContent')
      .lean()
      .exec();
    console.log(`✅ Found ${publishedBasic.length} published blogs\n`);

    if (publishedBasic.length > 0) {
      console.log('📍 Step 4: Checking first blog in detail...');
      const firstBlog = publishedBasic[0];
      console.log(`
Blog Title: ${firstBlog.title}
Blog Slug: ${firstBlog.slug}
Status: ${firstBlog.status}
htmlContent Type: ${typeof firstBlog.htmlContent}
htmlContent Exists: ${firstBlog.htmlContent ? 'YES' : 'NO'}
htmlContent Length: ${firstBlog.htmlContent?.length || 0} chars
htmlContent Sample: ${firstBlog.htmlContent ? firstBlog.htmlContent.substring(0, 100) : 'N/A'}
      `);

      console.log('📍 Step 5: Fetching with explicit +htmlContent select...');
      const withHtml = await Blog.findOne({ slug: firstBlog.slug })
        .select('+htmlContent +content')
        .lean()
        .exec();
      
      console.log(`
htmlContent Type: ${typeof withHtml?.htmlContent}
htmlContent Exists: ${withHtml?.htmlContent ? 'YES' : 'NO'}
htmlContent Length: ${withHtml?.htmlContent?.length || 0} chars
htmlContent Sample: ${withHtml?.htmlContent ? withHtml.htmlContent.substring(0, 150) : 'N/A'}
      `);
    }

    console.log('📍 Step 6: Testing query with status....');
    const query = { status: 'published' };
    const result = await Blog.find(query)
      .select('_id title slug excerpt author readTime status publishedAt updatedAt tags views likes coverImage +htmlContent +content')
      .sort({ publishedAt: -1 })
      .limit(5)
      .lean()
      .exec();

    console.log(`✅ Query returned ${result.length} blogs`);
    if (result.length > 0) {
      console.log(`First blog htmlContent length: ${result[0].htmlContent?.length || 0}`);
    }

    console.log('\n=== ✅ DIAGNOSTIC COMPLETE ===\n');

  } catch (error) {
    console.error('❌ Diagnostic Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

diagnoseBlog();
