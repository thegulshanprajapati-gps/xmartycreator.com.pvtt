import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import clientPromise from '@/lib/mongodb';

export const runtime = 'nodejs';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const FALLBACK_BRAIN_TEXT =
  'Namaste! I am Vasant AI. Stay concise (max ~80 words unless asked). Use friendly Hinglish. Avoid medical/legal/financial advice. If info missing, ask one clarifying question.';

const BRAIN_DB_NAME = process.env.BRAIN_DB || 'brain';
const BRAIN_COLLECTION = process.env.BRAIN_COLLECTION || 'contexts';
const BRAIN_DOC_KEY = process.env.BRAIN_DOC_KEY || 'vasant-ai-default';
const BRAIN_FILE_CANDIDATES = ['src/app/brain.txt', 'src/app/brain.text'];

async function loadBrainTextFromDatabase() {
  try {
    const client = await clientPromise;
    const db = client.db(BRAIN_DB_NAME);
    const doc = await db.collection(BRAIN_COLLECTION).findOne({
      key: BRAIN_DOC_KEY,
      active: true,
    });

    if (doc && typeof doc.content === 'string') {
      const normalized = doc.content.trim();
      if (normalized) {
        return normalized;
      }
    }
  } catch (error) {
    console.warn('[Chat API] Brain DB fetch failed, falling back to file:', error);
  }
  return '';
}

async function loadBrainTextFromFile() {
  for (const relativePath of BRAIN_FILE_CANDIDATES) {
    const filePath = path.join(process.cwd(), relativePath);
    try {
      const content = await readFile(filePath, 'utf8');
      const normalized = content.trim();
      if (normalized) {
        return normalized;
      }
    } catch {
      // Try next candidate file.
    }
  }
  return FALLBACK_BRAIN_TEXT;
}

async function loadBrainText() {
  const fromDb = await loadBrainTextFromDatabase();
  if (fromDb) return fromDb;
  return loadBrainTextFromFile();
}

export async function POST(req: NextRequest) {
  if (!GROQ_API_KEY) {
    return NextResponse.json(
      { error: 'Groq API key not configured' },
      { status: 500 }
    );
  }

  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid or missing JSON body. Expecting { message, pageUrl, pageTitle }.' },
        { status: 400 }
      );
    }

    const { message, pageUrl, pageTitle } = body;
    const brainText = await loadBrainText();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are Vasant AI, the friendly guide for Xmarty Creator (do not claim to be human).
Current Page: ${pageTitle} (${pageUrl})
Style: Speak in Hinglish (mix of simple Hindi + English), sound like a real person at the front desk.
Tone: Warm, short, human, and to-the-point. 1-3 short sentences max.
Brain: ${brainText}
Behavior: Acknowledge briefly, then give a clear answer or next step. Avoid long explanations.`; 

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        max_tokens: 240,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Groq API Error:', errorData);
      return NextResponse.json(
        {
          error: errorData?.error?.message || 'Failed to get response from AI',
          code: errorData?.error?.code,
          type: errorData?.error?.type,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
