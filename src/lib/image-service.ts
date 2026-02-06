import { getPageContent } from './page-content-cache';

import clientPromise from './mongodb';

export interface ImagePlaceholder {
  _id?: string;
  id: string;
  title?: string;
  imageUrl: string;
  description?: string;
  imageHint?: string;
  uploadedAt?: string;
  filename?: string;
  url?: string;
}

// Helper: fetch placeholderImages; if empty, fallback to images collection
function normalizeId(id?: string) {
  return (id || "").replace(/\s+/g, "").toLowerCase();
}

function findImageById(images: ImagePlaceholder[], imageId: string): ImagePlaceholder | undefined {
  const target = normalizeId(imageId);
  return images.find((img) => normalizeId(img.id) === target || normalizeId(img.title || "") === target);
}

async function loadGalleryImages(): Promise<ImagePlaceholder[]> {
  const galleryContent = await getPageContent('gallery', true);
  let images: ImagePlaceholder[] = galleryContent?.placeholderImages || [];

  if (!images.length && Array.isArray((galleryContent as any)?.images)) {
    images = (galleryContent as any).images;
  }

  if (images.length) {
    images = images.filter((img: any) => img?.id && img?.imageUrl);
  }

  if (!images.length) {
    try {
      const client = await clientPromise;
      const primaryDbName = process.env.MONGO_DB || process.env.MONGODB_DB || 'xmartydb';
      const db = client.db(primaryDbName);
      const docs = await db.collection('images').find({}).toArray();
      images = docs
        .map((img: any) => ({
          id: img.id,
          title: img.title || img.filename || '',
          description: img.description || '',
          imageUrl: img.imageUrl,
          imageHint: img.imageHint || (Array.isArray(img.tags) ? img.tags.join(', ') : 'gallery image'),
          uploadedAt: img.uploadedAt,
        }))
          .filter((img: any) => img.id && img.imageUrl);

      // Fallback to legacy DB if still empty
      if (!images.length && primaryDbName !== 'myapp') {
        const legacyDb = client.db('myapp');
        const legacyGalleryPage = await legacyDb.collection('pages').findOne({ slug: 'gallery' });
        const legacyImages = legacyGalleryPage?.content?.placeholderImages
          || legacyGalleryPage?.content?.images
          || [];

        images = Array.isArray(legacyImages)
          ? legacyImages.filter((img: any) => img?.id && img?.imageUrl)
          : [];

        if (!images.length) {
          const legacyDocs = await legacyDb.collection('images').find({}).toArray();
          images = legacyDocs
            .map((img: any) => ({
              id: img.id,
              title: img.title || img.filename || '',
              description: img.description || '',
              imageUrl: img.imageUrl,
              imageHint: img.imageHint || (Array.isArray(img.tags) ? img.tags.join(', ') : 'gallery image'),
              uploadedAt: img.uploadedAt,
            }))
            .filter((img: any) => img.id && img.imageUrl);
        }
      }
    } catch (err) {
      console.error('? [Image Service] Fallback fetch from images collection failed', err);
    }
  }

  return images;
}



export async function getImageById(imageId: string): Promise<ImagePlaceholder | null> {
  try {
    const images = await loadGalleryImages();
    const image = findImageById(images, imageId);
    
    if (image) {
      console.log(`✅ [Image Service] Found image with ID: ${imageId}`);
      return image;
    }
    
    console.log(`⚠️  [Image Service] Image not found with ID: ${imageId}`);
    return null;
  } catch (error) {
    console.error(`❌ [Image Service] Error fetching image with ID: ${imageId}`, error);
    return null;
  }
}

/**
 * Fetch multiple images by their IDs
 * @param imageIds - Array of image IDs
 * @returns Array of image objects found in the gallery
 */
export async function getImagesByIds(imageIds: string[]): Promise<ImagePlaceholder[]> {
  try {
    const allImages = await loadGalleryImages();
    
    const foundImages = imageIds
      .map(id => findImageById(allImages, id))
      .filter((img): img is ImagePlaceholder => img !== undefined);
    
    console.log(`✅ [Image Service] Found ${foundImages.length} out of ${imageIds.length} images`);
    return foundImages;
  } catch (error) {
    console.error(`❌ [Image Service] Error fetching images`, error);
    return [];
  }
}

/**
 * Fetch all images from the gallery
 * @returns Array of all images in the gallery
 */
export async function getAllImages(): Promise<ImagePlaceholder[]> {
  try {
    const images = await loadGalleryImages();
    console.log(`✅ [Image Service] Fetched ${images.length} images from gallery`);
    return images;
  } catch (error) {
    console.error(`❌ [Image Service] Error fetching all images`, error);
    return [];
  }
}

/**
 * Find images by substring in title or description (for search)
 * @param searchTerm - Search string
 * @returns Array of matching images
 */
export async function searchImages(searchTerm: string): Promise<ImagePlaceholder[]> {
  try {
    const allImages = await getAllImages();
    const lowerTerm = searchTerm.toLowerCase();
    
    return allImages.filter(img => 
      (img.title?.toLowerCase().includes(lowerTerm) || false) ||
      (img.description?.toLowerCase().includes(lowerTerm) || false) ||
      (img.id?.toLowerCase().includes(lowerTerm) || false)
    );
  } catch (error) {
    console.error(`❌ [Image Service] Error searching images`, error);
    return [];
  }
}
