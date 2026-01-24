import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate MongoDB ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid update ID' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('myapp');
    const updatesCollection = db.collection('updates');

    const update = await updatesCollection.findOne({
      _id: new ObjectId(id)
    });

    if (!update) {
      return NextResponse.json(
        { success: false, error: 'Update not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, update },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ [Updates API] Error fetching update:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch update' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate MongoDB ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid update ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, subtitle, content, details, type, isUrgent, status, author, documentLink, readMoreLink } = body;

    const client = await clientPromise;
    const db = client.db('myapp');
    const updatesCollection = db.collection('updates');

    // Build update object
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (content !== undefined) updateData.content = content;
    if (details !== undefined) updateData.details = details;
    if (type !== undefined) updateData.type = type;
    if (isUrgent !== undefined) updateData.isUrgent = isUrgent;
    if (status !== undefined) updateData.status = status;
    if (author !== undefined) updateData.author = author;
    if (documentLink !== undefined) updateData.documentLink = documentLink;
    if (readMoreLink !== undefined) updateData.readMoreLink = readMoreLink;
    updateData.updatedAt = new Date();

    const result = await updatesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Update not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Update modified successfully',
        modifiedCount: result.modifiedCount
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ [Updates API] Error updating update:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update update' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate MongoDB ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid update ID' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('myapp');
    const updatesCollection = db.collection('updates');

    const result = await updatesCollection.deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Update not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Update deleted successfully',
        deletedCount: result.deletedCount
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ [Updates API] Error deleting update:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete update' },
      { status: 500 }
    );
  }
}
