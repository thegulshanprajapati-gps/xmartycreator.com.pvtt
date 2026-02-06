import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://gulshan:Gulshan%40123@cluster0.wvd0w.mongodb.net/xmarty-edtech?retryWrites=true&w=majority';

async function updatePythonCourse() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const result = await db.collection('courses').findOne({ slug: 'python' });
    
    if (!result) {
      console.log('Python course not found');
      return;
    }
    
    console.log('Found Python course:');
    console.log('  Title:', result.title);
    console.log('  Current Price:', result.price);
    console.log('  Original Price:', result.originalPrice);
    console.log('  Discount:', result.discount);
    
    // Update with discount and original price
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
    
    console.log('\nUpdate result:', updateResult.modifiedCount, 'document(s) modified');
    
    // Show updated values
    const updated = await db.collection('courses').findOne({ slug: 'python' });
    console.log('\nUpdated course:');
    console.log('  Title:', updated.title);
    console.log('  Price:', updated.price);
    console.log('  Original Price:', updated.originalPrice);
    console.log('  Discount:', updated.discount);
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

updatePythonCourse();
