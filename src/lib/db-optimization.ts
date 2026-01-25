import mongoose from 'mongoose';

// MongoDB Connection with pooling optimization
export async function ensureDBConnection() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 50,
      minPoolSize: 10,
      maxIdleTimeMS: 60000,
      waitQueueTimeoutMS: 10000,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      retryWrites: true,
      retryReads: true,
    });

    console.log('✅ [DB] MongoDB connected with optimized pooling');
    return mongoose.connection;
  } catch (error) {
    console.error('❌ [DB] MongoDB connection failed:', error);
    throw error;
  }
}

// Ensure indexes exist
export async function ensureIndexes() {
  try {
    // Blog indexes
    if (mongoose.connection.collections.blogs) {
      await Promise.all([
        mongoose.connection.collection('blogs').createIndex({ slug: 1 }, { unique: true }),
        mongoose.connection.collection('blogs').createIndex({ status: 1, publishedAt: -1 }),
        mongoose.connection.collection('blogs').createIndex({ tags: 1, status: 1 }),
        mongoose.connection.collection('blogs').createIndex({ createdAt: -1 }),
        mongoose.connection.collection('blogs').createIndex({ author: 1 }),
      ]);
    }

    // Home content indexes
    if (mongoose.connection.collections.pages) {
      await Promise.all([
        mongoose.connection.collection('pages').createIndex({ slug: 1 }, { unique: true }),
        mongoose.connection.collection('pages').createIndex({ updatedAt: -1 }),
      ]);
    }

    console.log('✅ [DB] Indexes created/verified');
  } catch (error) {
    console.error('⚠️ [DB] Index creation warning:', error);
  }
}

// Optimized query functions with projections
export const QueryOptimizations = {
  blogs: {
    list: {
      projection: { title: 1, slug: 1, excerpt: 1, author: 1, readTime: 1, publishedAt: 1, coverImage: 1, tags: 1, status: 1 },
      sort: { publishedAt: -1 },
      timeout: 5000,
    },
    detail: {
      projection: { title: 1, slug: 1, excerpt: 1, htmlContent: 1, content: 1, author: 1, readTime: 1, publishedAt: 1, coverImage: 1, tags: 1 },
      timeout: 5000,
    },
    admin: {
      projection: { _id: 1, title: 1, slug: 1, status: 1, author: 1, createdAt: 1, updatedAt: 1, views: 1 },
      timeout: 5000,
    },
  },
  pages: {
    home: {
      projection: { content: 1, updatedAt: 1 },
      timeout: 3000,
    },
    testimonials: {
      projection: { 'content.testimonials': 1 },
      timeout: 3000,
    },
  },
};

// Connection timeout helper
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
    ),
  ]);
}

// Batch query optimizer for reading multiple documents
export async function batchQuery<T>(
  collection: any,
  queries: Array<{ filter: any; projection?: any }>,
  timeoutMs = 5000
): Promise<T[]> {
  try {
    const results = await Promise.allSettled(
      queries.map(({ filter, projection }) =>
        withTimeout(
          collection.findOne(filter, projection ? { projection } : {}),
          timeoutMs
        )
      )
    );

    return results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<T>).value);
  } catch (error) {
    console.error('[DB] Batch query error:', error);
    return [];
  }
}

// Query with circuit breaker pattern
let failureCount = 0;
let circuitOpen = false;
let circuitResetTime = 0;

export async function queryWithCircuitBreaker<T>(
  fn: () => Promise<T>
): Promise<T | null> {
  if (circuitOpen) {
    if (Date.now() > circuitResetTime) {
      circuitOpen = false;
      failureCount = 0;
    } else {
      return null;
    }
  }

  try {
    const result = await fn();
    failureCount = 0;
    return result;
  } catch (error) {
    failureCount++;
    if (failureCount > 5) {
      circuitOpen = true;
      circuitResetTime = Date.now() + 30000; // 30 second reset
      console.error('[DB] Circuit breaker opened due to errors');
    }
    throw error;
  }
}
