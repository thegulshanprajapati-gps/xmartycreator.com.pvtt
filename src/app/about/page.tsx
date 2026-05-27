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

type HeroCard = {
  title: string;
  value: string;
  description: string;
};

type FeatureCard = {
  icon: string;
  title: string;
  description: string;
};

type Testimonial = {
  id?: string;
  name: string;
  role: string;
  course: string;
  review: string;
  imageUrl?: string;
  rating?: string;
};

type TeamMember = {
  id?: string;
  name: string;
  role: string;
  description?: string;
  imageId: string;
  image?: ImagePlaceholder;
  socials?: Record<string, string>;
};

type FaqItem = {
  question: string;
  answer: string;
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
    cards: HeroCard[];
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
    highlights: string[];
    socials: {
      instagram: string;
      telegram: string;
      youtube: string;
      linkedin?: string;
      twitter?: string;
      github?: string;
      website?: string;
    };
  };
  services: Array<{ icon: string; title: string; description: string }>;
  features: FeatureCard[];
  testimonials: Testimonial[];
  team: TeamMember[];
  faq: FaqItem[];
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
    badge: 'Trusted by 12,000+ learners',
    title: 'Building the Future of Smart Learning',
    subtitle: 'XmartyCreator brings premium MERN-powered study tools, live guidance, and community-driven success to every student.',
    imageId: '',
    primaryButton: { text: 'Explore Courses', url: '/courses' },
    secondaryButton: { text: 'Join Community', url: '/community' },
    cards: [
      { title: 'Active learners', value: '12k+', description: 'engaged in live lessons and resources' },
      { title: 'Monthly sessions', value: '1.8k', description: 'interactive study clinics and walkthroughs' },
      { title: 'Growth rate', value: '97%', description: 'student outcomes improved with our platform' },
    ],
  },
  stats: [
    { icon: 'users', count: '12k+', label: 'Students Helped' },
    { icon: 'book-open', count: '1.8k', label: 'Resources Shared' },
    { icon: 'trending-up', count: '97%', label: 'Career Growth' },
    { icon: 'life-buoy', count: '24/7', label: 'Community Support' },
  ],
  journey: [
    { icon: 'sparkles', year: '2022', title: 'Launch', description: 'Started with a bold mission to modernize education for board exam learners.' },
    { icon: 'rocket', year: '2023', title: 'Growth', description: 'Scaled our learning engine with study resources, group coaching, and premium UX.' },
    { icon: 'shield-check', year: '2024', title: 'Scale', description: 'Enhanced reliability and polished dashboard tools for every student journey.' },
    { icon: 'award', year: '2025', title: 'Leadership', description: 'Became the trusted premium edu-platform for smart learners.' },
  ],
  founder: {
    imageId: '',
    name: 'Ankit Raj',
    role: 'Founder & CEO',
    username: '@xmartycreator',
    description: 'Leading XmartyCreator with focus on premium resources, real community support, and modern study systems.',
    quote: 'Our vision is to make learning feel premium, powerful, and supportive for every ambitious student.',
    highlights: ['Premium study curation', '24/7 peer support', 'Career-ready exam guidance'],
    socials: {
      instagram: '',
      telegram: '',
      youtube: '',
      linkedin: '',
      twitter: '',
      github: '',
      website: '',
    },
  },
  services: [
    { icon: 'book-open', title: 'Premium Resources', description: 'Curated guides and modern study kits for exam success.' },
    { icon: 'message-circle', title: 'Community Support', description: 'Trusted learner communities with mentors and live help.' },
    { icon: 'trending-up', title: 'Career Guidance', description: 'Direction for exams, skills and next-level opportunities.' },
    { icon: 'shield-check', title: 'Exam Updates', description: 'Instant board notices, syllabus alerts, and revision planning.' },
    { icon: 'users', title: 'Real Student Help', description: 'Peer-backed study groups and authentic academic support.' },
  ],
  features: [
    { icon: 'sparkles', title: 'Smart Learning', description: 'Adaptive study flow designed for focus, speed, and retention.' },
    { icon: 'book-open', title: 'Premium Resources', description: 'Modern notes, exam prep kits, and verified study paths.' },
    { icon: 'users', title: 'Community Support', description: 'Live groups, mentor access, and collaborative study spaces.' },
    { icon: 'trending-up', title: 'Career Guidance', description: 'Guidance, exam strategy, and next-step pathways.' },
    { icon: 'shield-check', title: 'Exam Updates', description: 'Never miss changes, results, or important board announcements.' },
    { icon: 'globe', title: 'Global Access', description: 'Premium learning wherever students need it, on any device.' },
  ],
  testimonials: [
    {
      id: 't1',
      name: 'Priya Sharma',
      role: 'Science Student',
      course: 'Physics Accelerator',
      review: 'XmartyCreator raised my confidence with organized notes and real-time support. It feels like a premium academic partner.',
      imageUrl: '',
      rating: '5.0',
    },
    {
      id: 't2',
      name: 'Rohit Singh',
      role: 'Commerce Student',
      course: 'Accountancy Masters',
      review: 'The platform is sharp, modern and extremely reliable for exam preparation. Support is fast and knowledgeable.',
      imageUrl: '',
      rating: '4.9',
    },
    {
      id: 't3',
      name: 'Sana Khan',
      role: 'Arts Student',
      course: 'Creative Study Labs',
      review: 'I loved the premium dashboard and the learning resources. The whole experience feels trusted and polished.',
      imageUrl: '',
      rating: '4.8',
    },
  ],
  team: [
    { id: 'team-1', name: 'Ankit Raj', role: 'Founder & CEO', description: 'Building the vision, product direction, and premium learner experience.', imageId: '', socials: {} },
    { id: 'team-2', name: 'Mina Patel', role: 'Lead Developer', description: 'Designing fast MERN products with modern UI and responsive performance.', imageId: '', socials: {} },
    { id: 'team-3', name: 'Ishaan Verma', role: 'Community Lead', description: 'Keeping learners connected with support, updates, and success guidance.', imageId: '', socials: {} },
    { id: 'team-4', name: 'Nisha Kapoor', role: 'Content Lead', description: 'Crafting premium study materials that feel smart and easy to follow.', imageId: '', socials: {} },
  ],
  faq: [
    { question: 'Is XmartyCreator free to join?', answer: 'XmartyCreator offers free access to core course previews, with premium pathways and community upgrades available for advanced learners.' },
    { question: 'How do I join the community?', answer: 'Sign up on the platform, choose your study path, and access the community hub for live support and collaboration.' },
    { question: 'What premium benefits do students get?', answer: 'Students receive curated resources, exam updates, live guidance, and a smooth learning dashboard built for modern study habits.' },
    { question: 'Can I access XmartyCreator anywhere?', answer: 'Yes, the platform is fully responsive, optimized for mobile, tablet, and desktop use so students can learn from anywhere.' },
  ],
  cta: {
    imageId: '',
    title: 'Start Your Learning Journey Today',
    subtitle: 'Join XmartyCreator to access premium study systems, real support, and modern learning momentum.',
    primaryButton: { text: 'Explore Courses', url: '/courses' },
    secondaryButton: { text: 'Join Community', url: '/community' },
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
        cards: Array.isArray((aboutDoc as any).hero?.cards)
          ? (aboutDoc as any).hero.cards.map((item: any) => ({
              title: String(item?.title || ''),
              value: String(item?.value || ''),
              description: String(item?.description || ''),
            }))
          : DEFAULT_ABOUT_CONTENT.hero.cards,
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
        highlights: Array.isArray((aboutDoc as any).founder?.highlights)
          ? (aboutDoc as any).founder.highlights.map((item: any) => String(item || ''))
          : DEFAULT_ABOUT_CONTENT.founder.highlights,
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
      features: Array.isArray((aboutDoc as any).features)
        ? (aboutDoc as any).features.map((item: any) => ({
            icon: String(item?.icon || '') || '',
            title: String(item?.title || ''),
            description: String(item?.description || ''),
          }))
        : DEFAULT_ABOUT_CONTENT.features,
      testimonials: Array.isArray((aboutDoc as any).testimonials)
        ? (aboutDoc as any).testimonials.map((item: any) => ({
            id: String(item?.id || ''),
            name: String(item?.name || ''),
            role: String(item?.role || ''),
            course: String(item?.course || ''),
            review: String(item?.review || ''),
            imageUrl: String(item?.imageUrl || ''),
            rating: String(item?.rating || ''),
          }))
        : DEFAULT_ABOUT_CONTENT.testimonials,
      team: Array.isArray((aboutDoc as any).team)
        ? (aboutDoc as any).team.map((item: any) => ({
            id: String(item?.id || ''),
            name: String(item?.name || ''),
            role: String(item?.role || ''),
            description: String(item?.description || ''),
            imageId: String(item?.imageId || ''),
            image: item?.image || undefined,
            socials: item?.socials || {},
          }))
        : DEFAULT_ABOUT_CONTENT.team,
      faq: Array.isArray((aboutDoc as any).faq)
        ? (aboutDoc as any).faq.map((item: any) => ({
            question: String(item?.question || ''),
            answer: String(item?.answer || ''),
          }))
        : DEFAULT_ABOUT_CONTENT.faq,
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
