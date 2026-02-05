'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImageGallerySelector } from '@/components/admin/ImageGallerySelector';
import { CurriculumBuilder } from '@/components/admin/CurriculumBuilder';

export default function CreateCoursePage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    shortDescription: '',
    fullDescription: '',
    coverImage: '',
    duration: '',
    price: 0,
    discount: 0,
    rating: 4.5,
    studentsEnrolled: 0,
    level: 'Beginner',
    features: '',
    curriculum: [],
    instructorName: '',
    instructorImage: '',
    enrollRedirectUrl: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setError('');

    if (name === 'rating') {
      setFormData(prev => ({
        ...prev,
        [name]: Math.max(0, Math.min(5, parseFloat(value) || 0)),
      }));
    } else if (name === 'price' || name === 'discount' || name === 'studentsEnrolled') {
      setFormData(prev => ({
        ...prev,
        [name]: Math.max(0, parseInt(value) || 0),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setSubmitting(true);

      if (!formData.title?.trim()) {
        throw new Error('Title is required');
      }

      const features = (formData.features || '')
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const courseData = {
        title: formData.title?.trim() || '',
        slug: formData.slug?.trim() || formData.title?.toLowerCase().replace(/\s+/g, '-') || '',
        shortDescription: formData.shortDescription?.trim() || '',
        fullDescription: formData.fullDescription?.trim() || '',
        coverImage: formData.coverImage?.trim() || '',
        duration: formData.duration?.trim() || '',
        rating: formData.rating || 0,
        studentsEnrolled: formData.studentsEnrolled || 0,
        level: formData.level || 'Beginner',
        price: formData.price || 0,
        discount: formData.discount || 0,
        features,
        curriculum: formData.curriculum || [],
        instructorName: formData.instructorName?.trim() || '',
        instructorImage: formData.instructorImage?.trim() || '',
        enrollRedirectUrl: formData.enrollRedirectUrl?.trim() || '',
        shareCount: 0,
        enrollClickCount: 0,
        viewsCount: 0,
      };

      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData),
      });

      if (!response.ok) {
        throw new Error('Failed to create course');
      }

      router.push('/admin/courses');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error('Error creating course:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold">Create New Course</h1>
          <p className="text-gray-600 mt-2">Add a new course to your platform</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info Card */}
          <div className="bg-white p-8 rounded-lg border shadow-sm space-y-6">
            <h2 className="text-xl font-semibold">Basic Information</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Advanced React Patterns"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Slug</label>
                <Input
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="auto-generated if empty"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Short Description *</label>
              <Textarea
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                placeholder="Brief description (50-100 words)"
                className="min-h-20"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Full Description *</label>
              <Textarea
                name="fullDescription"
                value={formData.fullDescription}
                onChange={handleChange}
                placeholder="Detailed course description"
                className="min-h-24"
                required
              />
            </div>
          </div>

          {/* Cover Image Card */}
          <div className="bg-white p-8 rounded-lg border shadow-sm space-y-4">
            <h2 className="text-xl font-semibold">Cover Image</h2>
            <ImageGallerySelector
              value={formData.coverImage}
              onChange={(url) => setFormData(prev => ({ ...prev, coverImage: url }))}
              previewUrl={formData.coverImage}
            />
          </div>

          {/* Instructor Card */}
          <div className="bg-white p-8 rounded-lg border shadow-sm space-y-6">
            <h2 className="text-xl font-semibold">Instructor Information</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Instructor Name</label>
                <Input
                  name="instructorName"
                  value={formData.instructorName}
                  onChange={handleChange}
                  placeholder="e.g., John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Instructor Image URL</label>
                <Input
                  name="instructorImage"
                  value={formData.instructorImage}
                  onChange={handleChange}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {/* Course Details Card */}
          <div className="bg-white p-8 rounded-lg border shadow-sm space-y-6">
            <h2 className="text-xl font-semibold">Course Details</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Duration</label>
                <Input
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="e.g., 20 hours"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Level</label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Price ($)</label>
                <Input
                  name="price"
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Discount (%)</label>
                <Input
                  name="discount"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rating (0-5)</label>
                <Input
                  name="rating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.01"
                  value={formData.rating}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Students Enrolled</label>
                <Input
                  name="studentsEnrolled"
                  type="number"
                  min="0"
                  value={formData.studentsEnrolled}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Features (one per line)</label>
              <Textarea
                name="features"
                value={formData.features}
                onChange={handleChange}
                placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                className="min-h-24"
              />
            </div>
          </div>

          {/* Monetization Card */}
          <div className="bg-white p-8 rounded-lg border shadow-sm space-y-6">
            <h2 className="text-xl font-semibold">Monetization</h2>

            <div>
              <label className="block text-sm font-medium mb-2">Enroll Redirect URL</label>
              <Input
                name="enrollRedirectUrl"
                value={formData.enrollRedirectUrl}
                onChange={handleChange}
                placeholder="e.g., https://rzp.io/l/react-course"
              />
              <p className="text-sm text-gray-500 mt-2">Where users are sent when they click 'Enroll Now'</p>
            </div>
          </div>

          {/* Curriculum Card */}
          <div className="bg-white p-8 rounded-lg border shadow-sm space-y-6">
            <h2 className="text-xl font-semibold">Curriculum</h2>
            <CurriculumBuilder
              value={formData.curriculum}
              onChange={(curriculum) => setFormData(prev => ({ ...prev, curriculum }))}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-6">
            <Button type="submit" disabled={submitting} className="text-base py-6">
              {submitting ? 'Creating...' : 'Create Course'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={submitting}
              className="text-base py-6"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
