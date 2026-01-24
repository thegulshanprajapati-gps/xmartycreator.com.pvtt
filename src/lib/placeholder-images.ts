export interface ImagePlaceholder {
  _id?: string;
  id?: string;
  title?: string;
  imageUrl?: string;
  description?: string;
  imageHint?: string;
  uploadedAt?: string;
  filename?: string;
  url?: string;
}

// All images are now managed in MongoDB database
// This array is kept empty - use API endpoints to fetch images
export const PlaceHolderImages: ImagePlaceholder[] = [];

export default PlaceHolderImages;
