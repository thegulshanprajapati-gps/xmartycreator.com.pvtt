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

type ButtonLink = {
  text: string;
  url: string;
};

type AboutContent = {
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    imageId: string;
    image?: ImagePlaceholder;
    primaryButton: ButtonLink;
    secondaryButton: ButtonLink;
  };
  stats: Array<{ icon: string; count: string; label: string }>;
  journey: Array<{ icon: string; year: string; title: string; description: string }>;
  founder: {
    imageId: string;
    image?: ImagePlaceholder;
    name: string;
    role: string;
    username: string;
    description: string;
    quote: string;
    socials: {
      instagram: string;
      telegram: string;
      youtube: string;
    };
  };
  services: Array<{ icon: string; title: string; description: string }>;
  cta: {
    imageId: string;
    image?: ImagePlaceholder;
    title: string;
    subtitle: string;
    primaryButton: ButtonLink;
    secondaryButton: ButtonLink;
  };
};

const DEFAULT_ABOUT_CONTENT: AboutContent = {
  hero: {
    badge: 'Trusted by learners',
    title: 'Building premium MERN learning experiences for ambitious students.',
    subtitle: 'Dynamic exam updates, community support and polished learning tools, powered by MongoDB and React.',
    imageId: '',
    primaryButton: { text: 'Explore Courses', url: '/courses' },
    secondaryButton: { text: 'Contact Us', url: '/contact' },
  },
  stats: [
    { icon: 'users', count: '12k+', label: 'Students Helped' },
    { icon: 'book-open', count: '1.8k', label: 'Resources Shared' },
    { icon: 'trending-up', count: '97%', label: 'Career Updates' },
    { icon: 'heart', count: '24/7', label: 'Community Support' },
  ],
  journey: [
    { icon: 'sparkles', year: '2022', title: 'Launch', description: 'Started with a simple mission to simplify board updates.' },
    { icon: 'rocket', year: '2023', title: 'Growth', description: 'Expanded our platform with community resources and live support.' },
    { icon: 'shield-check', year: '2024', title: 'Scale', description: 'Optimized for modern MERN workflows and premium student experience.' },
    { icon: 'award', year: '2025', title: 'Leadership', description: 'Established Xmarty Creator as a trusted academic partner.' },
  ],
  founder: {
    imageId: '',
    name: 'Ankit Raj',
    role: 'Founder & CEO',
    username: '@xmartycreator',
    description: 'Crafting premium education tools with clean UI, modern workflows, and community-first learning.',
    quote: 'We believe every student deserves access to polished resources, real support, and a modern learning journey.',
    socials: {
      instagram: '',
      telegram: '',
      youtube: '',
    },
  },
  services: [
    { icon: 'book-open', title: 'SBTE Updates', description: 'Instant board news, exam notes, and timely learning alerts.' },
    { icon: 'globe', title: 'Study Resources', description: 'Curated notes and premium guides designed for effective revision.' },
    { icon: 'trending-up', title: 'Career Updates', description: 'Support for exam success, job preparation and growth plans.' },
    { icon: 'message-circle', title: 'Live Support', description: 'Real-time guidance for students, doubts and classroom readiness.' },
    { icon: 'users', title: 'Community', description: 'A trusted peer network for collaboration, motivation and sharing.' },
  ],
  cta: {
    imageId: '',
    title: 'Let’s build your future together.',
    subtitle: 'Launch your study journey with a premium platform made for modern learners.',
    primaryButton: { text: 'Start Now', url: '/signup' },
    secondaryButton: { text: 'Talk to Us', url: '/contact' },
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
      content.founder &&
      content.services &&
      content.cta
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

      if ((content as any)?.cta?.imageId) {
        const ctaImage = await getImageById((content as any).cta.imageId);
        if (ctaImage) {
          aboutContentWithImage = {
            ...(aboutContentWithImage || (content as AboutContent)),
            cta: {
              ...((aboutContentWithImage || (content as AboutContent)).cta || DEFAULT_ABOUT_CONTENT.cta),
              image: ctaImage,
            },
          } as AboutContent;
          console.log('? [About Page] CTA image fetched from database');
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
      stats: Array.isArray((aboutDoc as any).stats)
        ? (aboutDoc as any).stats.map((item: any) => ({
            icon: String(item?.icon || '') || '',
            count: String(item?.count || ''),
            label: String(item?.label || ''),
          }))
        : DEFAULT_ABOUT_CONTENT.stats,
      journey: Array.isArray((aboutDoc as any).journey)
        ? (aboutDoc as any).journey.map((item: any) => ({
            icon: String(item?.icon || '') || '',
            year: String(item?.year || ''),
            title: String(item?.title || ''),
            description: String(item?.description || ''),
          }))
        : DEFAULT_ABOUT_CONTENT.journey,
      founder: {
        ...DEFAULT_ABOUT_CONTENT.founder,
        ...(aboutDoc as any).founder,
        socials: {
          ...DEFAULT_ABOUT_CONTENT.founder.socials,
          ...((aboutDoc as any).founder?.socials || {}),
        },
      },
      services: Array.isArray((aboutDoc as any).services)
        ? (aboutDoc as any).services.map((item: any) => ({
            icon: String(item?.icon || '') || '',
            title: String(item?.title || ''),
            description: String(item?.description || ''),
          }))
        : DEFAULT_ABOUT_CONTENT.services,
      cta: {
        ...DEFAULT_ABOUT_CONTENT.cta,
        ...((aboutDoc as any).cta || {}),
        primaryButton: {
          ...DEFAULT_ABOUT_CONTENT.cta.primaryButton,
          ...((aboutDoc as any).cta?.primaryButton || {}),
        },
        secondaryButton: {
          ...DEFAULT_ABOUT_CONTENT.cta.secondaryButton,
          ...((aboutDoc as any).cta?.secondaryButton || {}),
        },
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
