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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid course ID' },
        { status: 400 }
      );
    }

    const course = await Course.findById(id).lean();
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const data = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid course ID' },
        { status: 400 }
      );
    }

    // Ensure all numeric fields are valid
    const updateData = {
      ...data,
      price: Number(data.price) || 0,
      discount: Math.max(0, Math.min(100, Number(data.discount) || 0)),
      rating: Math.max(0, Math.min(5, Number(data.rating) || 0)),
      studentsCount: Math.max(0, Number(data.studentsCount) || 0),
      studentsEnrolled: Math.max(0, Number(data.studentsEnrolled) || 0),
      shareCount: Math.max(0, Number(data.shareCount) || 0),
      enrollClickCount: Math.max(0, Number(data.enrollClickCount) || 0),
      viewsCount: Math.max(0, Number(data.viewsCount) || 0),
      updatedAt: new Date(),
    };

    const course = await Course.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error updating course:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update course';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid course ID' },
        { status: 400 }
      );
    }

    const course = await Course.findByIdAndDelete(id);

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}
