import clientPromise from './mongodb';

interface PageContent {
  hero?: any;
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
    const db = client.db('myapp');
    
    const page = await db.collection('pages').findOne({ slug });

    if (page?.content) {
      console.log(`✅ [DB] Content found and cached for slug: "${slug}"`);
      // Ensure content is JSON-serializable (removes MongoDB ObjectId and Date objects)
      const serializedContent = JSON.parse(JSON.stringify(page.content));
      pageContentCache.set(slug, { content: serializedContent, timestamp: now });
      return serializedContent;
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
    const db = client.db('myapp');
    
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
