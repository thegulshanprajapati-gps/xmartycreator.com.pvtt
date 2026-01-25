// Revalidation intervals for ISR (Incremental Static Regeneration)
export const CMS_REVALIDATION_INTERVAL = 3600; // 1 hour
export const BLOG_REVALIDATION_INTERVAL = 1800; // 30 minutes
export const HOME_REVALIDATION_INTERVAL = 1800; // 30 minutes
export const COURSES_REVALIDATION_INTERVAL = 3600; // 1 hour

// Cache TTLs
export const CACHE_TTL_HOT = 300; // 5 minutes
export const CACHE_TTL_WARM = 1800; // 30 minutes
export const CACHE_TTL_COLD = 3600; // 1 hour
export const CACHE_TTL_FROZEN = 86400; // 24 hours

// Rate limiting
export const RATE_LIMIT_API = 100; // requests per minute
export const RATE_LIMIT_AUTH = 5; // requests per 15 minutes
export const RATE_LIMIT_BLOG = 50; // requests per minute

// Traffic thresholds
export const TRAFFIC_HIGH_THRESHOLD = 500; // requests/sec
export const TRAFFIC_CRITICAL_THRESHOLD = 1000; // requests/sec
export const TRAFFIC_MODE_DURATION = 3600; // seconds
