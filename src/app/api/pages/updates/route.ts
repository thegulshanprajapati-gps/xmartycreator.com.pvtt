import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const dbName = process.env.MONGO_DB || process.env.MONGODB_DB || 'xmartydb';
    const db = client.db(dbName);
    const pagesCollection = db.collection('pages');

    // Try to fetch updates content
    const updatesDoc = await pagesCollection.findOne({ slug: 'updates' });

    if (updatesDoc && updatesDoc.content) {
      console.log('✅ [API] Updates page content found');
      return NextResponse.json(updatesDoc.content, { status: 200 });
    }

    // If not found, return default content with 200 status (frontend won't crash)
    console.log('⚠️  [API] Updates content not found, returning defaults');
    return NextResponse.json({
      title: 'Latest Updates & News',
      description: 'Stay informed with our latest announcements',
      updates: []
    }, { status: 200 });
  } catch (error) {
    console.error('❌ [API] Error fetching updates:', error);
    return NextResponse.json(
      {
        title: 'Latest Updates & News',
        description: 'Stay informed with our latest announcements',
        updates: []
      },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, updates } = await request.json();

    const client = await clientPromise;
    const dbName = process.env.MONGO_DB || process.env.MONGODB_DB || 'xmartydb';
    const db = client.db(dbName);
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
