import { NextResponse } from 'next/server';
import { getTrafficMetrics, isHighTrafficMode, isCircuitBreakerOpen } from '@/lib/traffic-handler';
import { cacheGet } from '@/lib/redis-cache';

/**
 * Wrapper for API routes to handle high-traffic scenarios
 * - Serves stale cache if DB is slow
 * - Blocks writes during traffic spikes
 * - Returns degraded responses if needed
 */
export async function withHighTrafficSupport(
  handler: (request: Request) => Promise<Response>,
  cacheKey?: string
) {
  return async (request: Request) => {
    try {
      // Check traffic metrics
      const metrics = await getTrafficMetrics();
      const highTraffic = await isHighTrafficMode();
      const cbOpen = isCircuitBreakerOpen();

      // If circuit breaker is open and this is a write, reject
      if (cbOpen && (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE')) {
        return NextResponse.json(
          { error: 'Service temporarily unavailable during high traffic' },
          { status: 503 }
        );
      }

      // Try the handler
      const response = await handler(request);

      // If response is slow and we have a cache key, serve stale cache
      if (!response.ok && cacheKey && (highTraffic || cbOpen)) {
        const stale = await cacheGet(cacheKey);
        if (stale) {
          console.warn(`📦 Serving stale cache for ${cacheKey}`);
          return NextResponse.json(stale, {
            headers: {
              'X-Cache': 'STALE',
              'X-Traffic-Mode': highTraffic ? 'HIGH' : 'NORMAL',
            },
          });
        }
      }

      return response;
    } catch (error) {
      console.error('High traffic handler error:', error);
      throw error;
    }
  };
}

/**
 * Disable non-critical writes during traffic spike
 */
export async function shouldBlockWrite(operation: 'create' | 'update' | 'delete'): Promise<boolean> {
  const metrics = await getTrafficMetrics();
  const highTraffic = await isHighTrafficMode();

  // Block delete operations during spikes
  if (operation === 'delete' && (metrics.shouldServeStale || highTraffic)) {
    return true;
  }

  // Block batch updates during critical traffic
  if (operation === 'update' && metrics.shouldServeStale) {
    return true;
  }

  return false;
}
