import HomePageClient from './home-page-client';
import type { Metadata } from 'next';
import { getPageContent } from '@/lib/page-content-cache';
import { getImagesByIds } from '@/lib/image-service';
import clientPromise from '@/lib/mongodb';

// Enable ISR - revalidate every 60 seconds
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Home',
};

type ImagePlaceholder = {
  id: string;
  imageUrl: string;
  description?: string;
  title?: string;
  imageHint?: string;
};

type HomeContent = {
  hero: {
    title: string;
    description: string;
    buttons: {
      primary: { text: string; link: string };
      secondary: { text: string; link: string };
    };
  };
  quickAccess: {
    title: string;
    description: string;
    items: { 
      title: string; 
      description: string; 
      imageId: string;
      link: string;
      image?: ImagePlaceholder;
    }[];
  };
  whyChooseUs: {
    title: string;
    description: string;
    features: { title: string; description: string }[];
  };
  testimonials: {
    title: string;
    description: string;
    reviews: {
      name: string;
      role: string;
      testimonial: string;
      rating: number;
      avatar: string;
    }[];
  };
};

const DEFAULT_HOME_CONTENT: HomeContent = {
  hero: { title: 'Learn & Grow', description: 'Master new skills with our expert courses', buttons: { primary: { text: 'Get Started', link: '/courses' }, secondary: { text: 'Join Community', link: '#' }}},
  quickAccess: { 
    title: 'Quick Access', 
    description: 'Jump directly to what you need',
    items: [
      { title: 'Latest Notes', description: 'Access the most recent study notes', imageId: 'placeholder-1', link: '#' },
      { title: 'Syllabus', description: 'Download semester-wise syllabus', imageId: 'placeholder-2', link: '#' },
      { title: 'Reference Books', description: 'Find recommended textbooks', imageId: 'placeholder-3', link: '#' },
      { title: 'PYQ', description: 'Previous year question papers', imageId: 'placeholder-4', link: '#' },
      { title: 'Practical', description: 'Semester-wise practical syllabus and lab details', imageId: 'placeholder-5', link: '#' },
      { title: 'Team Work', description: 'Collaborative learning through projects and activities', imageId: 'placeholder-6', link: '#' }
    ] 
  },
  whyChooseUs: { title: '', description: '', features: [] },
  testimonials: { title: '', description: '', reviews: [] },
};

async function getHomeContent(): Promise<HomeContent> {
  try {
    const content = await getPageContent('home', true);
    let quickAccessFromDb = await getQuickAccessContent();
    let testimonialsFromDb = await getTestimonialsContent();

    if (!content || Object.keys(content).length == 0) {
      console.log('??  [Home Page] No valid home content found, using default');
      let fallback = DEFAULT_HOME_CONTENT;
      if (quickAccessFromDb) {
        fallback = { ...fallback, quickAccess: quickAccessFromDb };
      }
      if (testimonialsFromDb) {
        fallback = { ...fallback, testimonials: testimonialsFromDb };
      }
      return fallback;
    }

    const rawQuickAccess = (content as any).quickAccess || (content as any).featuredCourses || {};
    const rawTestimonials = (content as any).testimonials || {};

    const normalized: HomeContent = {
      ...DEFAULT_HOME_CONTENT,
      ...content,
      hero: {
        ...DEFAULT_HOME_CONTENT.hero,
        ...(content as any).hero,
      },
      quickAccess: {
        ...DEFAULT_HOME_CONTENT.quickAccess,
        ...rawQuickAccess,
        items: (Array.isArray(rawQuickAccess?.items)
          ? rawQuickAccess.items
          : Array.isArray(rawQuickAccess?.courses)
            ? rawQuickAccess.courses
            : DEFAULT_HOME_CONTENT.quickAccess.items
        ).filter((item: any) => item && typeof item === 'object'),
      },
      whyChooseUs: {
        ...DEFAULT_HOME_CONTENT.whyChooseUs,
        ...(content as any).whyChooseUs,
        features: Array.isArray((content as any).whyChooseUs?.features)
          ? (content as any).whyChooseUs.features
          : DEFAULT_HOME_CONTENT.whyChooseUs.features,
      },
      testimonials: {
        ...DEFAULT_HOME_CONTENT.testimonials,
        ...rawTestimonials,
        reviews: (Array.isArray(rawTestimonials?.reviews)
          ? rawTestimonials.reviews
          : Array.isArray(rawTestimonials?.items)
            ? rawTestimonials.items
            : DEFAULT_HOME_CONTENT.testimonials.reviews
        ).filter((review: any) => review && typeof review === 'object'),
      },
    };

    if (!quickAccessFromDb) {
      const fallbackItems = Array.isArray(rawQuickAccess?.items)
        ? rawQuickAccess.items
        : Array.isArray(rawQuickAccess?.courses)
          ? rawQuickAccess.courses
          : [];

      if (fallbackItems.length > 0) {
        quickAccessFromDb = {
          title: rawQuickAccess?.title || '',
          description: rawQuickAccess?.description || '',
          items: fallbackItems,
        };
        await upsertQuickAccessContent(quickAccessFromDb);
      }
    }

    if (!testimonialsFromDb) {
      const fallbackReviews = Array.isArray(rawTestimonials?.reviews)
        ? rawTestimonials.reviews
        : Array.isArray(rawTestimonials?.items)
          ? rawTestimonials.items
          : [];

      if (fallbackReviews.length > 0 || rawTestimonials?.title || rawTestimonials?.description) {
        testimonialsFromDb = {
          title: rawTestimonials?.title || '',
          description: rawTestimonials?.description || '',
          reviews: fallbackReviews,
        };
        await upsertTestimonialsContent(testimonialsFromDb);
      }
    }

    const normalizedWithCollections: HomeContent = {
      ...normalized,
      quickAccess: quickAccessFromDb || normalized.quickAccess,
      testimonials: testimonialsFromDb || normalized.testimonials,
    };

    console.log('? [Home Page] Home content loaded successfully');
    console.log('?? [Home Page] Quick Access items:', normalizedWithCollections.quickAccess.items?.length || 0);
    console.log('?? [Home Page] Testimonials:', normalizedWithCollections.testimonials.reviews?.length || 0);

    // Fetch images for quick access items (if any image IDs are provided)
    const itemImageIds = normalizedWithCollections.quickAccess.items
      .map((item: any) => item.imageId)
      .filter((id: string) => id);

    if (itemImageIds.length > 0) {
      try {
        const images = await getImagesByIds(itemImageIds);
        const imageMap = new Map(images.map(img => [img.id, img]));

        // Attach images to quick access items
        const itemsWithImages = normalizedWithCollections.quickAccess.items.map((item: any) => ({
          ...item,
          image: imageMap.get(item.imageId),
        }));

        return {
          ...normalizedWithCollections,
          quickAccess: {
            ...normalizedWithCollections.quickAccess,
            items: itemsWithImages,
          },
        } as HomeContent;
      } catch (imgError) {
        console.warn('??  [Home Page] Failed to fetch course images, continuing without them', imgError);
      }
    }

    return normalizedWithCollections;
  } catch (error) {
    console.error("❌ [Home Page] Failed to fetch home content:", error);
    return DEFAULT_HOME_CONTENT;
  }
}

async function getQuickAccessContent(): Promise<HomeContent['quickAccess'] | null> {
  try {
    const client = await clientPromise;
    const dbName = process.env.MONGO_DB || process.env.MONGODB_DB || 'xmartydb';
    const db = client.db(dbName);
    const quickAccessCollection = db.collection('quick_access');
    const quickAccessDoc = (await quickAccessCollection.findOne({ slug: 'quick-access' }))
      || (await quickAccessCollection.findOne({}));

    if (!quickAccessDoc) return null;

    return {
      title: quickAccessDoc?.title || '',
      description: quickAccessDoc?.description || '',
      items: Array.isArray(quickAccessDoc?.items)
        ? quickAccessDoc.items.filter((item: any) => item && typeof item === 'object')
        : [],
    };
  } catch (error) {
    console.error('!! [Home Page] Failed to fetch Quick Access from DB:', error);
    return null;
  }
}

async function upsertQuickAccessContent(payload: HomeContent['quickAccess']) {
  try {
    const client = await clientPromise;
    const dbName = process.env.MONGO_DB || process.env.MONGODB_DB || 'xmartydb';
    const db = client.db(dbName);
    await db.collection('quick_access').updateOne(
      { slug: 'quick-access' },
      {
        $set: {
          slug: 'quick-access',
          title: payload.title,
          description: payload.description,
          items: payload.items,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('!! [Home Page] Failed to upsert Quick Access to DB:', error);
  }
}

async function getTestimonialsContent(): Promise<HomeContent['testimonials'] | null> {
  try {
    const client = await clientPromise;
    const dbName = process.env.MONGO_DB || process.env.MONGODB_DB || 'xmartydb';
    const db = client.db(dbName);
    const testimonialsCollection = db.collection('Testimonial');

    const normalizeDoc = (doc: any): HomeContent['testimonials'] | null => {
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
      // Legacy fallback: old lowercase collection or pages.home
      const legacyDoc = (await db.collection('testimonials').findOne({ slug: 'home' }))
        || (await db.collection('testimonials').findOne({}));
      const legacyNormalized = normalizeDoc(legacyDoc);

      if (legacyNormalized) {
        await upsertTestimonialsContent(legacyNormalized);
        return legacyNormalized;
      }

      const page = await db.collection('pages').findOne({ slug: 'home' });
      const rawTestimonials = page?.content?.testimonials
        || page?.content?.content?.testimonials
        || page?.testimonials
        || {};
      const reviews = Array.isArray(rawTestimonials?.reviews)
        ? rawTestimonials.reviews
        : Array.isArray(rawTestimonials?.items)
          ? rawTestimonials.items
          : [];

      if (reviews.length > 0 || rawTestimonials?.title || rawTestimonials?.description) {
        const migrated = {
          title: rawTestimonials?.title || '',
          description: rawTestimonials?.description || '',
          reviews,
        };
        await upsertTestimonialsContent(migrated);
        return migrated;
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
        const aggregated = {
          title: '',
          description: '',
          reviews,
        };
        await upsertTestimonialsContent(aggregated);
        return aggregated;
      }

      return null;
    }

    const normalized = normalizeDoc(testimonialsDoc) || { title: '', description: '', reviews: [] };
    const normalizedReviews = (normalized.reviews || []).filter(Boolean);

    // Always merge in individual testimonial documents so new entries show immediately
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

      const aggregated = {
        title: normalized.title || '',
        description: normalized.description || '',
        reviews: merged,
      };

      if (merged.length !== normalizedReviews.length) {
        await upsertTestimonialsContent(aggregated);
      }

      return aggregated;
    }

    return { ...normalized, reviews: normalizedReviews };
  } catch (error) {
    console.error('!! [Home Page] Failed to fetch Testimonials from DB:', error);
    return null;
  }
}

async function upsertTestimonialsContent(payload: HomeContent['testimonials']) {
  try {
    const client = await clientPromise;
    const dbName = process.env.MONGO_DB || process.env.MONGODB_DB || 'xmartydb';
    const db = client.db(dbName);
    await db.collection('Testimonial').updateOne(
      { slug: 'home' },
      {
        $set: {
          slug: 'home',
          title: payload.title,
          description: payload.description,
          items: Array.isArray(payload.reviews) ? payload.reviews.filter(Boolean) : [],
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('!! [Home Page] Failed to upsert Testimonials to DB:', error);
  }
}
export default async function Home() {
  const homeContent = await getHomeContent();
  return <HomePageClient initialHomeContent={homeContent} />;
}
