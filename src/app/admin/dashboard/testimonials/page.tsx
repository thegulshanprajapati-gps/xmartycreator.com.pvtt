import type { Metadata } from 'next';
import clientPromise from '@/lib/mongodb';
import TestimonialsManager from './testimonials-manager';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Testimonials Management',
};

export default async function TestimonialsPage() {
  // Fetch testimonials from the home page content
  const testimonials = await getTestimonials();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Testimonials Management</h1>
      </div>
      
      <TestimonialsManager initialTestimonials={testimonials} />
    </div>
  );
}

async function getTestimonials() {
  try {
    console.log('🔄 [Admin] Fetching testimonials from MongoDB...');
    const client = await clientPromise;
    const db = client.db('myapp');
    
    const page = await db.collection('pages').findOne({ slug: 'home' });
    const testimonials = page?.content?.testimonials || {
      title: '',
      description: '',
      reviews: []
    };

    console.log(`✅ [Admin] Found ${testimonials.reviews?.length || 0} testimonials`);
    return testimonials;
  } catch (error) {
    console.error('❌ [Admin] Failed to fetch testimonials:', error);
    return {
      title: '',
      description: '',
      reviews: []
    };
  }
}
