import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

const normalizeCurrencyText = (value?: string) => {
  if (!value) return value;
  return value
    .replace(/â‚¹/g, '₹')
    .replace(/₱/g, '₹')
    .replace(/\bPHP\b\s?/gi, '₹')
    .replace(/\bINR\b\s?/gi, '₹');
};

const normalizeUpdate = (update: any) => ({
  ...update,
  title: normalizeCurrencyText(update.title),
  subtitle: normalizeCurrencyText(update.subtitle),
  content: normalizeCurrencyText(update.content),
  details: normalizeCurrencyText(update.details),
});

// GET all updates
export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const dbName = process.env.MONGO_DB || process.env.MONGODB_DB || 'xmartydb';
    const db = client.db(dbName);
    const updatesCollection = db.collection('updates');

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const order = searchParams.get('order') === 'asc' ? 1 : -1;

    // Build filter
    const filter: any = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    // Fetch updates
    const updates = await updatesCollection
      .find(filter)
      .sort({ [sortBy]: order })
      .toArray();

    const normalizedUpdates = updates.map(normalizeUpdate);

    return NextResponse.json(
      {
        success: true,
        count: normalizedUpdates.length,
        updates: normalizedUpdates
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ [Updates API] Error fetching updates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch updates' },
      { status: 500 }
    );
  }
}

// POST - Create new update
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, subtitle, content, details, type, isUrgent, status, author, documentLink, readMoreLink } = body;

    // Validate required fields
    if (!title || !content || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, content, type' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const dbName = process.env.MONGO_DB || process.env.MONGODB_DB || 'xmartydb';
    const db = client.db(dbName);
    const updatesCollection = db.collection('updates');

    const newUpdate = {
      title: normalizeCurrencyText(title),
      subtitle: normalizeCurrencyText(subtitle || ''),
      content: normalizeCurrencyText(content),
      details: normalizeCurrencyText(details || ''),
      type,
      isUrgent: isUrgent || false,
      status: status || 'draft',
      author: author || 'Admin',
      documentLink: documentLink || '',
      readMoreLink: readMoreLink || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await updatesCollection.insertOne(newUpdate);

    return NextResponse.json(
      {
        success: true,
        message: 'Update created successfully',
        _id: result.insertedId,
        update: { ...newUpdate, _id: result.insertedId }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ [Updates API] Error creating update:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create update' },
      { status: 500 }
    );
  }
}
