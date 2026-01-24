
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useActionState, useEffect, useState } from 'react';
import { updateCoursesContent } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type Course = {
    title: string;
    description: string;
    imageId: string;
};

type CoursesContent = {
    hero: {
        title: string;
        description: string;
    };
    courses: Course[];
};

export default function AdminCoursesPage() {
    const initialContent: CoursesContent = { hero: { title: '', description: '' }, courses: [] };
    const [state, formAction, isPending] = useActionState(updateCoursesContent, { message: '', data: initialContent });
    const { toast } = useToast();
    const [coursesContent, setCoursesContent] = useState<CoursesContent>(initialContent);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const fetchContent = async () => {
        try {
          const res = await fetch('/api/pages/courses');
          if (res.ok) {
            const data = await res.json();
            setCoursesContent(data);
          }
        } catch (error) {
          console.error('Error fetching courses content:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchContent();
    }, []);

    useEffect(() => {
        if (state?.message) {
            toast({
                title: state.message.includes('Failed') ? 'Error!' : 'Success!',
                description: state.message,
                variant: state.message.includes('Failed') ? 'destructive' : 'default',
            });
        }
        if(state?.data) {
            setCoursesContent(state.data as CoursesContent);
        }
    }, [state, toast]);

    const handleAddCourse = () => {
        const newCourse: Course = { title: '', description: '', imageId: '' };
        setCoursesContent(prev => ({
            ...prev,
            courses: [...prev.courses, newCourse]
        }));
    };
    
    const handleRemoveCourse = (indexToRemove: number) => {
        setCoursesContent(prev => ({
            ...prev,
            courses: prev.courses.filter((_, index) => index !== indexToRemove)
        }));
    };

  return (
    <form action={formAction}>
        <div className="flex items-center justify-between gap-4 mb-4">
            <h1 className="text-lg font-semibold md:text-2xl">Courses Page Management</h1>
            <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleAddCourse}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Course
                </Button>
                <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save All Changes'}</Button>
            </div>
        </div>
        
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>Courses Hero Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="hero-title">Title</Label>
                    <Input id="hero-title" name="hero-title" defaultValue={coursesContent.hero.title} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="hero-description">Description</Label>
                    <Textarea id="hero-description" name="hero-description" defaultValue={coursesContent.hero.description} />
                </div>
            </CardContent>
        </Card>

        <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Course List</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                 {coursesContent.courses.map((course, index) => (
                    <Card key={index} className="relative">
                        <CardHeader>
                            <CardTitle>Course #{index + 1}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor={`course-title-${index}`}>Title</Label>
                                <Input id={`course-title-${index}`} name={`course-title-${index}`} defaultValue={course.title} />
                            </div>
                             <div className="space-y-2 mt-2">
                                <Label htmlFor={`course-description-${index}`}>Description</Label>
                                <Textarea id={`course-description-${index}`} name={`course-description-${index}`} defaultValue={course.description} />
                            </div>
                            <div className="space-y-2 mt-2">
                                <Label htmlFor={`course-imageId-${index}`}>Image ID</Label>
                                <Input id={`course-imageId-${index}`} name={`course-imageId-${index}`} defaultValue={course.imageId} />
                                <p className="text-xs text-muted-foreground">
                                    Copy ID from the <a href="/admin/dashboard/gallery" className="text-primary underline">Image Gallery</a>.
                                </p>
                            </div>
                        </CardContent>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-destructive hover:text-destructive">
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently remove the course. This action cannot be undone. You must click "Save All Changes" to finalize the deletion.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRemoveCourse(index)} className="bg-destructive hover:bg-destructive/90">
                                    Yes, remove it
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </Card>
                ))}
            </div>
             {coursesContent.courses.length === 0 && (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm p-12 text-center">
                    <div className="flex flex-col items-center gap-1">
                        <h3 className="text-2xl font-bold tracking-tight">No Courses Found</h3>
                        <p className="text-sm text-muted-foreground">Click "Add New Course" to get started.</p>
                    </div>
                </div>
            )}
        </div>
    </form>
  );
}
