import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const blogDuration = new Trend('blog_duration');
const homePageDuration = new Trend('home_duration');
const apiDuration = new Trend('api_duration');
const cacheHitRate = new Rate('cache_hit_rate');
const rateLimitErrors = new Counter('rate_limit_errors');
const totalRequests = new Counter('total_requests');

export const options = {
  stages: [
    { duration: '1m', target: 100 },    // Ramp up to 100 users
    { duration: '3m', target: 500 },    // Scale to 500 concurrent users
    { duration: '3m', target: 1000 },   // Spike to 1000 concurrent users
    { duration: '5m', target: 1000 },   // Sustain 1000 concurrent
    { duration: '2m', target: 0 },      // Ramp down
  ],
  thresholds: {
    'checks': ['rate>0.95'],
    'errors': ['rate<0.1'],             // Error rate < 10%
    'blog_duration': ['p(95)<500', 'p(99)<1000'],
    'home_duration': ['p(95)<300', 'p(99)<500'],
    'api_duration': ['p(95)<400', 'p(99)<800'],
    'rate_limit_errors': ['count<100'], // Less than 100 rate limit errors
  },
};

const BASE_URL = 'https://xmartycreator.com';

export default function () {
  totalRequests.add(1);

  // 1. Homepage - Most traffic
  group('Homepage', () => {
    const res = http.get(`${BASE_URL}/`, {
      headers: { 'Accept-Encoding': 'gzip' },
    });
    const success = check(res, {
      'status 200': (r) => r.status === 200,
      'load < 500ms': (r) => r.timings.duration < 500,
      'has content': (r) => r.body.length > 0,
    });
    
    errorRate.add(!success);
    homePageDuration.add(res.timings.duration);
    if (res.headers['x-cache'] === 'HIT') cacheHitRate.add(true);
  });

  sleep(1);

  // 2. Blog List API - High traffic endpoint
  group('Blog Listing API', () => {
    const res = http.get(`${BASE_URL}/api/blog?status=published`, {
      headers: { 'Accept-Encoding': 'gzip' },
    });
    const success = check(res, {
      'status 200': (r) => r.status === 200 || r.status === 429,
      'load < 500ms': (r) => r.timings.duration < 500,
    });
    
    if (res.status === 429) rateLimitErrors.add(1);
    errorRate.add(!success && res.status !== 429);
    apiDuration.add(res.timings.duration);
    if (res.headers['x-cache'] === 'HIT') cacheHitRate.add(true);
  });

  sleep(1);

  // 3. Individual Blog - Cached heavily
  group('Blog Detail', () => {
    const slugs = ['getting-started', 'tutorial', 'guide', 'intro'];
    const slug = slugs[Math.floor(Math.random() * slugs.length)];
    const res = http.get(`${BASE_URL}/api/blog/${slug}`, {
      headers: { 'Accept-Encoding': 'gzip' },
    });
    const success = check(res, {
      'status 200 or 404': (r) => r.status === 200 || r.status === 404,
      'load < 400ms': (r) => r.timings.duration < 400,
    });
    
    errorRate.add(!success);
    blogDuration.add(res.timings.duration);
    if (res.headers['x-cache'] === 'HIT') cacheHitRate.add(true);
  });

  sleep(1);

  // 4. Home Content API - Critical path
  group('Home Content API', () => {
    const res = http.get(`${BASE_URL}/api/pages/home`, {
      headers: { 'Accept-Encoding': 'gzip', 'Cache-Control': 'max-age=3600' },
    });
    const success = check(res, {
      'status 200': (r) => r.status === 200,
      'load < 300ms': (r) => r.timings.duration < 300,
      'cached': (r) => r.headers['cache-control'] !== undefined,
    });
    
    errorRate.add(!success);
    apiDuration.add(res.timings.duration);
    if (res.status === 200) cacheHitRate.add(true);
  });

  sleep(1);

  // 5. Courses API - Frequently accessed
  group('Courses API', () => {
    const res = http.get(`${BASE_URL}/api/courses`, {
      headers: { 'Accept-Encoding': 'gzip' },
    });
    const success = check(res, {
      'status 200': (r) => r.status === 200,
      'load < 500ms': (r) => r.timings.duration < 500,
    });
    
    errorRate.add(!success);
    apiDuration.add(res.timings.duration);
    if (res.headers['x-cache'] === 'HIT') cacheHitRate.add(true);
  });

  sleep(2);

  // 6. Stress test - Rapid requests (simulate burst)
  group('Burst Load - Rapid Requests', () => {
    for (let i = 0; i < 5; i++) {
      const res = http.get(`${BASE_URL}/api/blog?status=published`);
      if (res.status === 429) {
        rateLimitErrors.add(1);
      }
    }
  });

  sleep(1);
}
