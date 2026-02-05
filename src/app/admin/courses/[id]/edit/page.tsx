'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImageGallerySelector } from '@/components/admin/ImageGallerySelector';
import { CurriculumBuilder } from '@/components/admin/CurriculumBuilder';

interface Course {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  coverImage: string;
  duration: string;
  price: number;
  discount: number;
  rating: number;
  studentsEnrolled: number;
  level: string;
  features: string[];
  curriculum: any[];
  instructorName: string;
  instructorImage: string;
  enrollRedirectUrl: string;
  shareCount: number;
  enrollClickCount: number;
  viewsCount: number;
}

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState<Course>({
    _id: '',
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
    features: [],
    curriculum: [],
    instructorName: '',
    instructorImage: '',
    enrollRedirectUrl: '',
    shareCount: 0,
    enrollClickCount: 0,
    viewsCount: 0,
  });

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await fetch(`/api/courses/${id}`);
        if (!response.ok) {
          throw new Error('Failed to load course');
        }

        const data = await response.json();
        setFormData(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        setError(message);
        console.error('Error loading course:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCourse();
    }
  }, [id]);

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

      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }

      const features = typeof formData.features === 'string'
        ? formData.features.split('\n').map(f => f.trim()).filter(f => f.length > 0)
        : formData.features;

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
      };

      const response = await fetch(`/api/courses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData),
      });

      if (!response.ok) {
        throw new Error('Failed to update course');
      }

      router.push('/admin/courses');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error('Error updating course:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/courses/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete course');
      }

      router.push('/admin/courses');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error('Error deleting course:', err);
    } finally {
      setSubmitting(false);
      setDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <p className="text-gray-600">Loading course...</p>
      </div>
    );
  }

  const featuresText = Array.isArray(formData.features)
    ? formData.features.join('\n')
    : formData.features || '';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Edit Course</h1>
            <p className="text-gray-600 mt-2">Update course details</p>
          </div>
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
                  value={formData.title ?? ''}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Slug</label>
                <Input
                  name="slug"
                  value={formData.slug ?? ''}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Short Description *</label>
              <Textarea
                name="shortDescription"
                value={formData.shortDescription ?? ''}
                onChange={handleChange}
                className="min-h-20"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Full Description *</label>
              <Textarea
                name="fullDescription"
                value={formData.fullDescription ?? ''}
                onChange={handleChange}
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
                  value={formData.instructorName ?? ''}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Instructor Image URL</label>
                <Input
                  name="instructorImage"
                  value={formData.instructorImage ?? ''}
                  onChange={handleChange}
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
                  value={formData.duration ?? ''}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Level</label>
                <select
                  name="level"
                  value={formData.level ?? 'Beginner'}
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
                  value={formData.price ?? 0}
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
                  value={formData.discount ?? 0}
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
                  value={formData.rating ?? 4.5}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Students Enrolled</label>
                <Input
                  name="studentsEnrolled"
                  type="number"
                  min="0"
                  value={formData.studentsEnrolled ?? 0}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Features (one per line)</label>
              <Textarea
                name="features"
                value={featuresText || ''}
                onChange={handleChange}
                className="min-h-24"
              />
            </div>
          </div>

          {/* Analytics Card (Read-only) */}
          <div className="bg-white p-8 rounded-lg border shadow-sm space-y-6">
            <h2 className="text-xl font-semibold">Analytics</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Enroll Clicks</label>
                <Input
                  type="number"
                  value={formData.enrollClickCount ?? 0}
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Share Count</label>
                <Input
                  type="number"
                  value={formData.shareCount ?? 0}
                  disabled
                  className="bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Monetization Card */}
          <div className="bg-white p-8 rounded-lg border shadow-sm space-y-6">
            <h2 className="text-xl font-semibold">Monetization</h2>

            <div>
              <label className="block text-sm font-medium mb-2">Enroll Redirect URL</label>
              <Input
                name="enrollRedirectUrl"
                value={formData.enrollRedirectUrl ?? ''}
                onChange={handleChange}
                placeholder="e.g., https://rzp.io/l/react-course"
              />
              <p className="text-sm text-gray-500 mt-2">Where users are sent when they click "Enroll Now"</p>
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
              {submitting ? 'Saving...' : 'Save Course'}
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
            <Button
              type="button"
              variant="destructive"
              onClick={() => setDeleteConfirm(!deleteConfirm)}
              disabled={submitting}
              className="text-base py-6 ml-auto"
            >
              {deleteConfirm ? 'Hide' : 'Delete'}
            </Button>
          </div>

          {deleteConfirm && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700 mb-4">Are you sure you want to delete this course? This action cannot be undone.</p>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={submitting}
              >
                Confirm Delete
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
