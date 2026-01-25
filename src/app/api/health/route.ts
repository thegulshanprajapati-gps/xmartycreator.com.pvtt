import { NextResponse } from 'next/server';
import connectDB from '@/lib/db-connection';
import redis from '@/lib/redis-cache';
import Blog from '@/lib/models/blog';
import mongoose from 'mongoose';

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: 'unknown',
      redis: 'unknown',
      indexes: 0,
    },
  };

  try {
    // Check MongoDB
    await connectDB();
    if (mongoose.connection.readyState === 1) {
      health.services.mongodb = 'connected';

      // Check indexes
      const indexes = await Blog.collection.getIndexes();
      health.services.indexes = Object.keys(indexes).length;
    } else {
      health.services.mongodb = 'disconnected';
    }
  } catch (error) {
    health.services.mongodb = 'error';
  }

  try {
    // Check Redis
    await redis.ping();
    health.services.redis = 'connected';
  } catch (error) {
    health.services.redis = 'error';
  }

  const allHealthy = 
    health.services.mongodb === 'connected' &&
    health.services.redis === 'connected' &&
    health.services.indexes >= 6;

  return NextResponse.json(health, {
    status: allHealthy ? 200 : 503,
  });
}
