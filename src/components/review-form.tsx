'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Review } from '@/app/home-page-client';

const reviewSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  role: z.string().min(2, { message: 'Role must be at least 2 characters.' }),
  testimonial: z.string().min(10, { message: 'Review must be at least 10 characters.' }),
  rating: z.number().min(1, { message: 'Please select a rating.' }).max(5),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  onFormSubmit: (review: Omit<Review, 'avatar'>) => void;
}

export function ReviewForm({ onFormSubmit }: ReviewFormProps) {
  const [rating, setRating] = useState(0);

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      name: '',
      role: '',
      testimonial: '',
      rating: 0,
    },
  });

  function onSubmit(data: ReviewFormValues) {
    onFormSubmit(data);
    form.reset();
    setRating(0);
  }

  return (
    <div className="py-4">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                            <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Your Role</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Student, Developer" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="testimonial"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Your Review</FormLabel>
                        <FormControl>
                        <Textarea
                            placeholder="Tell us about your experience..."
                            className="min-h-[120px]"
                            {...field}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Rating</FormLabel>
                        <FormControl>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={cn(
                                'h-8 w-8 cursor-pointer transition-colors',
                                rating >= star
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-muted-foreground'
                                )}
                                onClick={() => {
                                setRating(star);
                                field.onChange(star);
                                }}
                            />
                            ))}
                        </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <Button type="submit">Submit Review</Button>
            </form>
        </Form>
    </div>
  );
}
