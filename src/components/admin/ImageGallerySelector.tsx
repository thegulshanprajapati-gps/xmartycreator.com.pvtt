'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ImageIcon, X } from 'lucide-react';

interface GalleryImage {
  _id?: string;
  id?: string;
  filename?: string;
  title?: string;
  imageUrl?: string;
  url?: string;
  uploadedAt?: string;
}

interface ImageGallerySelectorProps {
  value?: string;
  onChange: (imageUrl: string) => void;
  previewUrl?: string;
}

export function ImageGallerySelector({
  value,
  onChange,
  previewUrl,
}: ImageGallerySelectorProps) {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open) {
      fetchGalleryImages();
    }
  }, [open]);

  const fetchGalleryImages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/images');
      if (response.ok) {
        const data = await response.json();
        // Handle both array and object responses
        let imagesList = Array.isArray(data) ? data : (data.images || data.data || []);
        // Ensure all images have required fields
        imagesList = imagesList.map((img: any) => ({
          _id: img._id || img.id || '',
          filename: img.filename || img.title || '',
          url: img.url || img.imageUrl || '',
          uploadedAt: img.uploadedAt || '',
        }));
        setImages(imagesList);
      }
    } catch (error) {
      console.error('Error fetching gallery images:', error);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredImages = images.filter(img =>
    (img.filename || '')?.toLowerCase?.().includes(searchTerm.toLowerCase()) || false
  );

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" className="w-full justify-start gap-2">
            <ImageIcon className="h-4 w-4" />
            {value ? 'Change Image' : 'Select from Gallery'}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Cover Image</DialogTitle>
            <DialogDescription>Choose an image from your gallery</DialogDescription>
          </DialogHeader>

          <Input
            placeholder="Search images..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">Loading gallery...</p>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">
                {images.length === 0 ? 'No images in gallery' : 'No matching images'}
              </p>
            </div>
          ) : (
            <div className="overflow-y-auto grid grid-cols-4 gap-4 pr-4">
              {filteredImages.map((image) => (
                <button
                  key={image._id}
                  type="button"
                  onClick={() => {
                    onChange(image.url || '');
                    setOpen(false);
                  }}
                  className={`relative rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all ${
                    value === image.url ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <img
                    src={image.url || ''}
                    alt={image.filename || 'Gallery image'}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {previewUrl && (
        <div className="mt-3 relative w-full max-w-xs">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-40 object-cover rounded-lg border"
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
