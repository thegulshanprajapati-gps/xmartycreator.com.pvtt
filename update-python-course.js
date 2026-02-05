const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://gulshan:Gulshan%40123@cluster0.wvd0w.mongodb.net/xmarty-edtech?retryWrites=true&w=majority';

async function updatePythonCourse() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');
    
    const db = mongoose.connection.db;
    console.log('Finding Python course...');
    
    const result = await db.collection('courses').findOne({ slug: 'python' });
    
    if (!result) {
      console.log('Python course not found by slug "python"');
      // Try finding by title  
      const byTitle = await db.collection('courses').findOne({ title: { $regex: 'python', $options: 'i' } });
      if (byTitle) {
        console.log('Found by title:', byTitle.title);
        console.log('Current - Price: ₹' + byTitle.price + ', Original: ₹' + byTitle.originalPrice + ', Discount: ' + byTitle.discount + '%');
      } else {
        console.log('Python course not found by title either');
        const allCourses = await db.collection('courses').find({}).toArray();
        console.log('All courses:', allCourses.map(c => c.title).join(', '));
      }
      return;
    }
    
    console.log('\nFound Python course:');
    console.log('  Title:', result.title);
    console.log('  Current Price: ₹' + result.price);
    console.log('  Original Price: ₹' + result.originalPrice);
    console.log('  Discount:', result.discount + '%');
    
    // Update with discount and original price
    console.log('\nUpdating course...');
    const updateResult = await db.collection('courses').updateOne(
      { slug: 'python' },
      {
        $set: {
          originalPrice: 2000,
          discount: 50,
          updatedAt: new Date()
        }
      }
    );
    
    console.log('Modified:', updateResult.modifiedCount, 'document(s)');
    
    // Show updated values
    console.log('\nReading updated values...');
    const updated = await db.collection('courses').findOne({ slug: 'python' });
    console.log('Updated course:');
    console.log('  Title:', updated.title);
    console.log('  Price: ₹' + updated.price);
    console.log('  Original Price: ₹' + updated.originalPrice);
    console.log('  Discount:', updated.discount + '%');
    
    console.log('\n✓ Python course updated successfully!');
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

updatePythonCourse();
