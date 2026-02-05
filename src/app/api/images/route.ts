import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Image } from '@/lib/models/image';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('myapp');
    
    const images = await db.collection('images').find({}).toArray();
    
    return NextResponse.json(images || []);
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, description, imageUrl, tags } = body;

    if (!id || !title || !imageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: id, title, imageUrl' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('myapp');

    const existingImage = await db.collection('images').findOne({ id });
    if (existingImage) {
      return NextResponse.json(
        { error: 'Image with this ID already exists' },
        { status: 409 }
      );
    }

    const newImage = {
      id,
      title,
      description: description || '',
      imageUrl,
      tags: tags || [],
      uploadedAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('images').insertOne(newImage);

    return NextResponse.json({ ...newImage, _id: result.insertedId }, { status: 201 });
  } catch (error) {
    console.error('Error creating image:', error);
    return NextResponse.json({ error: 'Failed to create image' }, { status: 500 });
  }
}
