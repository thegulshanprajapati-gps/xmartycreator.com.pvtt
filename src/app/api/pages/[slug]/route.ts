import clientPromise from "@/lib/mongodb";

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = await params;
  
  try {
    console.log(`?? [API] Starting fetch for page slug: "${slug}"`);
    
    // Connect to MongoDB
    console.log('?? [API] Connecting to MongoDB...');
    const client = await clientPromise;
    console.log('? [API] MongoDB connection established');
    
    const dbName = process.env.MONGO_DB || process.env.MONGODB_DB || "xmartydb";
    const db = client.db(dbName);
    console.log(`?? [API] Selected database: "${dbName}"`);

    if (slug === 'about') {
      const aboutCollection = db.collection('about_page');
      const aboutDoc = (await aboutCollection.findOne({ slug: 'about' }))
        || (await aboutCollection.findOne({}));
      return Response.json(aboutDoc || {});
    }

    // Fetch the page data
    console.log(`?? [API] Querying "pages" collection for slug: "${slug}"`);
    const page = await db
      .collection("pages")
      .findOne({ slug });
    
    if (page) {
      console.log(`? [API] Page found for slug "${slug}", returning content`);
    } else {
      console.log(`??  [API] No page found for slug "${slug}", returning empty object`);
    }

    return Response.json(page?.content || {});
  } catch (error) {
    console.error(`? [API] Error fetching page content for slug "${slug}":`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`?? [API] Error details:`, errorMessage);
    return Response.json({ error: 'Failed to fetch content', details: errorMessage }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = await params;
  
  try {
    console.log(`?? [API] Starting POST for page slug: "${slug}"`);
    
    const body = await req.json();
    console.log(`?? [API] Received payload with keys: ${Object.keys(body).join(', ')}`);
    
    // Connect to MongoDB
    console.log('?? [API] Connecting to MongoDB...');
    const client = await clientPromise;
    console.log('? [API] MongoDB connection established');
    
    const dbName = process.env.MONGO_DB || process.env.MONGODB_DB || "xmartydb";
    const db = client.db(dbName);
    console.log(`?? [API] Selected database: "${dbName}"`);

    if (slug === 'about') {
      const content = body?.content && typeof body.content === 'object' ? body.content : body;
      const result = await db.collection("about_page").updateOne(
        { slug },
        { 
          $set: { 
            slug, 
            ...content,
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      );
      return Response.json({ success: true, modifiedCount: result.modifiedCount, upsertedCount: result.upsertedCount });
    }

    // Special handling for analytics increments so middleware/client can update without full document fetch.
    if (slug === 'analytics' && body?.type === 'pageview' && typeof body.pathname === 'string') {
      const field = `content.pageViews.${body.pathname}`;
      const result = await db.collection("pages").updateOne(
        { slug },
        { $inc: { [field]: 1 } },
        { upsert: true }
      );
      return Response.json({ success: true, modifiedCount: result.modifiedCount, upsertedCount: result.upsertedCount });
    }

    if (slug === 'analytics' && body?.type === 'link' && typeof body.linkName === 'string') {
      const field = `content.linkClicks.${body.linkName}`;
      const result = await db.collection("pages").updateOne(
        { slug },
        { $inc: { [field]: 1 } },
        { upsert: true }
      );
      return Response.json({ success: true, modifiedCount: result.modifiedCount, upsertedCount: result.upsertedCount });
    }

    // Update or insert the page data (generic payload)
    console.log(`?? [API] Updating "pages" collection for slug: "${slug}"`);
    const result = await db.collection("pages").updateOne(
      { slug },
      { $set: { slug, content: body } },
      { upsert: true }
    );
    
    console.log(`? [API] Update complete. Matched: ${result.matchedCount}, Upserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`);
    return Response.json({ success: true, modifiedCount: result.modifiedCount, upsertedCount: result.upsertedCount });
  } catch (error) {
    console.error(`? [API] Error updating page content for slug "${slug}":`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`?? [API] Error details:`, errorMessage);
    return Response.json({ error: 'Failed to update content', details: errorMessage }, { status: 500 });
  }
}
