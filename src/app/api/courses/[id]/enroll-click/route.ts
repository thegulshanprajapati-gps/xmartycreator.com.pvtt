import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    const course = await Course.findByIdAndUpdate(
      id,
      { 
        $inc: { enrollClickCount: 1 },
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      enrollClickCount: course.enrollClickCount || 0,
    });
  } catch (error) {
    console.error('Error tracking enroll click:', error);
    return NextResponse.json(
      { error: 'Failed to track enroll click' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    const course = await Course.findById(id).lean();

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({
      enrollClickCount: course.enrollClickCount || 0,
    });
  } catch (error) {
    console.error('Error fetching enroll click count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enroll click count' },
      { status: 500 }
    );
  }
}
