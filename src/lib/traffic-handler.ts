import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

interface TrafficMetrics {
  requestsPerSecond: number;
  isHighTraffic: boolean;
  shouldServeStale: boolean;
}

const THRESHOLDS = {
  highTraffic: 500, // requests/sec
  criticalTraffic: 1000, // requests/sec
  staleCacheThreshold: 100, // ms DB response time
};

export async function getTrafficMetrics(): Promise<TrafficMetrics> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const key = `traffic:${now}`;
    
    const count = await redis.incr(key);
    await redis.expire(key, 2);

    const isHighTraffic = count > THRESHOLDS.highTraffic;
    const isCritical = count > THRESHOLDS.criticalTraffic;
    
    return {
      requestsPerSecond: count,
      isHighTraffic,
      shouldServeStale: isCritical,
    };
  } catch (error) {
    console.error('Traffic metrics error:', error);
    return {
      requestsPerSecond: 0,
      isHighTraffic: false,
      shouldServeStale: false,
    };
  }
}

export async function enableHighTrafficMode() {
  try {
    await redis.set('traffic_mode', 'high', 'EX', 3600);
  } catch (error) {
    console.error('Enable traffic mode error:', error);
  }
}

export async function disableHighTrafficMode() {
  try {
    await redis.del('traffic_mode');
  } catch (error) {
    console.error('Disable traffic mode error:', error);
  }
}

export async function isHighTrafficMode(): Promise<boolean> {
  try {
    const mode = await redis.get('traffic_mode');
    return mode === 'high';
  } catch (error) {
    console.error('Check traffic mode error:', error);
    return false;
  }
}

// Circuit breaker for DB
interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  isOpen: boolean;
}

const breaker: CircuitBreakerState = {
  failures: 0,
  lastFailureTime: 0,
  isOpen: false,
};

const FAILURE_THRESHOLD = 10;
const RESET_TIMEOUT = 60000; // 60 seconds

export function recordDBFailure() {
  breaker.failures++;
  breaker.lastFailureTime = Date.now();

  if (breaker.failures >= FAILURE_THRESHOLD) {
    breaker.isOpen = true;
    console.warn('⚠️ Database circuit breaker OPEN');
  }
}

export function recordDBSuccess() {
  if (breaker.failures > 0) {
    breaker.failures--;
  }

  if (breaker.isOpen) {
    const timeSinceLastFailure = Date.now() - breaker.lastFailureTime;
    if (timeSinceLastFailure > RESET_TIMEOUT) {
      breaker.isOpen = false;
      breaker.failures = 0;
      console.log('✅ Database circuit breaker RESET');
    }
  }
}

export function isCircuitBreakerOpen(): boolean {
  return breaker.isOpen;
}

export function getCircuitBreakerState() {
  return { ...breaker };
}
