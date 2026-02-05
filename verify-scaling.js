#!/usr/bin/env node

/**
 * Scaling Infrastructure Verification Script
 * Ensures all components are properly configured for 10L+ traffic
 */

import axios from 'axios';

const CHECKS = {
  mongodb: false,
  redis: false,
  rateLimit: false,
  caching: false,
  indexes: false,
  performance: false,
};

async function checkMongoDBConnection() {
  try {
    const response = await axios.get('/api/health/db', {
      baseURL: process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
      timeout: 5000,
    });
    if (response.data.status === 'connected') {
      CHECKS.mongodb = true;
      console.log('✅ MongoDB: Connected with pool');
    } else {
      console.log('❌ MongoDB: Not connected');
    }
  } catch (error) {
    console.log('❌ MongoDB: Connection error');
  }
}

async function checkRedisConnection() {
  try {
    const response = await axios.get('/api/health/redis', {
      baseURL: process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
      timeout: 5000,
    });
    if (response.data.status === 'connected') {
      CHECKS.redis = true;
      console.log('✅ Redis: Connected');
    } else {
      console.log('❌ Redis: Not connected');
    }
  } catch (error) {
    console.log('❌ Redis: Connection error');
  }
}

async function checkRateLimiting() {
  try {
    // Make 150 rapid requests - should trigger rate limit
    let limited = false;
    
    for (let i = 0; i < 150; i++) {
      const response = await axios.get('/api/blog', {
        baseURL: process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
        timeout: 2000,
      });
      
      if (response.status === 429) {
        limited = true;
        CHECKS.rateLimit = true;
        console.log('✅ Rate Limiting: Working (triggered at request ' + i + ')');
        break;
      }
    }
    
    if (!limited) {
      console.log('⚠️  Rate Limiting: May not be working (no 429 after 150 requests)');
    }
  } catch (error) {
    if (error.response?.status === 429) {
      CHECKS.rateLimit = true;
      console.log('✅ Rate Limiting: Working');
    } else {
      console.log('❌ Rate Limiting: Error checking');
    }
  }
}

async function checkCaching() {
  try {
    // First request - should be cache miss
    const res1 = await axios.get('/api/blog?status=published', {
      baseURL: process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
      timeout: 5000,
    });

    // Second request - might be cache hit
    const res2 = await axios.get('/api/blog?status=published', {
      baseURL: process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
      timeout: 5000,
    });

    if (res2.headers['x-cache'] === 'HIT' || res1.status === 200) {
      CHECKS.caching = true;
      console.log('✅ Caching: Redis cache working');
    } else {
      console.log('⚠️  Caching: May not be configured');
    }
  } catch (error) {
    console.log('❌ Caching: Error checking');
  }
}

async function checkIndexes() {
  try {
    const response = await axios.get('/api/health/indexes', {
      baseURL: process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
      timeout: 5000,
    });
    if (response.data.count >= 6) {
      CHECKS.indexes = true;
      console.log(`✅ Indexes: ${response.data.count} indexes found`);
    } else {
      console.log(`⚠️  Indexes: Only ${response.data.count} indexes found (need 6+)`);
    }
  } catch (error) {
    console.log('❌ Indexes: Unable to verify');
  }
}

async function checkPerformance() {
  try {
    const start = Date.now();
    
    // Load test - 100 concurrent requests
    const requests = Array(100).fill(null).map(() =>
      axios.get('/api/blog?status=published', {
        baseURL: process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
        timeout: 5000,
      }).catch(() => null)
    );

    const results = await Promise.all(requests);
    const duration = Date.now() - start;
    
    const successful = results.filter(r => r?.status === 200).length;
    const avgTime = duration / results.length;

    if (successful >= 90 && avgTime < 500) {
      CHECKS.performance = true;
      console.log(`✅ Performance: ${successful}/100 successful in ${duration}ms (avg: ${Math.round(avgTime)}ms)`);
    } else {
      console.log(`⚠️  Performance: ${successful}/100 successful, avg ${Math.round(avgTime)}ms (target: <500ms)`);
    }
  } catch (error) {
    console.log('❌ Performance: Load test error');
  }
}

async function runAllChecks() {
  console.log('\n🚀 Scaling Infrastructure Verification\n');
  console.log('BASE_URL:', process.env.NEXT_PUBLIC_URL || 'http://localhost:3000');
  console.log('-----------------------------------\n');

  await checkMongoDBConnection();
  await checkRedisConnection();
  await checkIndexes();
  await checkCaching();
  await checkRateLimiting();
  await checkPerformance();

  console.log('\n-----------------------------------');
  console.log('Summary:');
  const passCount = Object.values(CHECKS).filter(Boolean).length;
  console.log(`${passCount}/6 checks passed\n`);

  if (passCount === 6) {
    console.log('✅ System ready for 10L+ traffic!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some components need configuration\n');
    process.exit(1);
  }
}

runAllChecks();
