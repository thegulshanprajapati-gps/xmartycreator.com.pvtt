'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useActionState, useEffect, useState } from 'react';
import { updateTestimonials } from './actions';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Star } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/components/ui/alert-dialog";

type Review = {
  name: string;
  role: string;
  testimonial: string;
  rating: number;
  avatar: string;
};

type Testimonials = {
  title: string;
  description: string;
  reviews: Review[];
};

interface TestimonialsManagerProps {
  initialTestimonials: Testimonials;
}

export default function TestimonialsManager({ initialTestimonials }: TestimonialsManagerProps) {
  const [state, formAction, isPending] = useActionState(updateTestimonials, { 
    message: '', 
    data: initialTestimonials 
  });
  const { toast } = useToast();
  const [testimonials, setTestimonials] = useState<Testimonials>(initialTestimonials);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await fetch('/api/pages/gallery');
        if (res.ok) {
          const data = await res.json();
          setGalleryImages(data?.placeholderImages || []);
        }
      } catch (error) {
        console.error('Error fetching gallery images:', error);
      }
    };

    fetchGallery();
  }, []);

  useEffect(() => {
    if (state?.message) {
      toast({
        title: state.message.includes('Failed') ? 'Error!' : 'Success!',
        description: state.message,
        variant: state.message.includes('Failed') ? 'destructive' : 'default',
      });
    }
    if (state?.data) {
      setTestimonials(state.data as Testimonials);
    }
  }, [state, toast]);

  const handleAddReview = () => {
    setTestimonials(prev => ({
      ...prev,
      reviews: [...(prev.reviews || []), {
        name: '',
        role: '',
        testimonial: '',
        rating: 5,
        avatar: ''
      }]
    }));
  };

  const handleRemoveReview = (indexToRemove: number) => {
    setTestimonials(prev => ({
      ...prev,
      reviews: (prev.reviews || []).filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleArrayChange = (index: number, field: string, value: string | number) => {
    setTestimonials(prev => {
      const newTestimonials = JSON.parse(JSON.stringify(prev));
      (newTestimonials.reviews[index] as any)[field] = value;
      return newTestimonials;
    });
  };

  return (
    <form action={formAction}>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold">Manage Testimonials</h2>
          <p className="text-sm text-muted-foreground">Add, edit, or remove customer reviews and testimonials</p>
        </div>
        <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save Changes'}</Button>
      </div>

      <div className="grid gap-6">
        {/* Section Info */}
        <Card>
          <CardHeader>
            <CardTitle>Section Information</CardTitle>
            <CardDescription>Configure the testimonials section header</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testimonials-title">Section Title</Label>
              <Input 
                id="testimonials-title" 
                name="testimonials-title"
                value={testimonials.title} 
                onChange={e => setTestimonials({...testimonials, title: e.target.value})} 
                placeholder="e.g., What Our Students Say"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="testimonials-description">Section Description</Label>
              <Textarea 
                id="testimonials-description" 
                name="testimonials-description"
                value={testimonials.description} 
                onChange={e => setTestimonials({...testimonials, description: e.target.value})}
                placeholder="e.g., Hear from our happy students and course graduates"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Reviews List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Customer Reviews ({testimonials.reviews?.length || 0})</CardTitle>
                <CardDescription>Manage individual testimonials and ratings</CardDescription>
              </div>
              <Button type="button" variant="outline" onClick={handleAddReview}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Review
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[600px] overflow-y-auto space-y-4 pr-4">
              {(testimonials.reviews || []).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No testimonials yet. Add your first review!</p>
                </div>
              ) : (
                (testimonials.reviews || []).map((review, index) => (
                  <Card key={index} className="p-4 relative">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-2 right-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Testimonial?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove this testimonial from {review.name}. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleRemoveReview(index)} 
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <div className="space-y-4">
                      {/* Avatar and Name/Role */}
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          {review.avatar ? (
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={review.avatar} alt={review.name} />
                              <AvatarFallback>{review.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                              {review.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-grow space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor={`review-name-${index}`}>Name</Label>
                              <Input 
                                id={`review-name-${index}`}
                                name={`review-name-${index}`}
                                value={review.name} 
                                onChange={e => handleArrayChange(index, 'name', e.target.value)}
                                placeholder="Full name"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`review-role-${index}`}>Role/Title</Label>
                              <Input 
                                id={`review-role-${index}`}
                                name={`review-role-${index}`}
                                value={review.role} 
                                onChange={e => handleArrayChange(index, 'role', e.target.value)}
                                placeholder="e.g., CEO at Tech Co"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="space-y-2">
                        <Label htmlFor={`review-rating-${index}`}>Rating</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            type="number"
                            min="1"
                            max="5"
                            id={`review-rating-${index}`}
                            name={`review-rating-${index}`}
                            value={review.rating}
                            onChange={e => handleArrayChange(index, 'rating', Number(e.target.value))}
                            className="w-20"
                          />
                          <div className="flex gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Testimonial Text */}
                      <div className="space-y-2">
                        <Label htmlFor={`review-text-${index}`}>Testimonial</Label>
                        <Textarea 
                          id={`review-text-${index}`}
                          name={`review-text-${index}`}
                          value={review.testimonial}
                          onChange={e => handleArrayChange(index, 'testimonial', e.target.value)}
                          placeholder="What did the customer say about their experience?"
                          rows={3}
                        />
                      </div>

                      {/* Avatar URL */}
                      <div className="space-y-2">
                        <Label htmlFor={`review-avatar-${index}`}>Avatar Image</Label>
                        <Select value={review.avatar} onValueChange={(value) => handleArrayChange(index, 'avatar', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an avatar from gallery" />
                          </SelectTrigger>
                          <SelectContent>
                            {galleryImages
                              .filter(img => img.imageUrl && typeof img.imageUrl === 'string' && img.imageUrl.trim() && img.id && typeof img.id === 'string')
                              .map((image) => (
                              <SelectItem key={image.id} value={image.imageUrl}>
                                {image.title || image.filename || 'Unnamed Image'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
