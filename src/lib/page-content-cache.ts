import clientPromise from './mongodb';

interface PageContent {
  hero?: any;
  quickAccess?: any;
  featuredCourses?: any;
  whyChooseUs?: any;
  testimonials?: any;
  about?: any;
  blog?: any;
  community?: any;
  [key: string]: any;
}

// Cache for all page content
let pageContentCache: Map<string, { content: PageContent; timestamp: number }> = new Map();
const CACHE_DURATION = 60 * 1000; // 60 seconds

export async function getPageContent(slug: string, freshCache = false): Promise<PageContent> {
  try {
    const now = Date.now();
    const cachedData = pageContentCache.get(slug);

    // Return cache if valid and not forcing fresh cache
    if (!freshCache && cachedData && now - cachedData.timestamp < CACHE_DURATION) {
      console.log(`✅ [Cache] Using cached content for slug: "${slug}"`);
      return cachedData.content;
    }

    console.log(`📖 [DB] Fetching content from MongoDB for slug: "${slug}"...`);
    const client = await clientPromise;
    const dbName = process.env.MONGO_DB || process.env.MONGODB_DB;
    const db = dbName ? client.db(dbName) : client.db();

    console.log(`?? [DB] Reading pages collection for slug: ${slug}`);
    const page = await db.collection('pages').findOne({ slug });
    const rawContent = page?.content || (slug == 'home' ? page : null) || null;

    if (rawContent) {
      console.log(`✅ [DB] Content found and cached for slug: "${slug}"`);
      const normalizedContent = (rawContent as any)?.content && typeof (rawContent as any).content === 'object'
        ? (rawContent as any).content
        : rawContent;
      // Ensure content is JSON-serializable (removes MongoDB ObjectId and Date objects)
      const serializedContent = JSON.parse(JSON.stringify(normalizedContent));
      // Ensure the content has required structure properties
      if (slug == 'home') {
        const t = serializedContent.testimonials;
        const count = Array.isArray(t?.items) ? t.items.length : Array.isArray(t?.reviews) ? t.reviews.length : 0;
        console.log(`?? [Home Testimonials] title=${t?.title || ''} count=${count}`);
      }
      const validatedContent: PageContent = {
        hero: serializedContent.hero || {},
        quickAccess: (() => {
          const rawQuickAccess = serializedContent.quickAccess || serializedContent.featuredCourses || {};
          return {
            title: rawQuickAccess?.title || '',
            description: rawQuickAccess?.description || '',
            ...rawQuickAccess,
            items: Array.isArray(rawQuickAccess?.items)
              ? rawQuickAccess.items
              : Array.isArray(rawQuickAccess?.courses)
                ? rawQuickAccess.courses
                : [],
          };
        })(),
        featuredCourses: serializedContent.featuredCourses || undefined,
        whyChooseUs: {
          title: serializedContent.whyChooseUs?.title || '',
          description: serializedContent.whyChooseUs?.description || '',
          features: Array.isArray(serializedContent.whyChooseUs?.features) ? serializedContent.whyChooseUs.features : [],
          ...serializedContent.whyChooseUs,
        },
        testimonials: {
          title: serializedContent.testimonials?.title || '',
          description: serializedContent.testimonials?.description || '',
          reviews: Array.isArray(serializedContent.testimonials?.items)
            ? serializedContent.testimonials.items
            : (Array.isArray(serializedContent.testimonials?.reviews)
                ? serializedContent.testimonials.reviews
                : []),
          ...serializedContent.testimonials,
        },
        ...serializedContent,
      };
      pageContentCache.set(slug, { content: validatedContent, timestamp: now });
      return validatedContent;
    }

    console.log(`⚠️  [DB] No content found for slug: "${slug}"`);
    return {};
  } catch (error) {
    console.error(`❌ [DB] Error fetching content for slug "${slug}":`, error);
    throw error;
  }
}

export async function getAllPageContent(): Promise<Record<string, PageContent>> {
  try {
    console.log('📖 [DB] Fetching all page content from MongoDB...');
    const client = await clientPromise;
    const dbName = process.env.MONGO_DB || process.env.MONGODB_DB;
    const db = dbName ? client.db(dbName) : client.db();
    
    const pages = await db.collection('pages').find({}).toArray();
    const allContent: Record<string, PageContent> = {};

    const now = Date.now();
    pages.forEach((page: any) => {
      if (page.slug && page.content) {
        // Ensure content is JSON-serializable (removes MongoDB ObjectId and Date objects)
        const serializedContent = JSON.parse(JSON.stringify(page.content));
        allContent[page.slug] = serializedContent;
        pageContentCache.set(page.slug, { content: serializedContent, timestamp: now });
      }
    });

    console.log(`✅ [DB] Loaded ${Object.keys(allContent).length} pages from MongoDB`);
    return allContent;
  } catch (error) {
    console.error('❌ [DB] Error fetching all page content:', error);
    throw error;
  }
}

export function clearPageCache(slug?: string) {
  if (slug) {
    pageContentCache.delete(slug);
    console.log(`🗑️  [Cache] Cleared cache for slug: "${slug}"`);
  } else {
    pageContentCache.clear();
    console.log('🗑️  [Cache] Cleared all page cache');
  }
}

export function getCacheStatus() {
  return {
    cacheSize: pageContentCache.size,
    cachedSlugs: Array.from(pageContentCache.keys()),
    cacheHitRate: `${pageContentCache.size} pages cached`,
  };
}



