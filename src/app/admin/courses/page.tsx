'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, Plus } from 'lucide-react';
import clientPromise from '@/lib/mongodb';
import { Money } from '@/components/currency/price';

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
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
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
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Courses</h1>
        <Button onClick={() => router.push('/admin/courses/new')} className="gap-2">
          <Plus className="h-4 w-4" />
          New Course
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium">Title</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Level</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Duration</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Rating</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Price</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course._id} className="border-t hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">{course.title}</td>
                <td className="px-6 py-4 text-sm">{course.level}</td>
                <td className="px-6 py-4 text-sm">{course.duration}</td>
                <td className="px-6 py-4 text-sm">{course.rating} ⭐</td>
                <td className="px-6 py-4 text-sm">
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
          <p className="text-gray-500 mb-4">No courses yet</p>
          <Button onClick={() => router.push('/admin/courses/new')}>
            Create First Course
          </Button>
        </div>
      )}
    </div>
  );
}
