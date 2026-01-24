import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('myapp');
    const pagesCollection = db.collection('pages');

    // Try to fetch updates content
    const updatesDoc = await pagesCollection.findOne({ slug: 'updates' });

    if (updatesDoc && updatesDoc.content) {
      return NextResponse.json(updatesDoc.content, { status: 200 });
    }

    // If not found, return 404 (frontend will use fallback)
    return NextResponse.json(
      { error: 'Updates not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error fetching updates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch updates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, updates } = await request.json();

    const client = await clientPromise;
    const db = client.db('myapp');
    const pagesCollection = db.collection('pages');

    // Update or insert the updates content
    const result = await pagesCollection.updateOne(
      { slug: 'updates' },
      {
        $set: {
          slug: 'updates',
          content: {
            title,
            description,
            updates
          },
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    return NextResponse.json(
      { message: 'Updates saved successfully', result },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving updates:', error);
    return NextResponse.json(
      { error: 'Failed to save updates' },
      { status: 500 }
    );
  }
}
