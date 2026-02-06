import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// In local/dev environments the Upstash env vars may be missing.
// Upstash's client throws "Failed to parse URL from /pipeline" when URL is empty.
// Provide a safe no-op fallback so middleware/pages still run without redis.
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

type RedisLike = {
  get: (key: string) => Promise<any>;
  setex: (key: string, ttl: number, value: string) => Promise<any>;
  incr: (key: string) => Promise<number>;
  incrby?: (key: string, amount: number) => Promise<number>;
  expire: (key: string, ttl: number) => Promise<any>;
  del?: (...keys: string[]) => Promise<number>;
};

const mockRedis: RedisLike = {
  async get() { return null; },
  async setex() { return 'OK'; },
  async incr() { return 0; },
  async incrby() { return 0; },
  async expire() { return 'OK'; },
  async del() { return 0; },
};

export const redis: RedisLike = redisUrl && redisToken
  ? new Redis({ url: redisUrl, token: redisToken })
  : mockRedis;

type LimiterLike = {
  limit: (id: string) => Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: Date;
    pending: Promise<any>;
  }>;
};

const createLimiter = (requests: number, window: string): LimiterLike => {
  if (redisUrl && redisToken) {
    return new Ratelimit({
      redis: redis as Redis,
      limiter: Ratelimit.slidingWindow(requests, window),
      analytics: true,
    });
  }
  // Fallback: allow traffic when redis is not configured
  return {
    async limit() {
      return {
        success: true,
        limit: requests,
        remaining: requests,
        reset: new Date(Date.now() + 60_000),
        pending: Promise.resolve(),
      };
    },
  };
};

// Main rate limiter for API routes
export const apiRateLimiter = createLimiter(
  parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '120', 10),
  '1 m'
);

// Stricter rate limit for authentication endpoints
export const authRateLimiter = createLimiter(5, '15 m');

// Aggressive rate limit for bot-like behavior
export const aggressiveRateLimiter = createLimiter(10, '1 h');

// Get rate limit status
export async function checkRateLimit(identifier: string, limiter = apiRateLimiter) {
  try {
    const { success, limit, remaining, reset, pending } = await limiter.limit(identifier);
    return {
      success,
      limit,
      remaining,
      reset: new Date(reset),
      pending,
    };
  } catch (error) {
    console.error('[RateLimit] Error:', error);
    // Fail open - allow request if Redis is down
    return {
      success: true,
      limit: -1,
      remaining: -1,
      reset: new Date(),
      pending: Promise.resolve(),
    };
  }
}

// Check IP blocklist
export async function checkIPBlocklist(ip: string): Promise<boolean> {
  try {
    const blocked = await redis.get(`blocklist:${ip}`);
    return !!blocked;
  } catch (error) {
    console.error('[IPBlocklist] Error:', error);
    return false;
  }
}

// Add IP to blocklist
export async function blockIP(ip: string, durationSeconds = 3600) {
  try {
    await redis.setex(`blocklist:${ip}`, durationSeconds, '1');
    return true;
  } catch (error) {
    console.error('[IPBlocklist] Block error:', error);
    return false;
  }
}

// Get violation count for IP
export async function getViolationCount(ip: string): Promise<number> {
  try {
    const count = await redis.incr(`violations:${ip}`);
    await redis.expire(`violations:${ip}`, 3600); // 1 hour expiry
    return count;
  } catch (error) {
    console.error('[Violations] Error:', error);
    return 0;
  }
}
