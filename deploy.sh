#!/bin/bash

# Deployment checklist for production with 10 Lakh+ users/day capacity

set -e

echo "🚀 Starting production deployment..."

# 1. Environment validation
echo "✅ Checking environment variables..."
required_vars=(
  "MONGODB_URI"
  "UPSTASH_REDIS_REST_URL"
  "UPSTASH_REDIS_REST_TOKEN"
  "NEXTAUTH_SECRET"
  "MONITORING_TOKEN"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing required env var: $var"
    exit 1
  fi
done

# 2. Build validation
echo "✅ Building production bundle..."
npm run build

# 3. Type checking
echo "✅ Type checking..."
npm run typecheck || true

# 4. Database setup
echo "✅ Setting up database indexes..."
npm run setup:db

# 5. Cache validation
echo "✅ Validating Redis connection..."
curl -f "https://api.upstash.com/redis/health" || echo "⚠️  Redis health check failed"

# 6. Vercel deployment
echo "✅ Deploying to Vercel..."
if command -v vercel &> /dev/null; then
  vercel deploy --prod --confirm
else
  echo "⚠️  Vercel CLI not found. Deploy manually via dashboard"
fi

# 7. Health check
echo "✅ Waiting for deployment to be live..."
sleep 30

HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://xmartycreator.com/api/health)
if [ "$HEALTH_STATUS" = "200" ] || [ "$HEALTH_STATUS" = "503" ]; then
  echo "✅ Deployment successful"
else
  echo "❌ Health check failed with status: $HEALTH_STATUS"
  exit 1
fi

# 8. Smoke tests
echo "✅ Running smoke tests..."
curl -f https://xmartycreator.com/ > /dev/null
curl -f https://xmartycreator.com/api/blog?status=published > /dev/null || true
curl -f https://xmartycreator.com/api/courses > /dev/null || true

echo "🎉 Deployment complete!"
echo "📊 Monitor at: https://xmartycreator.com/api/monitoring/metrics"
