'use server';

import { revalidatePath } from 'next/cache';
import clientPromise from '@/lib/mongodb';

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

function getReviewsFromFormData(formData: FormData): Review[] {
  const reviews: Review[] = [];
  let index = 0;

  while (formData.has(`review-name-${index}`)) {
    const name = formData.get(`review-name-${index}`) as string;
    if (name.trim()) { // Only add if name is not empty
      reviews.push({
        name,
        role: formData.get(`review-role-${index}`) as string,
        testimonial: formData.get(`review-text-${index}`) as string,
        rating: Number(formData.get(`review-rating-${index}`)) || 5,
        avatar: formData.get(`review-avatar-${index}`) as string,
      });
    }
    index++;
  }

  return reviews;
}

export async function updateTestimonials(
  prevState: { message: string; data: any },
  formData: FormData
) {
  try {
    console.log('🔄 [Admin] Updating testimonials...');

    const testimonials: Testimonials = {
      title: formData.get('testimonials-title') as string,
      description: formData.get('testimonials-description') as string,
      reviews: getReviewsFromFormData(formData),
    };

    const client = await clientPromise;
    const db = client.db('myapp');

    // Fetch current home content
    const page = await db.collection('pages').findOne({ slug: 'home' });
    const currentContent = page?.content || {};

    // Update only the testimonials section
    const updatedContent = {
      ...currentContent,
      testimonials,
    };

    // Save updated content
    await db.collection('pages').updateOne(
      { slug: 'home' },
      { $set: { slug: 'home', content: updatedContent } },
      { upsert: true }
    );

    revalidatePath('/');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/dashboard/testimonials');

    console.log(`✅ [Admin] Testimonials updated successfully (${testimonials.reviews.length} reviews)`);
    return { 
      message: `Testimonials updated successfully! (${testimonials.reviews.length} reviews)`, 
      data: testimonials 
    };
  } catch (error: any) {
    console.error('❌ [Admin] Failed to update testimonials:', error);
    return { 
      message: `Failed to update testimonials: ${error.message}`, 
      data: prevState.data 
    };
  }
}
