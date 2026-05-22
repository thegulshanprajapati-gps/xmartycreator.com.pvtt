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
    background: {
      useImage: boolean;
      imageId: string;
      image?: ImagePlaceholder;
    };
  };
  scrollingBanner: {
    enabled: boolean;
    text: string;
    linkText: string;
    linkHref: string;
    imageId: string;
    animation: 'slide' | 'pulse' | 'bounce';
    image?: ImagePlaceholder;
  };
  quickAccess: {
    title: string;
    description: string;
    columns: 3 | 4;
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

const DEFAULT_HOME_CONTENT: HomeContent = {
  hero: {
    title: 'Master the Future of Technology',
    description: 'Elite-level education for the digital frontier. One lesson at a time, focused and distraction-free.',
    buttons: {
      primary: { text: 'Join the Revolution', link: '/community' },
      secondary: { text: 'Our Philosophy', link: '/about' },
    },
    background: {
      useImage: false,
      imageId: '',
    },
  },
  scrollingBanner: {
    enabled: false,
    text: '',
    linkText: 'Learn more',
    linkHref: '#',
    imageId: '',
    animation: 'slide',
  },
  quickAccess: { 
    title: 'Curated Knowledge Base', 
    description: 'Precision-engineered resources to accelerate your learning journey.',
    columns: 3,
    items: [
      { title: 'Modern Notes', description: 'Distilled insights from industry leaders.', imageId: 'placeholder-1', link: '#' },
      { title: 'Core Syllabus', description: 'Strategic roadmaps for career mastery.', imageId: 'placeholder-2', link: '#' },
      { title: 'Mastery Books', description: 'Curated literature for the deep learner.', imageId: 'placeholder-3', link: '#' },
      { title: 'Elite PYQs', description: 'Challenge yourself with high-stakes problems.', imageId: 'placeholder-4', link: '#' },
      { title: 'Lab Modules', description: 'Hands-on practice in the digital sandbox.', imageId: 'placeholder-5', link: '#' },
      { title: 'Collaborative Projects', description: 'Synergize with the next generation of creators.', imageId: 'placeholder-6', link: '#' }
    ] 
  },
  whyChooseUs: { 
    title: 'The Future of Learning', 
    description: 'We don\'t just teach. We engineer your success with a platform built for deep focus.', 
    features: [
      { title: 'Ultra-Slim UI', description: 'Zero distractions. 100% focus on your growth.' },
      { title: 'Real Mentors', description: 'Direct access to architects of the future.' },
      { title: 'Career Velocity', description: 'Move from zero to elite faster than ever.' }
    ] 
  },
  testimonials: { 
    title: 'Voices of Success', 
    description: 'Join thousands of high-achievers who transformed their path with Xmarty.', 
    reviews: [] 
  },
  achievements: {
    badge: 'Global Excellence',
    title: 'Performance & Impact',
    description: 'Measuring success through the growth of our elite student body.',
    stats: [
      { value: 50000, suffix: '+', label: 'Active Minds' },
      { value: 120, suffix: '+', label: 'Advanced Modules' },
      { value: 5000, suffix: '+', label: 'Daily Practice Hours' },
      { value: 45, suffix: '+', label: 'Industry Awards' },
    ],
  },
};

const normalizeQuickAccessColumns = (value: unknown): 3 | 4 => {
  const parsed = Number(value);
  return parsed === 4 ? 4 : 3;
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
    const rawScrollingBanner = (content as any).scrollingBanner || (content as any).banner || {};
    const rawHero = (content as any).hero || {};
    const rawHeroBackground = rawHero?.background || {};

    const normalized: HomeContent = {
      ...DEFAULT_HOME_CONTENT,
      ...content,
      hero: {
        ...DEFAULT_HOME_CONTENT.hero,
        ...rawHero,
        buttons: {
          ...DEFAULT_HOME_CONTENT.hero.buttons,
          ...(rawHero?.buttons || {}),
          primary: {
            ...DEFAULT_HOME_CONTENT.hero.buttons.primary,
            ...(rawHero?.buttons?.primary || {}),
          },
          secondary: {
            ...DEFAULT_HOME_CONTENT.hero.buttons.secondary,
            ...(rawHero?.buttons?.secondary || {}),
          },
        },
        background: {
          ...DEFAULT_HOME_CONTENT.hero.background,
          ...rawHeroBackground,
          useImage: rawHeroBackground?.useImage === true
            || rawHeroBackground?.useImage === 'true'
            || rawHeroBackground?.useImage === 'on',
          imageId: (rawHeroBackground?.imageId || '').trim(),
        },
      },
      scrollingBanner: {
        ...DEFAULT_HOME_CONTENT.scrollingBanner,
        ...rawScrollingBanner,
        enabled: rawScrollingBanner?.enabled === true
          || rawScrollingBanner?.enabled === 'true'
          || rawScrollingBanner?.enabled === 'on',
        animation: rawScrollingBanner?.animation === 'pulse'
          || rawScrollingBanner?.animation === 'bounce'
          ? rawScrollingBanner.animation
          : 'slide',
      },
      quickAccess: {
        ...DEFAULT_HOME_CONTENT.quickAccess,
        ...rawQuickAccess,
        columns: normalizeQuickAccessColumns(rawQuickAccess?.columns),
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
      achievements: {
        ...DEFAULT_HOME_CONTENT.achievements,
        ...(content as any).achievements,
        stats: Array.isArray((content as any).achievements?.stats)
          ? (content as any).achievements.stats
          : DEFAULT_HOME_CONTENT.achievements.stats,
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
          columns: normalizeQuickAccessColumns(rawQuickAccess?.columns),
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

    // Fetch images for quick access items and banner (if any image IDs are provided)
    const bannerImageId = (normalizedWithCollections.scrollingBanner?.imageId || '').trim();
    const heroBackgroundImageId = (normalizedWithCollections.hero?.background?.imageId || '').trim();
    const itemImageIds = normalizedWithCollections.quickAccess.items
      .map((item: any) => item.imageId)
      .filter((id: string) => !!id);
    const allImageIds = Array.from(new Set([
      ...itemImageIds,
      ...(bannerImageId ? [bannerImageId] : []),
      ...(heroBackgroundImageId ? [heroBackgroundImageId] : []),
    ]));

    if (allImageIds.length > 0) {
      try {
        const images = await getImagesByIds(allImageIds);
        const imageMap = new Map(images.map(img => [img.id, img]));

        // Attach images to quick access items
        const itemsWithImages = normalizedWithCollections.quickAccess.items.map((item: any) => ({
          ...item,
          image: imageMap.get(item.imageId),
        }));
        const bannerImage = bannerImageId ? imageMap.get(bannerImageId) : undefined;
        const heroBackgroundImage = heroBackgroundImageId ? imageMap.get(heroBackgroundImageId) : undefined;

        return {
          ...normalizedWithCollections,
          hero: {
            ...normalizedWithCollections.hero,
            background: {
              ...normalizedWithCollections.hero.background,
              image: heroBackgroundImage,
            },
          },
          scrollingBanner: {
            ...normalizedWithCollections.scrollingBanner,
            image: bannerImage,
          },
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
      columns: normalizeQuickAccessColumns(quickAccessDoc?.columns),
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
          columns: normalizeQuickAccessColumns(payload.columns),
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
          gender: doc.gender === 'female' ? 'female' : doc.gender === 'male' ? 'male' : undefined,
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
        gender: doc.gender === 'female' ? 'female' : doc.gender === 'male' ? 'male' : undefined,
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
  return <HomePageClient initialHomeContent={homeContent} hideHeroSection />;
}
