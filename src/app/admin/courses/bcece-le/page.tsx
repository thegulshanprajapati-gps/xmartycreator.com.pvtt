'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

const TARGET_SLUG = 'bcece-le';

type CoursePayload = {
  _id?: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  coverImage: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  price: number;
  discount: number;
  rating: number;
  studentsEnrolled: number;
  enrollRedirectUrl: string;
  featuresText: string;
  instructorName: string;
  instructorTitle: string;
  instructorBio: string;
  instructorImage: string;
};

const defaultForm: CoursePayload = {
  _id: '',
  title: 'BCECE LE 2026',
  slug: TARGET_SLUG,
  shortDescription: '',
  fullDescription: '',
  coverImage: '',
  duration: '',
  level: 'Beginner',
  price: 0,
  discount: 0,
  rating: 4.5,
  studentsEnrolled: 0,
  enrollRedirectUrl: '',
  featuresText: '',
  instructorName: '',
  instructorTitle: '',
  instructorBio: '',
  instructorImage: '',
};

function asNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function AdminBceceLeCoursePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isExistingCourse, setIsExistingCourse] = useState(false);
  const [formData, setFormData] = useState<CoursePayload>(defaultForm);

  useEffect(() => {
    const loadCourse = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`/api/courses?slug=${TARGET_SLUG}`, { cache: 'no-store' });
        if (response.status === 404) {
          setIsExistingCourse(false);
          setFormData(defaultForm);
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to load BCECE LE course');
        }

        const data = await response.json();
        const instructor = data?.instructor && typeof data.instructor === 'object' ? data.instructor : {};

        setFormData({
          _id: String(data?._id || ''),
          title: typeof data?.title === 'string' ? data.title : defaultForm.title,
          slug: TARGET_SLUG,
          shortDescription: typeof data?.shortDescription === 'string' ? data.shortDescription : '',
          fullDescription: typeof data?.fullDescription === 'string' ? data.fullDescription : '',
          coverImage: typeof data?.coverImage === 'string' ? data.coverImage : '',
          duration: typeof data?.duration === 'string' ? data.duration : '',
          level: data?.level === 'Advanced' || data?.level === 'Intermediate' ? data.level : 'Beginner',
          price: Number(data?.price) || 0,
          discount: Number(data?.discount) || 0,
          rating: Number(data?.rating) || 4.5,
          studentsEnrolled: Number(data?.studentsEnrolled) || 0,
          enrollRedirectUrl: typeof data?.enrollRedirectUrl === 'string' ? data.enrollRedirectUrl : '',
          featuresText: Array.isArray(data?.features) ? data.features.filter(Boolean).join('\n') : '',
          instructorName:
            typeof instructor?.name === 'string'
              ? instructor.name
              : typeof data?.instructorName === 'string'
                ? data.instructorName
                : '',
          instructorTitle: typeof instructor?.title === 'string' ? instructor.title : '',
          instructorBio: typeof instructor?.bio === 'string' ? instructor.bio : '',
          instructorImage:
            typeof instructor?.image === 'string'
              ? instructor.image
              : typeof data?.instructorImage === 'string'
                ? data.instructorImage
                : '',
        });
        setIsExistingCourse(true);
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'Failed to load course';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, []);

  const features = useMemo(
    () =>
      formData.featuresText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
    [formData.featuresText]
  );

  const handleChange = (field: keyof CoursePayload, value: string) => {
    setError('');
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.title.trim()) {
      setError('Title is required.');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      title: formData.title.trim(),
      slug: TARGET_SLUG,
      shortDescription: formData.shortDescription.trim(),
      fullDescription: formData.fullDescription.trim(),
      coverImage: formData.coverImage.trim(),
      duration: formData.duration.trim(),
      level: formData.level,
      price: Math.max(0, asNumber(String(formData.price))),
      discount: Math.max(0, Math.min(100, asNumber(String(formData.discount)))),
      rating: Math.max(0, Math.min(5, asNumber(String(formData.rating), 4.5))),
      studentsEnrolled: Math.max(0, asNumber(String(formData.studentsEnrolled))),
      enrollRedirectUrl: formData.enrollRedirectUrl.trim(),
      features,
      instructorName: formData.instructorName.trim(),
      instructorImage: formData.instructorImage.trim(),
      instructor: {
        name: formData.instructorName.trim(),
        title: formData.instructorTitle.trim(),
        bio: formData.instructorBio.trim(),
        image: formData.instructorImage.trim(),
      },
    };

    try {
      const endpoint = isExistingCourse && formData._id
        ? `/api/courses/${formData._id}`
        : '/api/courses';
      const method = isExistingCourse && formData._id ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'Failed to save BCECE LE course');
      }

      const saved = await response.json();
      const savedId = String(saved?._id || saved?.course?._id || formData._id || '');

      setFormData((prev) => ({ ...prev, _id: savedId, slug: TARGET_SLUG }));
      setIsExistingCourse(true);

      toast({
        title: 'Saved',
        description: 'BCECE LE course updated successfully.',
      });
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Failed to save course';
      setError(message);
      toast({
        title: 'Save failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-3">
        <h1 className="text-2xl font-semibold">BCECE LE Course Editor</h1>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">BCECE LE Course Editor</h1>
          <p className="text-sm text-muted-foreground">
            Route: <code>/bcece-le</code> | Slug: <code>{TARGET_SLUG}</code>
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/bcece-le" target="_blank">Open Protected Page</Link>
        </Button>
      </div>

      {!isExistingCourse && (
        <Alert>
          <AlertDescription>
            BCECE LE course record not found. Fill details and click save to create it.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <h2 className="text-lg font-semibold">Basic Details</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="BCECE LE 2026"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Slug</label>
              <Input value={TARGET_SLUG} disabled />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Short Description</label>
            <Textarea
              value={formData.shortDescription}
              onChange={(e) => handleChange('shortDescription', e.target.value)}
              className="min-h-20"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Description</label>
            <Textarea
              value={formData.fullDescription}
              onChange={(e) => handleChange('fullDescription', e.target.value)}
              className="min-h-28"
            />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-5 space-y-4">
          <h2 className="text-lg font-semibold">Pricing & Course Info</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Price</label>
              <Input
                type="number"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: asNumber(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Discount (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.discount}
                onChange={(e) => setFormData((prev) => ({ ...prev, discount: asNumber(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Rating</label>
              <Input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={(e) => setFormData((prev) => ({ ...prev, rating: asNumber(e.target.value, 4.5) }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Students</label>
              <Input
                type="number"
                min="0"
                value={formData.studentsEnrolled}
                onChange={(e) => setFormData((prev) => ({ ...prev, studentsEnrolled: asNumber(e.target.value) }))}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Duration</label>
              <Input
                value={formData.duration}
                onChange={(e) => handleChange('duration', e.target.value)}
                placeholder="6 Months"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Level</label>
              <select
                value={formData.level}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    level: e.target.value as CoursePayload['level'],
                  }))
                }
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-5 space-y-4">
          <h2 className="text-lg font-semibold">Media & Links</h2>
          <div className="space-y-2">
            <label className="text-sm font-medium">Cover Image URL</label>
            <Input
              value={formData.coverImage}
              onChange={(e) => handleChange('coverImage', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Enroll Redirect URL</label>
            <Input
              value={formData.enrollRedirectUrl}
              onChange={(e) => handleChange('enrollRedirectUrl', e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Features (one per line)</label>
            <Textarea
              value={formData.featuresText}
              onChange={(e) => handleChange('featuresText', e.target.value)}
              className="min-h-28"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Current feature count: {features.length}
          </p>
        </div>

        <div className="rounded-lg border bg-card p-5 space-y-4">
          <h2 className="text-lg font-semibold">Instructor</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={formData.instructorName}
                onChange={(e) => handleChange('instructorName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={formData.instructorTitle}
                onChange={(e) => handleChange('instructorTitle', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Image URL</label>
            <Input
              value={formData.instructorImage}
              onChange={(e) => handleChange('instructorImage', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Bio</label>
            <Textarea
              value={formData.instructorBio}
              onChange={(e) => handleChange('instructorBio', e.target.value)}
              className="min-h-24"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save BCECE LE Course'}
          </Button>
          <Button asChild variant="outline" type="button">
            <Link href="/admin/courses">Back to Courses</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}

