import { NextResponse } from 'next/server';
import { getPageContent, clearPageCache } from '@/lib/page-content-cache';
import clientPromise from '@/lib/mongodb';

// GET /api/pages/gallery
// Returns the gallery placeholder images so every admin selector can use one source of truth.
export async function GET() {
  try {
    const content = await getPageContent('gallery', true);
    let images = content?.placeholderImages || [];
    const dbName = process.env.MONGO_DB || process.env.MONGODB_DB || 'xmartydb';

    // Fallback: if no placeholderImages were saved via the pages document,
    // pull from the dedicated `images` collection so the admin selectors still work.
    if (!images.length) {
      const client = await clientPromise;
      const db = client.db(dbName);
      const collectionImages = await db.collection('images').find({}).toArray();
      images = collectionImages.map((img: any) => ({
        id: img.id,
        title: img.title || img.filename || '',
        description: img.description || '',
        imageUrl: img.imageUrl,
        imageHint: img.imageHint || img.tags?.join(', ') || 'gallery image',
        uploadedAt: img.uploadedAt,
      })).filter((img) => img.id && img.imageUrl);
    }

    // Legacy fallback: check myapp if primary DB is empty
    if (!images.length && dbName !== 'myapp') {
      const client = await clientPromise;
      const legacyDb = client.db('myapp');
      const legacyGalleryPage = await legacyDb.collection('pages').findOne({ slug: 'gallery' });
      images = legacyGalleryPage?.content?.placeholderImages || [];

      if (!images.length) {
        const legacyImages = await legacyDb.collection('images').find({}).toArray();
        images = legacyImages.map((img: any) => ({
          id: img.id,
          title: img.title || img.filename || '',
          description: img.description || '',
          imageUrl: img.imageUrl,
          imageHint: img.imageHint || img.tags?.join(', ') || 'gallery image',
          uploadedAt: img.uploadedAt,
        })).filter((img) => img.id && img.imageUrl);
      }
    }

    return NextResponse.json({ placeholderImages: images });
  } catch (error) {
    console.error('❌ [API] Failed to load gallery content:', error);
    return NextResponse.json(
      { error: 'Failed to load gallery images' },
      { status: 500 }
    );
  }
}

// POST /api/pages/gallery
// Upserts a gallery image. This mirrors the server action but keeps API parity for future clients.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, imageUrl, description, title = '', imageHint = 'custom image' } = body || {};

    if (!id || !imageUrl || !description) {
      return NextResponse.json(
        { error: 'id, imageUrl, and description are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const dbName = process.env.MONGO_DB || process.env.MONGODB_DB || 'xmartydb';
    const db = client.db(dbName);

    const galleryPage = await db.collection('pages').findOne({ slug: 'gallery' });
    const placeholderImages = galleryPage?.content?.placeholderImages || [];

    const existingIndex = placeholderImages.findIndex((img: any) => img.id === id);
    const newImage = { id, imageUrl, description, title, imageHint };

    if (existingIndex >= 0) {
      placeholderImages[existingIndex] = newImage;
    } else {
      placeholderImages.push(newImage);
    }

    await db.collection('pages').updateOne(
      { slug: 'gallery' },
      { $set: { slug: 'gallery', content: { placeholderImages } } },
      { upsert: true }
    );

    clearPageCache('gallery');

    // Always return the latest list so callers stay in sync.
    return NextResponse.json({ placeholderImages });
  } catch (error) {
    console.error('❌ [API] Failed to save gallery image:', error);
    return NextResponse.json(
      { error: 'Failed to save gallery image' },
      { status: 500 }
    );
  }
}
