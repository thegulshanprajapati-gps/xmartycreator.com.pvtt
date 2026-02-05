import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export interface TrafficMetrics {
  requestsPerSecond: number;
  activeConnections: number;
  dbLatency: number;
  cacheHitRate: number;
  isHighTraffic: boolean;
}

export interface CacheStrategy {
  serveStaleDuration: number; // seconds to serve stale cache if DB slow
  disableWrites: boolean; // disable non-critical writes
  readOnlyMode: boolean; // full read-only mode
  reducedRefresh: boolean; // reduce cache refresh frequency
}

class TrafficSpikeManager {
  private metricsKey = 'metrics:traffic';
  private cacheHitKey = 'metrics:cache:hits';
  private cacheMissKey = 'metrics:cache:misses';
  private requestCountKey = 'metrics:requests:current';
  private lastMetricsTime = 0;
  private criticalThreshold = 500; // RPS
  private highThreshold = 250; // RPS

  async recordRequest() {
    try {
      await redis.incr(this.requestCountKey);
      await redis.expire(this.requestCountKey, 60); // Reset every 60 seconds
    } catch (error) {
      console.error('[Traffic] Record request error:', error);
    }
  }

  async recordCacheHit() {
    try {
      await redis.incr(this.cacheHitKey);
      await redis.expire(this.cacheHitKey, 3600);
    } catch (error) {
      console.error('[Traffic] Record cache hit error:', error);
    }
  }

  async recordCacheMiss() {
    try {
      await redis.incr(this.cacheMissKey);
      await redis.expire(this.cacheMissKey, 3600);
    } catch (error) {
      console.error('[Traffic] Record cache miss error:', error);
    }
  }

  async getMetrics(): Promise<TrafficMetrics> {
    try {
      const now = Date.now();
      
      // Don't check metrics more than once per 5 seconds
      if (now - this.lastMetricsTime < 5000) {
        return {
          requestsPerSecond: 0,
          activeConnections: 0,
          dbLatency: 0,
          cacheHitRate: 0,
          isHighTraffic: false,
        };
      }

      this.lastMetricsTime = now;

      const [requests, hits, misses] = await Promise.all([
        redis.get(this.requestCountKey) as Promise<number | null>,
        redis.get(this.cacheHitKey) as Promise<number | null>,
        redis.get(this.cacheMissKey) as Promise<number | null>,
      ]);

      const rps = (requests || 0) / 60;
      const totalCacheOps = (hits || 0) + (misses || 0);
      const cacheHitRate = totalCacheOps > 0 ? ((hits || 0) / totalCacheOps) * 100 : 0;

      return {
        requestsPerSecond: rps,
        activeConnections: 0, // Would need separate tracking
        dbLatency: 0, // Would need separate tracking
        cacheHitRate,
        isHighTraffic: rps > this.highThreshold,
      };
    } catch (error) {
      console.error('[Traffic] Get metrics error:', error);
      return {
        requestsPerSecond: 0,
        activeConnections: 0,
        dbLatency: 0,
        cacheHitRate: 0,
        isHighTraffic: false,
      };
    }
  }

  async getCacheStrategy(): Promise<CacheStrategy> {
    const metrics = await this.getMetrics();

    if (metrics.requestsPerSecond > this.criticalThreshold) {
      console.warn('[Traffic] CRITICAL: High traffic spike detected - RPS:', metrics.requestsPerSecond);
      return {
        serveStaleDuration: 86400, // Serve stale for up to 24 hours
        disableWrites: true,
        readOnlyMode: true,
        reducedRefresh: true,
      };
    }

    if (metrics.requestsPerSecond > this.highThreshold) {
      console.warn('[Traffic] WARNING: High traffic detected - RPS:', metrics.requestsPerSecond);
      return {
        serveStaleDuration: 3600, // Serve stale for 1 hour
        disableWrites: false,
        readOnlyMode: false,
        reducedRefresh: true,
      };
    }

    return {
      serveStaleDuration: 300, // Normal: 5 minutes
      disableWrites: false,
      readOnlyMode: false,
      reducedRefresh: false,
    };
  }

  async enableHighTrafficMode() {
    try {
      await redis.set('traffic:high_traffic_mode', '1');
      await redis.expire('traffic:high_traffic_mode', 1800); // 30 minutes auto-reset
      await redis.set('traffic:mode_enabled_at', Date.now().toString());
      console.warn('[Traffic] HIGH TRAFFIC MODE ENABLED');
    } catch (error) {
      console.error('[Traffic] Enable high traffic mode error:', error);
    }
  }

  async disableHighTrafficMode() {
    try {
      await redis.del('traffic:high_traffic_mode');
      console.log('[Traffic] HIGH TRAFFIC MODE DISABLED');
    } catch (error) {
      console.error('[Traffic] Disable high traffic mode error:', error);
    }
  }

  async isHighTrafficModeEnabled(): Promise<boolean> {
    try {
      const mode = await redis.get('traffic:high_traffic_mode');
      return !!mode;
    } catch (error) {
      console.error('[Traffic] Check high traffic mode error:', error);
      return false;
    }
  }

  // Get stale cache if available (for during traffic spikes)
  async getStaleCache<T>(key: string, staleDuration: number): Promise<T | null> {
    try {
      // Get from a "stale" key that persists longer
      const staleKey = `stale:${key}`;
      const data = await redis.get(staleKey);
      return data as T | null;
    } catch (error) {
      console.error('[Traffic] Get stale cache error:', error);
      return null;
    }
  }

  // Set stale cache for fallback
  async setStaleCache<T>(key: string, value: T) {
    try {
      const staleKey = `stale:${key}`;
      // Keep stale data for 24 hours
      await redis.setex(staleKey, 86400, JSON.stringify(value));
    } catch (error) {
      console.error('[Traffic] Set stale cache error:', error);
    }
  }
}

export const trafficManager = new TrafficSpikeManager();

// Helper to check if we should skip a non-critical operation
export async function shouldSkipWrite(operationType: string): Promise<boolean> {
  const strategy = await trafficManager.getCacheStrategy();
  
  if (strategy.readOnlyMode) {
    return true;
  }

  // Define critical vs non-critical operations
  const criticalOperations = ['auth', 'blog:create', 'admin:settings'];
  const isCritical = criticalOperations.some(op => operationType.includes(op));

  return strategy.disableWrites && !isCritical;
}

// Serve stale cache if database is slow
export async function getWithFallback<T>(
  key: string,
  fetchFn: () => Promise<T>,
  cacheTTL = 300
): Promise<T | null> {
  try {
    const strategy = await trafficManager.getCacheStrategy();
    
    // Try to fetch fresh data
    const freshData = await Promise.race([
      fetchFn(),
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), 3000) // 3 second timeout
      ),
    ]);

    if (freshData !== null) {
      // Got fresh data, update both current and stale cache
      await Promise.all([
        redis.setex(key, cacheTTL, JSON.stringify(freshData)),
        trafficManager.setStaleCache(key, freshData),
      ]);
      return freshData;
    }

    // Fresh data fetch failed or timed out, try stale cache
    console.warn(`[Traffic] Fresh fetch failed for ${key}, checking stale cache`);
    const staleData = await trafficManager.getStaleCache<T>(
      key,
      strategy.serveStaleDuration
    );

    if (staleData) {
      console.warn(`[Traffic] Serving stale cache for ${key}`);
      return staleData;
    }

    return null;
  } catch (error) {
    console.error('[Traffic] Get with fallback error:', error);
    return null;
  }
}
