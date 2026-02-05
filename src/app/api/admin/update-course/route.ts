import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Course from '@/lib/models/course';

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
 * Update course by slug with discount information
 * Usage: POST /api/admin/update-course?slug=python
 * Body: { originalPrice?: number, discount?: number, price?: number }
 */
export async function POST(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Course slug is required' },
        { status: 400 }
      );
    }

    const data = await request.json();

    // Find course by slug
    const course = await Course.findOne({ slug });
    if (!course) {
      return NextResponse.json(
        { error: `Course with slug "${slug}" not found` },
        { status: 404 }
      );
    }

    console.log('Found course:', course.title);
    console.log('Current values:', {
      price: course.price,
      originalPrice: course.originalPrice,
      discount: course.discount,
    });

    // Update the course
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    if (updateData.price !== undefined) {
      updateData.price = Math.max(0, Number(updateData.price) || 0);
    }
    if (updateData.originalPrice !== undefined) {
      updateData.originalPrice = Math.max(0, Number(updateData.originalPrice) || 0);
    }
    if (updateData.discount !== undefined) {
      updateData.discount = Math.max(0, Math.min(100, Number(updateData.discount) || 0));
    }

    // Apply updates
    const updated = await Course.findByIdAndUpdate(
      course._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    console.log('Updated values:', {
      price: updated.price,
      originalPrice: updated.originalPrice,
      discount: updated.discount,
    });

    return NextResponse.json({
      success: true,
      message: `Course "${updated.title}" updated successfully`,
      course: {
        _id: updated._id,
        title: updated.title,
        slug: updated.slug,
        price: updated.price,
        originalPrice: updated.originalPrice,
        discount: updated.discount,
      },
    });
  } catch (error) {
    console.error('Error updating course:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update course';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
