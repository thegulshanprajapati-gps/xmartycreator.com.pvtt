const mongoose = require('mongoose');
const uri = 'mongodb+srv://gulshan:Gulshan%40123@cluster0.wvd0w.mongodb.net/xmarty-edtech?retryWrites=true&w=majority';

(async () => {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const courses = await db.collection('courses').find({}).toArray();
    console.log('\n=== All Courses ===\n');
    courses.forEach(c => {
      const discountBadge = c.discount > 0 ? `${c.discount}% OFF` : 'No discount';
      console.log(`${c.title}:`);
      console.log(`  Price: ₹${c.price}`);
      console.log(`  Original: ₹${c.originalPrice || 'N/A'}`);
      console.log(`  Discount: ${discountBadge}`);
      console.log('');
    });
    
    // Now update Python course
    console.log('\n=== Updating Python Course ===\n');
    const pythonResult = await db.collection('courses').updateOne(
      { slug: 'python' },
      { $set: { originalPrice: 2000, discount: 50, updatedAt: new Date() } }
    );
    console.log(`Modified: ${pythonResult.modifiedCount} document(s)`);
    
    // Verify
    const updated = await db.collection('courses').findOne({ slug: 'python' });
    console.log('\nPython course after update:');
    console.log(`  Title: ${updated.title}`);
    console.log(`  Price: ₹${updated.price}`);
    console.log(`  Original: ₹${updated.originalPrice}`);
    console.log(`  Discount: ${updated.discount}%`);
    console.log('\n✓ Done!');
    
    await mongoose.disconnect();
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
