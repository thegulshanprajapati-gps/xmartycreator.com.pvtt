import type { Metadata } from 'next';
import AdminDashboardClient from './admin-dashboard-client';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin',
};

// Define the type for the home content
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
    items: { title: string; description: string; imageId: string; link: string }[];
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
      gender?: 'male' | 'female';
    }[];
  };
  achievements: {
    badge: string;
    title: string;
    description: string;
    stats: { value: number; suffix: string; label: string }[];
  };
};

// Function to fetch content directly from MongoDB
async function getHomeContent(): Promise<HomeContent> {
  try {
    console.log('🔄 [Admin] Fetching home content from MongoDB...');
    const client = await clientPromise;
    const dbName = process.env.MONGO_DB || process.env.MONGODB_DB || 'xmartydb';
    const db = client.db(dbName);
    const page = await db.collection('pages').findOne({ slug: 'home' });
    const quickAccessCollection = db.collection('quick_access');
    const quickAccessDoc = (await quickAccessCollection.findOne({ slug: 'quick-access' }))
      || (await quickAccessCollection.findOne({}));
    const testimonialsCollection = client.db(dbName).collection('Testimonial');
    const testimonialsDoc = (await testimonialsCollection.findOne({ slug: 'home' }))
      || (await testimonialsCollection.findOne({
        $or: [
          { items: { $exists: true } },
          { reviews: { $exists: true } },
        ],
      }));
    
    // Default structure to ensure all required properties exist
    const defaultContent: HomeContent = {
      hero: { title: '', description: '', buttons: { primary: { text: '', link: '' }, secondary: { text: '', link: '' }}},
      quickAccess: { title: '', description: '', items: [] },
      whyChooseUs: { title: '', description: '', features: [] },
      testimonials: { title: '', description: '', reviews: [] },
      achievements: {
        badge: 'Proven Track Record',
        title: 'Our Impact by the Numbers',
        description: 'Join thousands of learners who are transforming their careers and skills',
        stats: [
          { value: 50000, suffix: '+', label: 'Happy Students' },
          { value: 50, suffix: '+', label: 'Expert Courses' },
          { value: 1000, suffix: '+', label: 'Hours of Content' },
          { value: 20, suffix: '+', label: 'Awards Won' },
        ],
      },
    };

    if (page?.content) {
      console.log('✅ [Admin] Home content found');
      const rawQuickAccess = quickAccessDoc || page.content.quickAccess || page.content.featuredCourses || {};
      const rawTestimonials = testimonialsDoc || page.content.testimonials || page.content.content?.testimonials || {};
      const rawItems = Array.isArray(rawQuickAccess?.items)
        ? rawQuickAccess.items
        : Array.isArray(rawQuickAccess?.courses)
          ? rawQuickAccess.courses
          : [];
      const reviews = Array.isArray((rawTestimonials as any)?.items)
        ? (rawTestimonials as any).items
        : Array.isArray((rawTestimonials as any)?.reviews)
          ? (rawTestimonials as any).reviews
          : [];
      const safeItems = rawItems.filter((item: any) => item && typeof item === 'object');
      const safeReviews = reviews.filter((review: any) => review && typeof review === 'object');
      const reviewDocs = await testimonialsCollection.find({ testimonial: { $exists: true } }).toArray();
      const reviewItems = reviewDocs.map((doc: any) => ({
        _id: String(doc._id || ''),
        name: doc.name || 'Anonymous',
        role: doc.role || '',
        testimonial: doc.testimonial || '',
        rating: Number(doc.rating) || 5,
        avatar: doc.avatar || '',
        gender: doc.gender === 'female' ? 'female' : doc.gender === 'male' ? 'male' : undefined,
      }));
      const seen = new Set<string>();
      const mergedReviews: any[] = [];
      const pushUnique = (item: any) => {
        if (!item) return;
        const name = (item.name || '').trim();
        const text = (item.testimonial || '').trim();
        if (!name && !text) return;
        const key = item._id ? `id:${item._id}` : `nt:${name.toLowerCase()}|${text.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          mergedReviews.push(item);
        }
      };
      safeReviews.forEach(pushUnique);
      reviewItems.forEach(pushUnique);

      if (!testimonialsDoc) {
        const legacyDoc = (await db.collection('testimonials').findOne({ slug: 'home' }))
          || (await db.collection('testimonials').findOne({}));
        const legacyReviews = Array.isArray((legacyDoc as any)?.items)
          ? (legacyDoc as any).items
          : Array.isArray((legacyDoc as any)?.reviews)
            ? (legacyDoc as any).reviews
            : [];
        const legacyTitle = (legacyDoc as any)?.title || rawTestimonials?.title || '';
        const legacyDescription = (legacyDoc as any)?.description || rawTestimonials?.description || '';
        const legacyItems = legacyReviews.length ? legacyReviews : reviews;

        if (legacyItems.length > 0 || legacyTitle || legacyDescription) {
          await testimonialsCollection.updateOne(
            { slug: 'home' },
            {
              $set: {
                slug: 'home',
                title: legacyTitle,
                description: legacyDescription,
                items: legacyItems,
                updatedAt: new Date(),
              },
              $setOnInsert: {
                createdAt: new Date(),
              },
            },
            { upsert: true }
          );
        }
      }

      // Merge database content with defaults to ensure all properties exist
      const mergedContent: HomeContent = {
        hero: page.content.hero || defaultContent.hero,
        quickAccess: {
          title: rawQuickAccess?.title || '',
          description: rawQuickAccess?.description || '',
          items: safeItems.map((item: any) => ({
            ...item,
            link: item?.link || '',
          })),
        },
        whyChooseUs: {
          title: page.content.whyChooseUs?.title || '',
          description: page.content.whyChooseUs?.description || '',
          features: Array.isArray(page.content.whyChooseUs?.features) ? page.content.whyChooseUs.features : [],
        },
        testimonials: {
          title: rawTestimonials?.title || '',
          description: rawTestimonials?.description || '',
          reviews: mergedReviews,
        },
        achievements: {
          ...defaultContent.achievements,
          ...(page.content.achievements || {}),
          stats: Array.isArray(page.content.achievements?.stats)
            ? page.content.achievements.stats
            : defaultContent.achievements.stats,
        },
      };
      return mergedContent;
    }
    
    console.log('⚠️  [Admin] No home content found, using defaults');
    if (quickAccessDoc || testimonialsDoc) {
      return {
        ...defaultContent,
        quickAccess: {
          title: quickAccessDoc?.title || '',
          description: quickAccessDoc?.description || '',
          items: Array.isArray(quickAccessDoc?.items)
            ? quickAccessDoc.items.filter((item: any) => item && typeof item === 'object')
            : [],
        },
        testimonials: testimonialsDoc
          ? {
              title: (testimonialsDoc as any).title || '',
              description: (testimonialsDoc as any).description || '',
              reviews: Array.isArray((testimonialsDoc as any).items)
                ? (testimonialsDoc as any).items.filter((review: any) => review && typeof review === 'object')
                : Array.isArray((testimonialsDoc as any).reviews)
                  ? (testimonialsDoc as any).reviews.filter((review: any) => review && typeof review === 'object')
                  : [],
            }
          : defaultContent.testimonials,
      };
    }
    return defaultContent;
  } catch (error) {
    console.error('❌ [Admin] Failed to fetch home content:', error);
    // Return a default structure if the fetch fails
    return {
      hero: { title: '', description: '', buttons: { primary: { text: '', link: '' }, secondary: { text: '', link: '' }}},
      quickAccess: { title: '', description: '', items: [] },
      whyChooseUs: { title: '', description: '', features: [] },
      testimonials: { title: '', description: '', reviews: [] },
      achievements: {
        badge: 'Proven Track Record',
        title: 'Our Impact by the Numbers',
        description: 'Join thousands of learners who are transforming their careers and skills',
        stats: [
          { value: 50000, suffix: '+', label: 'Happy Students' },
          { value: 50, suffix: '+', label: 'Expert Courses' },
          { value: 1000, suffix: '+', label: 'Hours of Content' },
          { value: 20, suffix: '+', label: 'Awards Won' },
        ],
      },
    };
  }
}


export default async function AdminDashboard() {
  const homeContent = await getHomeContent();
  return <AdminDashboardClient initialHomeContent={homeContent} />;
}
