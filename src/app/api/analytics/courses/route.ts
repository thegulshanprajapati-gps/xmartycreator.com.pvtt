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

export async function GET() {
  try {
    await connectDB();

    const courses = await Course.find({}).lean();

    const totalEnrollClicks = courses.reduce((sum, c) => sum + (c.enrollClickCount || 0), 0);
    const totalShares = courses.reduce((sum, c) => sum + (c.shareCount || 0), 0);
    const totalViewsCount = courses.reduce((sum, c) => sum + (c.viewsCount || 0), 0);
    const totalCourses = courses.length;

    const conversionRate = totalViewsCount > 0 
      ? ((totalEnrollClicks / totalViewsCount) * 100).toFixed(1)
      : '0.0';

    const courseMetrics = courses
      .sort((a, b) => (b.enrollClickCount || 0) - (a.enrollClickCount || 0))
      .map(c => ({
        _id: c._id,
        title: c.title,
        slug: c.slug,
        enrollClickCount: c.enrollClickCount || 0,
        shareCount: c.shareCount || 0,
        viewsCount: c.viewsCount || 0,
      }));

    const response = {
      totalCourses,
      totalEnrollClicks,
      totalShares,
      totalViewsCount,
      conversionRate,
      courses: courseMetrics,
      summary: {
        totalCourses,
        totalEnrollClicks,
        totalShares,
        conversionRate,
        mostPopularCourse: courseMetrics[0] || null,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
