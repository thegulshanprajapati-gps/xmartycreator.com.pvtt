import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Course from '@/lib/models/course';
import { ensureNumber } from '@/lib/currency';

export async function GET(request: Request) {
  try {
    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
      console.log('🔌 [API] Connecting to MongoDB...');
      const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
      if (!mongoUri) {
        throw new Error('MONGODB_URI or MONGO_URI environment variable is not set');
      }
      await mongoose.connect(mongoUri, {
        maxPoolSize: 20,
        minPoolSize: 5,
        serverSelectionTimeoutMS: 30000,
      });
      console.log('✅ [API] MongoDB connected');
    }
    
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (slug) {
      const course = await Course.findOne({ slug }).lean();
      if (!course) {
        return NextResponse.json(
          { error: 'Course not found' },
          { status: 404 }
        );
      }
      course.price = ensureNumber(course.price, 'api:courses:price');
      course.originalPrice = ensureNumber(course.originalPrice, 'api:courses:originalPrice');
      return NextResponse.json(course);
    }

    const courses = (await Course.find({}).sort({ createdAt: -1 }).lean()).map((c) => ({
      ...c,
      price: ensureNumber(c.price, 'api:courses:list:price'),
      originalPrice: ensureNumber(c.originalPrice, 'api:courses:list:originalPrice'),
    }));
    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch courses';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
      console.log('🔌 [API] Connecting to MongoDB...');
      const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
      if (!mongoUri) {
        throw new Error('MONGODB_URI or MONGO_URI environment variable is not set');
      }
      await mongoose.connect(mongoUri, {
        maxPoolSize: 20,
        minPoolSize: 5,
        serverSelectionTimeoutMS: 30000,
      });
      console.log('✅ [API] MongoDB connected');
    }

    const data = await request.json();
    const course = new Course(data);
    await course.save();

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create course';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
