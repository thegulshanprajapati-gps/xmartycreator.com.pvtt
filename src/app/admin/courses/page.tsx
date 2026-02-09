'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, Plus, Star } from 'lucide-react';
import { Money } from '@/components/currency/price';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface Course {
  _id: string;
  title: string;
  slug: string;
  level: string;
  price: number;
  duration: string;
  rating: number;
}

export default function AdminCoursesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [developmentMode, setDevelopmentMode] = useState(false);
  const [modeLoading, setModeLoading] = useState(true);
  const [modeSaving, setModeSaving] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchCoursesSettings();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses', { cache: 'no-store' });
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoursesSettings = async () => {
    try {
      const response = await fetch('/api/pages/courses', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      setDevelopmentMode(Boolean(data?.developmentMode));
    } catch (error) {
      console.error('Error fetching courses settings:', error);
    } finally {
      setModeLoading(false);
    }
  };

  const persistDevelopmentMode = async (nextMode: boolean) => {
    setModeSaving(true);
    try {
      const currentRes = await fetch('/api/pages/courses', { cache: 'no-store' });
      const currentContent = currentRes.ok ? await currentRes.json() : {};
      const payload =
        currentContent && typeof currentContent === 'object'
          ? { ...currentContent, developmentMode: nextMode }
          : { developmentMode: nextMode };

      const saveRes = await fetch('/api/pages/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!saveRes.ok) {
        throw new Error('Failed to save development mode');
      }

      toast({
        title: 'Saved',
        description: `Course development mode ${nextMode ? 'enabled' : 'disabled'}.`,
      });

      return true;
    } catch (error) {
      console.error('Error saving courses settings:', error);
      toast({
        title: 'Save failed',
        description: 'Could not update development mode. Try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setModeSaving(false);
    }
  };

  const handleToggleDevelopmentMode = async (checked: boolean) => {
    const previous = developmentMode;
    setDevelopmentMode(checked);
    const ok = await persistDevelopmentMode(checked);
    if (!ok) {
      setDevelopmentMode(previous);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this course?')) return;

    setDeleting(id);
    try {
      const response = await fetch(`/api/courses/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCourses(courses.filter(c => c._id !== id));
      }
    } catch (error) {
      console.error('Error deleting course:', error);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-8 text-foreground">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Courses</h1>
        <Button onClick={() => router.push('/admin/courses/new')} className="gap-2">
          <Plus className="h-4 w-4" />
          New Course
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 text-card-foreground">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Course Detail Development Mode</p>
            <p className="text-xs text-muted-foreground">
              ON: course click opens dummy page. OFF: normal course detail page opens.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {(modeLoading || modeSaving) && (
              <span className="text-xs text-muted-foreground">{modeLoading ? 'Loading...' : 'Saving...'}</span>
            )}
            <Switch
              checked={developmentMode}
              onCheckedChange={handleToggleDevelopmentMode}
              disabled={modeLoading || modeSaving}
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground">
        <table className="w-full">
          <thead className="bg-muted/60">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Title</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Level</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Duration</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Rating</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Price</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course._id} className="border-t border-border hover:bg-muted/40">
                <td className="px-6 py-4 text-sm text-foreground">{course.title}</td>
                <td className="px-6 py-4 text-sm text-foreground">{course.level}</td>
                <td className="px-6 py-4 text-sm text-foreground">{course.duration}</td>
                <td className="px-6 py-4 text-sm text-foreground">
                  <span className="inline-flex items-center gap-1">
                    {course.rating}
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-foreground">
                  <Money value={course.price} size="sm" className="text-foreground" symbolClassName="text-foreground" valueClassName="text-foreground" />
                </td>
                <td className="px-6 py-4 text-sm space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/courses/${course._id}/edit`)}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(course._id)}
                    disabled={deleting === course._id}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deleting === course._id ? 'Deleting...' : 'Delete'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12">
          <p className="mb-4 text-muted-foreground">No courses yet</p>
          <Button onClick={() => router.push('/admin/courses/new')}>
            Create First Course
          </Button>
        </div>
      )}
    </div>
  );
}

