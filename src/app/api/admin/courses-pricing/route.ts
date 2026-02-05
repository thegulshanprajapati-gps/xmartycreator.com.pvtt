import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Course from '@/lib/models/course';
import { ensureNumber } from '@/lib/currency';

async function connectDB() {
  if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI or MONGO_URI environment variable is not set');
    }
    await mongoose.connect(mongoUri, {
      maxPoolSize: 20,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 30000,
    });
  }
}

/**
 * Get all courses with pricing info
 * Usage: GET /api/admin/courses-pricing
 */
export async function GET(request: Request) {
  try {
    await connectDB();

    const courses = await Course.find({}).select('_id title slug price originalPrice discount').lean();

    const coursesList = courses.map(course => ({
      _id: course._id,
      title: course.title,
      slug: course.slug,
      price: ensureNumber(course.price, 'api:admin:courses-pricing:price'),
      originalPrice: ensureNumber(course.originalPrice, 'api:admin:courses-pricing:originalPrice'),
      discount: ensureNumber(course.discount, 'api:admin:courses-pricing:discount'),
      hasDiscount: course.discount > 0 || (course.originalPrice && course.originalPrice > course.price),
    }));

    return NextResponse.json({
      total: coursesList.length,
      courses: coursesList,
    });
  } catch (error) {
    console.error('Error fetching courses pricing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}
