'use server';

import { revalidatePath } from 'next/cache';
import clientPromise from '@/lib/mongodb';
import { clearPageCache } from '@/lib/page-content-cache';

type Review = {
  name: string;
  role: string;
  testimonial: string;
  rating: number;
  avatar: string;
  gender?: 'male' | 'female';
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
    const name = (formData.get(`review-name-${index}`) as string) || '';
    const role = (formData.get(`review-role-${index}`) as string) || '';
    const testimonial = (formData.get(`review-text-${index}`) as string) || '';
    const rating = Number(formData.get(`review-rating-${index}`)) || 5;
    const avatar = (formData.get(`review-avatar-${index}`) as string) || '';
    const genderRaw = (formData.get(`review-gender-${index}`) as string) || '';

    const hasContent = name.trim() || testimonial.trim();
    if (hasContent) {
      reviews.push({
        name: name.trim() || 'Anonymous',
        role,
        testimonial,
        rating,
        avatar,
        gender: genderRaw === 'female' ? 'female' : genderRaw === 'male' ? 'male' : undefined,
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
    const db = client.db('xmartydb');

    // Save testimonials to dedicated collection
    await db.collection('Testimonial').updateOne(
      { slug: 'home' },
      {
        $set: {
          slug: 'home',
          title: testimonials.title,
          description: testimonials.description,
          items: testimonials.reviews,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    // Backward-compat for older reads (pages.content.testimonials)
    await db.collection('pages').updateOne(
      { slug: 'home' },
      {
        $set: {
          slug: 'home',
          'content.testimonials': {
            title: testimonials.title,
            description: testimonials.description,
            reviews: testimonials.reviews,
          },
          'content.content.testimonials': {
            title: testimonials.title,
            description: testimonials.description,
            reviews: testimonials.reviews,
          },
        },
      },
      { upsert: true }
    );

    revalidatePath('/');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/dashboard/testimonials');
    clearPageCache('home');

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


