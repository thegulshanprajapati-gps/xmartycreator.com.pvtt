import clientPromise from '@/lib/mongodb';

// Resolve DB name from env or from the URI itself to avoid writing to a different DB than the connection string.
const deriveDbName = () => {
  const envDb = process.env.MONGO_DB || process.env.MONGODB_DB;
  if (envDb) return envDb;
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (uri) {
    try {
      const u = new URL(uri);
      const path = u.pathname.replace('/', '');
      if (path) return path;
    } catch {}
  }
  return 'myapp';
};

type AnalyticsDoc = {
  slug: 'analytics';
  content?: {
    pageViews?: Record<string, number>;
    linkClicks?: Record<string, number>;
  };
};

type DailyDoc = {
  date: string; // YYYY-MM-DD
  pageViews?: Record<string, number>;
  linkClicks?: Record<string, number>;
  totalPageViews?: number;
  totalLinkClicks?: number;
};

// Use the same DB everywhere; derive from env/URI, fallback to "myapp".
const dbName = deriveDbName();

function emptyContent() {
  return { pageViews: {}, linkClicks: {}, dailyTotals: [] as any[] };
}

// Some older records stored content twice (content.content). Normalize that shape.
function normalizeContent(raw: any) {
  if (!raw) return { pageViews: {}, linkClicks: {} };
  const inner = raw.pageViews || raw.linkClicks ? raw : raw.content || {};
  return {
    pageViews: inner.pageViews || {},
    linkClicks: inner.linkClicks || {},
  };
}

function getRangeStart(range: string | null) {
  const now = new Date();
  switch (range) {
    case 'today': {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case '7d': {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case '30d': {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    default:
      return new Date(0);
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const range = url.searchParams.get('range'); // today | 7d | 30d | all
    const startDate = getRangeStart(range);
    const startKey = startDate.toISOString().slice(0, 10); // YYYY-MM-DD
    const todayKey = new Date().toISOString().slice(0, 10);

    const client = await clientPromise;
    const db = client.db(dbName);

    // Fetch daily docs in range
    const dailyDocs = await db
      .collection<DailyDoc>('analytics_daily')
      .find({ date: { $gte: startKey } })
      .toArray();

    let pageViewsAgg: Record<string, number> = {};
    let linkClicksAgg: Record<string, number> = {};
    const dailyTotals: { date: string; pageViews: number; linkClicks: number }[] = [];

    if (dailyDocs.length) {
      for (const doc of dailyDocs) {
        const pv = doc.pageViews || {};
        const lc = doc.linkClicks || {};
        for (const [k, v] of Object.entries(pv)) {
          pageViewsAgg[k] = (pageViewsAgg[k] || 0) + (v || 0);
        }
        for (const [k, v] of Object.entries(lc)) {
          linkClicksAgg[k] = (linkClicksAgg[k] || 0) + (v || 0);
        }
        dailyTotals.push({
          date: doc.date,
          pageViews: doc.totalPageViews || Object.values(pv).reduce((a, b) => a + (b || 0), 0),
          linkClicks: doc.totalLinkClicks || Object.values(lc).reduce((a, b) => a + (b || 0), 0),
        });
      }
    } else {
      // Fallback to legacy single doc
      const doc = (await db.collection<AnalyticsDoc>('pages').findOne({ slug: 'analytics' })) || null;
      const normalized = normalizeContent(doc?.content);
      pageViewsAgg = normalized.pageViews;
      linkClicksAgg = normalized.linkClicks;

      // Provide a synthetic daily point so the chart isn't empty
      const totalPv = Object.values(pageViewsAgg).reduce((a, b) => a + (b || 0), 0);
      const totalLc = Object.values(linkClicksAgg).reduce((a, b) => a + (b || 0), 0);
      dailyTotals.push({
        date: todayKey,
        pageViews: totalPv,
        linkClicks: totalLc,
      });
    }

    return Response.json({
      slug: 'analytics',
      content: {
        pageViews: pageViewsAgg,
        linkClicks: linkClicksAgg,
        dailyTotals: dailyTotals.sort((a, b) => a.date.localeCompare(b.date)),
      },
    });
  } catch (error) {
    console.error('[analytics API] GET failed', error);
    return Response.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const client = await clientPromise;
    const db = client.db(dbName);

    const todayKey = new Date().toISOString().slice(0, 10);
    const analyticsColl = db.collection('pages');
    const dailyColl = db.collection<DailyDoc>('analytics_daily');

    // Increment-only fast paths
    if (payload?.type === 'pageview' && typeof payload.pathname === 'string') {
      const field = `content.pageViews.${payload.pathname}`;
      await analyticsColl.updateOne(
        { slug: 'analytics' },
        { $inc: { [field]: 1 } },
        { upsert: true }
      );

      await dailyColl.updateOne(
        { date: todayKey },
        {
          $inc: {
            [`pageViews.${payload.pathname}`]: 1,
            totalPageViews: 1,
          },
        },
        { upsert: true }
      );

      return Response.json({ success: true });
    }

    if (payload?.type === 'link' && typeof payload.linkName === 'string') {
      const field = `content.linkClicks.${payload.linkName}`;
      await analyticsColl.updateOne(
        { slug: 'analytics' },
        { $inc: { [field]: 1 } },
        { upsert: true }
      );

      await dailyColl.updateOne(
        { date: todayKey },
        {
          $inc: {
            [`linkClicks.${payload.linkName}`]: 1,
            totalLinkClicks: 1,
          },
        },
        { upsert: true }
      );

      return Response.json({ success: true });
    }

    // Full overwrite (used by admin/editor)
    const content = normalizeContent(payload?.content || payload);
    await analyticsColl.updateOne(
      { slug: 'analytics' },
      { $set: { slug: 'analytics', content } },
      { upsert: true }
    );
    return Response.json({ success: true });
  } catch (error) {
    console.error('[analytics API] POST failed', error);
    return Response.json({ error: 'Failed to save analytics' }, { status: 500 });
  }
}
