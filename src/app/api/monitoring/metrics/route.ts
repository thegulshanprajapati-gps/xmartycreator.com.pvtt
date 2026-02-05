import { NextRequest, NextResponse } from 'next/server';
import { getTrafficMetrics, getCircuitBreakerState } from '@/lib/traffic-handler';
import { getCounter } from '@/lib/redis-cache';
import connectDB from '@/lib/db-connection';
import mongoose from 'mongoose';

/**
 * Monitoring dashboard endpoint
 * Returns real-time metrics for observability dashboards
 * Protected by bearer token
 */

function validateMonitoringToken(request: NextRequest): boolean {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  return token === process.env.MONITORING_TOKEN;
}

export async function GET(request: NextRequest) {
  if (!validateMonitoringToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const metrics = await getTrafficMetrics();
    const cbState = getCircuitBreakerState();
    
    // Database status
    let dbStatus = 'unknown';
    let dbPoolSize = 0;
    try {
      await connectDB();
      if (mongoose.connection.readyState === 1) {
        dbStatus = 'connected';
        // @ts-ignore - Access internal pool size
        dbPoolSize = mongoose.connection.getClient()?.topology?.s?.pool?.totalConnectionCount || 0;
      } else {
        dbStatus = 'disconnected';
      }
    } catch (error) {
      dbStatus = 'error';
    }

    // Cache metrics
    const cacheHits = await getCounter('cache:hits');
    const cacheMisses = await getCounter('cache:misses');
    const hitRate = (cacheHits / (cacheHits + cacheMisses) * 100).toFixed(2);

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      metrics: {
        traffic: {
          requestsPerSecond: metrics.requestsPerSecond,
          isHighTraffic: metrics.isHighTraffic,
          isCritical: metrics.shouldServeStale,
        },
        database: {
          status: dbStatus,
          poolSize: dbPoolSize,
          maxPoolSize: 20,
        },
        cache: {
          hits: Number(cacheHits),
          misses: Number(cacheMisses),
          hitRate: Number(hitRate),
        },
        circuitBreaker: {
          isOpen: cbState.isOpen,
          failures: cbState.failures,
          threshold: 10,
        },
      },
      alerts: {
        highTraffic: metrics.isHighTraffic ? 'ACTIVE' : 'OK',
        dbOpen: cbState.isOpen ? 'OPEN' : 'OK',
        lowCacheHitRate: Number(hitRate) < 80 ? 'WARNING' : 'OK',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
