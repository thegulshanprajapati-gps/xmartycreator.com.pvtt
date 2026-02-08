/**
 * Seed Vasant AI brain text into MongoDB Atlas.
 * Usage: node scripts/seed-brain-db.js
 */

const fs = require('fs/promises');
const path = require('path');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const BRAIN_DB_NAME = process.env.BRAIN_DB || 'brain';
const BRAIN_COLLECTION = process.env.BRAIN_COLLECTION || 'contexts';
const BRAIN_DOC_KEY = process.env.BRAIN_DOC_KEY || 'vasant-ai-default';

const FILE_CANDIDATES = ['src/app/brain.txt', 'src/app/brain.text'];

async function loadBrainTextFromFile() {
  for (const relPath of FILE_CANDIDATES) {
    const absolutePath = path.join(process.cwd(), relPath);
    try {
      const text = await fs.readFile(absolutePath, 'utf8');
      const cleaned = text.trim();
      if (cleaned) {
        return { text: cleaned, sourcePath: relPath };
      }
    } catch {
      // try next
    }
  }
  throw new Error('No brain file found. Expected src/app/brain.txt or src/app/brain.text');
}

async function run() {
  if (!MONGO_URI) {
    throw new Error('Missing MONGO_URI or MONGODB_URI in environment');
  }

  const { text, sourcePath } = await loadBrainTextFromFile();
  const client = new MongoClient(MONGO_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();
  const db = client.db(BRAIN_DB_NAME);
  const collection = db.collection(BRAIN_COLLECTION);

  const now = new Date();
  const payload = {
    key: BRAIN_DOC_KEY,
    name: 'Vasant AI Brain',
    content: text,
    source: sourcePath,
    active: true,
    updatedAt: now,
  };

  const result = await collection.updateOne(
    { key: BRAIN_DOC_KEY },
    {
      $set: payload,
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true }
  );

  await collection.createIndex({ key: 1 }, { unique: true });
  await collection.createIndex({ active: 1 });

  const status = result.upsertedCount > 0 ? 'inserted' : 'updated';
  console.log(`[brain-seed] ${status} document in ${BRAIN_DB_NAME}.${BRAIN_COLLECTION}`);
  console.log(`[brain-seed] key=${BRAIN_DOC_KEY}, chars=${text.length}, source=${sourcePath}`);

  await client.close();
}

run().catch((error) => {
  console.error('[brain-seed] failed:', error.message);
  process.exit(1);
});
