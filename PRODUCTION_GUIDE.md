# Production Deployment & Scaling Guide

## System Architecture for 10 Lakh+ Users/Day

```
Edge Layer (Vercel Edge Network)
  ├─ Rate Limiting
  ├─ Bot Detection
  ├─ Request Validation
  └─ Cache Headers

API Layer (Vercel Serverless)
  ├─ Request Handler
  ├─ Rate Limit Checks
  ├─ Circuit Breaker
  └─ Response Caching

Cache Layer (Upstash Redis)
  ├─ Blog Cache (1 hour)
  ├─ Home Content (30 min)
  ├─ Rate Limit Counters
  └─ Analytics Counters

Database Layer (MongoDB Atlas)
  ├─ Connection Pooling (5-20)
  ├─ Indexes on hot fields
  ├─ Query optimization
  └─ Read replicas
```

## Pre-Deployment Checklist

### 1. MongoDB Atlas Setup

```bash
# Create cluster with:
- Region: Closest to your users
- M10+ tier for 10 lakh+ users
- Sharding: Enable for horizontal scaling
- Connection pooling: Enabled (max 100)
- Backup: Automated daily
```

**Required Indexes:**
```javascript
// Manually create if not present
db.blogs.createIndex({ slug: 1 }, { unique: true });
db.blogs.createIndex({ status: 1, publishedAt: -1 });
db.blogs.createIndex({ tags: 1, status: 1 });
db.blogs.createIndex({ title: "text", excerpt: "text", content: "text" });
db.blogs.createIndex({ author: 1, status: 1 });
```

### 2. Upstash Redis Setup

```bash
# Create Redis instance with:
- Region: Same as MongoDB
- Plan: Pro or Business
- Eviction Policy: allkeys-lru
- Max Connections: 1000+
- TLS: Enabled
```

### 3. Environment Variables

```dotenv
# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/xmartycreator?retryWrites=true&w=majority

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxx

# Monitoring
MONITORING_TOKEN=your-secure-token

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS_PER_MINUTE=120
BOT_DETECTION_ENABLED=true

# Traffic Mode
HIGH_TRAFFIC_MODE=false
CACHE_STALE_WHILE_REVALIDATE_SECONDS=86400
```

## Deployment Steps

### 1. Build and Test

```bash
npm run build
npm run typecheck
```

### 2. Setup Database Indexes

```bash
npm run setup:db
```

### 3. Deploy to Vercel

```bash
# Option 1: Using script
npm run deploy

# Option 2: Manual
npm run deploy:vercel

# Option 3: GitHub integration (recommended)
# Push to main branch - auto-deploys
git push origin main
```

### 4. Verify Deployment

```bash
# Health check
curl https://xmartycreator.com/api/health

# Monitoring endpoint
curl -H "Authorization: Bearer $MONITORING_TOKEN" \
  https://xmartycreator.com/api/monitoring/metrics
```

## Performance Optimization

### 1. Edge Caching

```
/api/blog?status=published
  - Cache: 30 minutes
  - Serve stale: Yes
  - Revalidate: ISR

/blog/[slug]
  - Cache: 24 hours
  - Serve stale: Yes
  - Revalidate: ISR (1 hour)
```

### 2. Database Optimization

**Query Timeouts:** 5000ms (strict limit)
**Connection Pool:** 20 max (auto-scales 5-20)
**Projection:** Only fetch needed fields
**Lean Queries:** Use .lean() for read-only operations

### 3. Rate Limiting Strategy

```
/api/*           - 100 req/min per IP
/api/auth/*      - 5 req/15min per IP
/api/blog/*      - 50 req/min per IP
```

## Load Testing

### 1. K6 Load Test

```bash
# Simulate 1000 concurrent users
k6 run --vus 1000 --duration 10m load-test.k6.js

# Check results
# - P95 response: < 500ms ✅
# - P99 response: < 1000ms ✅
# - Error rate: < 1% ✅
```

### 2. Artillery Stress Test

```bash
# 500 req/sec sustained
artillery run artillery.yml

# Watch metrics in real-time
artillery run artillery.yml --target https://xmartycreator.com
```

## Monitoring & Alerts

### Real-time Metrics

Access metrics endpoint:
```bash
curl -H "Authorization: Bearer $MONITORING_TOKEN" \
  https://xmartycreator.com/api/monitoring/metrics
```

**Key Metrics to Monitor:**
- Requests/sec: Should be < 1000
- Cache hit rate: Should be > 85%
- DB pool utilization: Should be < 80%
- Circuit breaker: Should be HEALTHY
- Error rate: Should be < 1%

### Alert Thresholds

| Metric | Yellow | Red |
|--------|--------|-----|
| RPS | > 600 | > 900 |
| Cache HitRate | < 80% | < 60% |
| DB Pool | > 70% | > 90% |
| Error Rate | > 2% | > 5% |
| P95 Response | > 600ms | > 1000ms |

## Scaling Decision Matrix

| Metric | Condition | Action |
|--------|-----------|--------|
| RPS | > 700 | Enable HIGH_TRAFFIC_MODE |
| Cache HitRate | < 75% | Increase cache TTL |
| DB Pool | > 80% | Upgrade MongoDB tier |
| Circuit Breaker | OPEN | Check DB health ⚠️ |
| Error Rate | > 3% | Rollback deployment |

## Incident Response

### Circuit Breaker Open

```
1. Check DB status: Is it responding?
2. Check connection pool: Exhausted?
3. Action: Automatic recovery in 60 seconds
4. Manual: Restart pod or scale down
```

### High Error Rate

```
1. Check deployment logs
2. Check error type (rate limit vs server error)
3. Rollback if > 5% errors
4. Investigate and re-deploy
```

### Cache Issues

```
1. Check Redis connection
2. Check Redis memory usage
3. Increase Redis tier if needed
4. Warm cache manually if needed
```

## Cost Optimization

**Expected Monthly Costs (10 Lakh+ users/day):**
- Vercel: $100-500 (serverless compute)
- MongoDB Atlas: $200-500 (M10+ cluster)
- Upstash Redis: $50-200 (Pro plan)
- **Total: ~$400-1200/month**

**Cost Reduction Tips:**
- Use ISR for static regeneration
- Aggressive caching (90% hit rate)
- Compress API responses
- Use projection queries

## Post-Deployment

### Day 1
- ✅ Monitor metrics every hour
- ✅ Check error logs
- ✅ Verify cache hit rates

### Day 7
- ✅ Analyze traffic patterns
- ✅ Optimize slow queries
- ✅ Tune cache TTLs

### Day 30
- ✅ Generate performance report
- ✅ Plan capacity expansion
- ✅ Update runbooks
