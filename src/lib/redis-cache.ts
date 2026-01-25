import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export type CacheTTL = 
  | 'hot' // 5 minutes (300s) - frequently updated
  | 'warm' // 30 minutes (1800s) - moderately updated
  | 'cold' // 1 hour (3600s) - rarely updated
  | 'frozen'; // 24 hours (86400s) - never updated during traffic

const TTL_MAP: Record<CacheTTL, number> = {
  hot: 300,
  warm: 1800,
  cold: 3600,
  frozen: 86400,
};

export interface CacheOptions {
  ttl?: CacheTTL;
  staleWhileRevalidate?: boolean;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    return data as T | null;
  } catch (error) {
    console.error(`[Cache] Get error for ${key}:`, error);
    return null;
  }
}

export async function cacheSet<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<boolean> {
  try {
    const ttl = TTL_MAP[options.ttl || 'warm'];
    await redis.setex(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`[Cache] Set error for ${key}:`, error);
    return false;
  }
}

export async function cacheDel(keys: string[]): Promise<boolean> {
  try {
    if (keys.length === 0) return true;
    await redis.del(...keys);
    return true;
  } catch (error) {
    console.error('[Cache] Delete error:', error);
    return false;
  }
}

export async function cacheIncrBy(key: string, amount = 1): Promise<number> {
  try {
    const result = await redis.incrby(key, amount);
    await redis.expire(key, TTL_MAP.hot);
    return result as number;
  } catch (error) {
    console.error(`[Cache] IncrBy error for ${key}:`, error);
    return 0;
  }
}

// High-traffic cache functions
export async function getCachedCourses() {
  return cacheGet('courses:list');
}

export async function cacheCourses(data: any) {
  return cacheSet('courses:list', data, { ttl: 'warm' });
}

export async function getCachedBlogs(status?: string) {
  const key = status ? `blogs:list:${status}` : 'blogs:list:published';
  return cacheGet(key);
}

export async function cacheBlogs(data: any, status = 'published') {
  return cacheSet(`blogs:list:${status}`, data, { ttl: 'warm' });
}

export async function getCachedHome() {
  return cacheGet('home:content');
}

export async function cacheHome(data: any) {
  return cacheSet('home:content', data, { ttl: 'warm' });
}

// Analytics counters
export async function incrementPageView(slug: string) {
  return cacheIncrBy(`pageviews:${slug}`);
}

export async function incrementLike(slug: string) {
  return cacheIncrBy(`likes:${slug}`);
}

export async function getPageViews(slug: string): Promise<number> {
  try {
    const count = await redis.get(`pageviews:${slug}`);
    return (count as number) || 0;
  } catch {
    return 0;
  }
}

export async function getLikes(slug: string): Promise<number> {
  try {
    const count = await redis.get(`likes:${slug}`);
    return (count as number) || 0;
  } catch {
    return 0;
  }
}

// Batch operations for high-traffic scenarios
export async function getCachedBatch(keys: string[]): Promise<Map<string, any>> {
  try {
    const results = new Map();
    for (const key of keys) {
      const value = await redis.get(key);
      if (value) results.set(key, value);
    }
    return results;
  } catch (error) {
    console.error('[Cache] Batch get error:', error);
    return new Map();
  }
}

// Queue for batch writes (prevents thundering herd)
const writeQueue: Array<{ key: string; value: any; ttl: CacheTTL }> = [];
let flushTimer: NodeJS.Timeout | null = null;

export async function batchCacheSet(
  key: string,
  value: any,
  ttl: CacheTTL = 'warm'
) {
  writeQueue.push({ key, value, ttl });

  if (!flushTimer) {
    flushTimer = setTimeout(async () => {
      const batch = [...writeQueue];
      writeQueue.length = 0;
      flushTimer = null;

      for (const item of batch) {
        await cacheSet(item.key, item.value, { ttl: item.ttl });
      }
    }, 100); // Batch writes every 100ms
  }
}
