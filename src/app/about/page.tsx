import type { Metadata } from 'next';
import AboutPageClient from './page-client';
import { getPageContent } from '@/lib/page-content-cache';
import { getImageById } from '@/lib/image-service';
import clientPromise from '@/lib/mongodb';

// Enable ISR - revalidate every 60 seconds
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'About',
};

type ImagePlaceholder = {
  id: string;
  imageUrl: string;
  description?: string;
  title?: string;
  imageHint?: string;
};

type AboutContent = {
  hero: {
    title: string;
    description: string;
    imageId: string;
    image?: ImagePlaceholder;
  };
  story: {
    title: string;
    paragraphs: string[];
  };
  values: {
    title: string;
    description: string;
    items: Array<{ title: string; description: string }>;
  };
  founder: {
    title: string;
    description: string;
    name: string;
    role: string;
    bio: string;
    highlights: string[];
    imageId: string;
    image?: ImagePlaceholder;
    socials: {
      linkedin: string;
      twitter: string;
      instagram: string;
      youtube: string;
    };
  };
};

const DEFAULT_ABOUT_CONTENT: AboutContent = {
  hero: { 
    title: 'About Us', 
    description: 'Discover our mission and what drives us', 
    imageId: '' 
  },
  story: { 
    title: 'Our Story', 
    paragraphs: [] 
  },
  values: { 
    title: 'Core Values', 
    description: '', 
    items: [] 
  },
  founder: { 
    title: 'Meet Our Founder', 
    description: '', 
    name: '', 
    role: '', 
    bio: '', 
    highlights: [],
    imageId: '', 
    image: undefined, 
    socials: { linkedin: '', twitter: '', instagram: '', youtube: '' } 
  },
};

async function getAboutContent(): Promise<AboutContent> {
  try {
    const contentFromDb = await getAboutContentFromDb();
    const content = contentFromDb || await getPageContent('about');
    
    // Validate the content structure has required properties
    if (
      Object.keys(content).length > 0 &&
      content.hero &&
      content.story &&
      content.values &&
      content.founder
    ) {
      console.log('✅ [About Page] About content loaded successfully');
      if (!contentFromDb) {
        await upsertAboutContent(content as AboutContent);
      }
      
      // Fetch hero image from database if imageId is provided
      let aboutContentWithImage: AboutContent = content as AboutContent;
      if (content.hero?.imageId) {
        const heroImage = await getImageById(content.hero.imageId);
        if (heroImage) {
          aboutContentWithImage = {
            ...content,
            hero: {
              ...content.hero,
              image: heroImage,
            },
          } as AboutContent;
          console.log('✅ [About Page] Hero image fetched from database');
        }
      }
      
      // Fetch founder image if provided
      if ((content as any)?.founder?.imageId) {
        const founderImage = await getImageById((content as any).founder.imageId);
        if (founderImage) {
          aboutContentWithImage = {
            ...(aboutContentWithImage || (content as AboutContent)),
            founder: {
              ...(aboutContentWithImage || (content as AboutContent)).founder,
              image: founderImage,
            },
          } as AboutContent;
          console.log('? [About Page] Founder image fetched from database');
        }
      }

      return aboutContentWithImage;
    }
    
    console.log('⚠️  [About Page] No valid about content found, using default');
    return DEFAULT_ABOUT_CONTENT;
  } catch (error) {
    console.error("❌ [About Page] Failed to fetch about content:", error);
    return DEFAULT_ABOUT_CONTENT;
  }
}

async function getAboutContentFromDb(): Promise<AboutContent | null> {
  try {
    const client = await clientPromise;
    const dbName = process.env.MONGO_DB || process.env.MONGODB_DB || 'xmartydb';
    const db = client.db(dbName);
    const aboutCollection = db.collection('about_page');
    const aboutDoc = (await aboutCollection.findOne({ slug: 'about' }))
      || (await aboutCollection.findOne({}));

    if (!aboutDoc) return null;

    const normalized: AboutContent = {
      ...DEFAULT_ABOUT_CONTENT,
      ...aboutDoc,
      hero: {
        ...DEFAULT_ABOUT_CONTENT.hero,
        ...(aboutDoc as any).hero,
      },
      story: {
        ...DEFAULT_ABOUT_CONTENT.story,
        ...(aboutDoc as any).story,
        paragraphs: Array.isArray((aboutDoc as any).story?.paragraphs)
          ? (aboutDoc as any).story.paragraphs
          : [],
      },
      values: {
        ...DEFAULT_ABOUT_CONTENT.values,
        ...(aboutDoc as any).values,
        items: Array.isArray((aboutDoc as any).values?.items)
          ? (aboutDoc as any).values.items
          : [],
      },
      founder: {
        ...DEFAULT_ABOUT_CONTENT.founder,
        ...(aboutDoc as any).founder,
        socials: {
          ...DEFAULT_ABOUT_CONTENT.founder.socials,
          ...((aboutDoc as any).founder?.socials || {}),
        },
        highlights: Array.isArray((aboutDoc as any).founder?.highlights)
          ? (aboutDoc as any).founder.highlights
          : [],
      },
    };

    return normalized;
  } catch (error) {
    console.error('❌ [About Page] Failed to fetch About from DB:', error);
    return null;
  }
}

async function upsertAboutContent(payload: AboutContent) {
  try {
    const client = await clientPromise;
    const dbName = process.env.MONGO_DB || process.env.MONGODB_DB || 'xmartydb';
    const db = client.db(dbName);
    await db.collection('about_page').updateOne(
      { slug: 'about' },
      {
        $set: {
          slug: 'about',
          ...payload,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('❌ [About Page] Failed to upsert About content:', error);
  }
}

export default async function AboutPage() {
  const aboutContent = await getAboutContent();
  return <AboutPageClient initialAboutContent={aboutContent} />;
}
