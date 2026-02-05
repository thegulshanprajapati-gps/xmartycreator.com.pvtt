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
    console.log('?? [Admin] Fetching testimonials from MongoDB...');
    const client = await clientPromise;
    const dbName = process.env.MONGO_DB || process.env.MONGODB_DB || 'xmartydb';
    const db = client.db(dbName);
    console.log(`?? [Admin] Using DB: ${dbName} | collection: Testimonial`);

    const testimonialsCollection = db.collection('Testimonial');

    const normalizeDoc = (doc: any) => {
      if (!doc) return null;
      const reviews = Array.isArray(doc.items)
        ? doc.items
        : Array.isArray(doc.reviews)
          ? doc.reviews
          : [];
      return {
        title: doc.title || '',
        description: doc.description || '',
        reviews,
      };
    };

    let testimonialsDoc = (await testimonialsCollection.findOne({ slug: 'home' }))
      || (await testimonialsCollection.findOne({
        $or: [
          { items: { $exists: true } },
          { reviews: { $exists: true } },
        ],
      }));

    if (!testimonialsDoc) {
      // Legacy fallback: lowercase collection or pages.home
      const legacyDoc = (await db.collection('testimonials').findOne({ slug: 'home' }))
        || (await db.collection('testimonials').findOne({}));
      const legacyNormalized = normalizeDoc(legacyDoc);

      if (legacyNormalized) {
        await testimonialsCollection.updateOne(
          { slug: 'home' },
          {
            $set: {
              slug: 'home',
              title: legacyNormalized.title,
              description: legacyNormalized.description,
              items: legacyNormalized.reviews,
              updatedAt: new Date(),
            },
            $setOnInsert: {
              createdAt: new Date(),
            },
          },
          { upsert: true }
        );
        console.log(`? [Admin] Found ${legacyNormalized.reviews?.length || 0} testimonials`);
        return legacyNormalized;
      }

      // Fallback to home page content for legacy data
      const page = await db.collection('pages').findOne({ slug: 'home' });
      const rawTestimonials = page?.content?.testimonials || page?.content?.content?.testimonials || page?.testimonials || {};

      const reviews = Array.isArray(rawTestimonials?.items)
        ? rawTestimonials.items
        : Array.isArray(rawTestimonials?.reviews)
          ? rawTestimonials.reviews
          : [];

      const testimonials = {
        title: rawTestimonials?.title || '',
        description: rawTestimonials?.description || '',
        reviews,
      };

      if (reviews.length > 0 || rawTestimonials?.title || rawTestimonials?.description) {
        await testimonialsCollection.updateOne(
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
      }

      // Fallback: individual review documents stored in Testimonial collection
      const reviewDocs = await testimonialsCollection.find({ testimonial: { $exists: true } }).toArray();
      if (reviewDocs.length > 0) {
        const reviews = reviewDocs.map((doc: any) => ({
          name: doc.name || 'Anonymous',
          role: doc.role || '',
          testimonial: doc.testimonial || '',
          rating: Number(doc.rating) || 5,
          avatar: doc.avatar || '',
        }));
        const aggregated = { title: '', description: '', reviews };
        await testimonialsCollection.updateOne(
          { slug: 'home' },
          {
            $set: {
              slug: 'home',
              title: aggregated.title,
              description: aggregated.description,
              items: aggregated.reviews,
              updatedAt: new Date(),
            },
            $setOnInsert: {
              createdAt: new Date(),
            },
          },
          { upsert: true }
        );
        console.log(`? [Admin] Found ${aggregated.reviews?.length || 0} testimonials`);
        return aggregated;
      }

      console.log(`? [Admin] Found ${testimonials.reviews?.length || 0} testimonials`);
      return testimonials;
    }

    const normalized = normalizeDoc(testimonialsDoc) || { title: '', description: '', reviews: [] };
    const normalizedReviews = (normalized.reviews || []).filter(Boolean);

    // Always merge in individual review docs so new entries show up
    const reviewDocs = await testimonialsCollection.find({ testimonial: { $exists: true } }).toArray();
    if (reviewDocs.length > 0) {
      const reviewItems = reviewDocs.map((doc: any) => ({
        _id: String(doc._id || ''),
        name: doc.name || 'Anonymous',
        role: doc.role || '',
        testimonial: doc.testimonial || '',
        rating: Number(doc.rating) || 5,
        avatar: doc.avatar || '',
      }));

      const seen = new Set<string>();
      const merged: any[] = [];
      const pushUnique = (item: any) => {
        if (!item) return;
        const name = (item.name || '').trim();
        const text = (item.testimonial || '').trim();
        if (!name && !text) return;
        const key = item._id ? `id:${item._id}` : `nt:${name.toLowerCase()}|${text.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(item);
        }
      };

      normalizedReviews.forEach(pushUnique);
      reviewItems.forEach(pushUnique);

      const aggregated = { title: normalized.title || '', description: normalized.description || '', reviews: merged };
      await testimonialsCollection.updateOne(
        { slug: 'home' },
        {
          $set: {
            slug: 'home',
            title: aggregated.title,
            description: aggregated.description,
            items: aggregated.reviews,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
      console.log(`? [Admin] Found ${aggregated.reviews?.length || 0} testimonials`);
      return aggregated;
    }

    console.log(`? [Admin] Found ${normalizedReviews.length} testimonials`);
    return { ...normalized, reviews: normalizedReviews };
  } catch (error) {
    console.error('? [Admin] Failed to fetch testimonials:', error);
    return {
      title: '',
      description: '',
      reviews: []
    };
  }
}
