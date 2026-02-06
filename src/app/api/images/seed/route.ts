import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db('myapp');
    const imagesCollection = db.collection('images');

    // Images are managed via MongoDB - no hardcoded seed data needed
    const existingCount = await imagesCollection.countDocuments();

    return NextResponse.json(
      { 
        message: 'Images collection is ready',
        count: existingCount,
        note: 'Images are stored in MongoDB database'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error initializing images:', error);
    return NextResponse.json(
      { error: 'Failed to initialize images collection' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('myapp');
    const imagesCollection = db.collection('images');

    const count = await imagesCollection.countDocuments();

    return NextResponse.json({
      message: 'Images collection status',
      count: count,
      note: 'All images are stored in MongoDB'
    });
  } catch (error) {
    console.error('Error checking images:', error);
    return NextResponse.json(
      { error: 'Failed to check images collection' },
      { status: 500 }
    );
  }
}
