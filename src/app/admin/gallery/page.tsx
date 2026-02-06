'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Image from 'next/image';
import { Upload } from 'lucide-react';

interface ImageItem {
  _id?: string;
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
}

export default function GalleryPage() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    imageUrl: '',
    tags: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/images');
      const data = await res.json();
      setImages(data);
    } catch (err) {
      setError('Failed to fetch images');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormData(prev => ({
        ...prev,
        imageUrl: dataUrl,
      }));
      setError('');
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (!formData.id || !formData.title || !formData.imageUrl) {
        setError('Please fill in all required fields');
        return;
      }

      const payload = {
        id: formData.id,
        title: formData.title,
        description: formData.description,
        imageUrl: formData.imageUrl,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      };

      const res = await fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to add image');
      }

      setSuccess('Image added successfully!');
      setFormData({ id: '', title: '', description: '', imageUrl: '', tags: '' });
      fetchImages();
    } catch (err: any) {
      setError(err.message || 'Failed to add image');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this image?')) return;

    try {
      const res = await fetch(`/api/images/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');

      setSuccess('Image deleted');
      fetchImages();
    } catch (err: any) {
      setError(err.message || 'Failed to delete image');
    }
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setSuccess('ID copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold">Image Gallery</h1>
          <p className="text-gray-600 mt-2">Manage your image library</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Image Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-lg border shadow-sm space-y-4 sticky top-4">
              <h2 className="text-xl font-semibold">Add New Image</h2>

              {/* Upload Mode Toggle */}
              <div className="flex gap-2 border-b">
                <button
                  onClick={() => setUploadMode('url')}
                  className={`pb-2 px-3 font-medium text-sm transition ${
                    uploadMode === 'url'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  By URL
                </button>
                <button
                  onClick={() => setUploadMode('file')}
                  className={`pb-2 px-3 font-medium text-sm transition ${
                    uploadMode === 'file'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Upload File
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Image ID *</label>
                  <Input
                    name="id"
                    value={formData.id}
                    onChange={handleChange}
                    placeholder="e.g. course-hero-1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Image title"
                    required
                  />
                </div>

                {/* URL Input Mode */}
                {uploadMode === 'url' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Image URL *</label>
                    <Input
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleChange}
                      placeholder="https://..."
                      required={uploadMode === 'url'}
                    />
                  </div>
                )}

                {/* File Upload Mode */}
                {uploadMode === 'file' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Upload Image *</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP up to 5MB</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      required={uploadMode === 'file'}
                    />
                    {formData.imageUrl && uploadMode === 'file' && (
                      <p className="text-sm text-green-600 mt-2">✓ Image selected</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Brief description"
                    className="min-h-20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tags</label>
                  <Input
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="tag1, tag2, tag3"
                  />
                </div>

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? 'Adding...' : 'Add Image'}
                </Button>
              </form>
            </div>
          </div>

          {/* Images Grid */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 rounded-lg border shadow-sm">
              <h2 className="text-xl font-semibold mb-6">Available Images ({images.length})</h2>

              {loading ? (
                <p className="text-gray-600">Loading...</p>
              ) : images.length === 0 ? (
                <p className="text-gray-600">No images yet. Add your first image!</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {images.map((image) => (
                    <div key={image.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition">
                      <div className="relative h-40 bg-gray-100">
                        <img
                          src={image.imageUrl}
                          alt={image.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4 space-y-2">
                        <h3 className="font-semibold">{image.title}</h3>
                        <p className="text-sm text-gray-600">{image.description}</p>
                        <p className="text-xs font-mono bg-gray-100 p-2 rounded break-all">{image.id}</p>
                        {image.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {image.tags.map(tag => (
                              <span key={tag} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyId(image.id)}
                          >
                            Copy ID
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(image.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
