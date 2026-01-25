import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Main rate limiter for API routes
export const apiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '120'),
    '1 m'
  ),
  analytics: true,
});

// Stricter rate limit for authentication endpoints
export const authRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true,
});

// Aggressive rate limit for bot-like behavior
export const aggressiveRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  analytics: true,
});

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
