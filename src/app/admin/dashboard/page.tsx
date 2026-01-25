import type { Metadata } from 'next';
import AdminDashboardClient from './admin-dashboard-client';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin',
};

// Define the type for the home content
type HomeContent = {
  hero: {
    title: string;
    description: string;
    buttons: {
      primary: { text: string; link: string };
      secondary: { text: string; link: string };
    };
  };
  featuredCourses: {
    title: string;
    description: string;
    courses: { title: string; description: string; imageId: string }[];
  };
  whyChooseUs: {
    title: string;
    description: string;
    features: { title: string; description: string }[];
  };
  testimonials: {
    title: string;
    description: string;
    reviews: {
      name: string;
      role: string;
      testimonial: string;
      rating: number;
      avatar: string;
    }[];
  };
};

// Function to fetch content directly from MongoDB
async function getHomeContent(): Promise<HomeContent> {
  try {
    console.log('🔄 [Admin] Fetching home content from MongoDB...');
    const client = await clientPromise;
    const db = client.db('myapp');
    const page = await db.collection('pages').findOne({ slug: 'home' });
    
    // Default structure to ensure all required properties exist
    const defaultContent: HomeContent = {
      hero: { title: '', description: '', buttons: { primary: { text: '', link: '' }, secondary: { text: '', link: '' }}},
      featuredCourses: { title: '', description: '', courses: [] },
      whyChooseUs: { title: '', description: '', features: [] },
      testimonials: { title: '', description: '', reviews: [] },
    };

    if (page?.content) {
      console.log('✅ [Admin] Home content found');
      // Merge database content with defaults to ensure all properties exist
      const mergedContent: HomeContent = {
        hero: page.content.hero || defaultContent.hero,
        featuredCourses: {
          title: page.content.featuredCourses?.title || '',
          description: page.content.featuredCourses?.description || '',
          courses: Array.isArray(page.content.featuredCourses?.courses) ? page.content.featuredCourses.courses : [],
        },
        whyChooseUs: {
          title: page.content.whyChooseUs?.title || '',
          description: page.content.whyChooseUs?.description || '',
          features: Array.isArray(page.content.whyChooseUs?.features) ? page.content.whyChooseUs.features : [],
        },
        testimonials: {
          title: page.content.testimonials?.title || '',
          description: page.content.testimonials?.description || '',
          reviews: Array.isArray(page.content.testimonials?.reviews) ? page.content.testimonials.reviews : [],
        },
      };
      return mergedContent;
    }
    
    console.log('⚠️  [Admin] No home content found, using defaults');
    return defaultContent;
  } catch (error) {
    console.error('❌ [Admin] Failed to fetch home content:', error);
    // Return a default structure if the fetch fails
    return {
      hero: { title: '', description: '', buttons: { primary: { text: '', link: '' }, secondary: { text: '', link: '' }}},
      featuredCourses: { title: '', description: '', courses: [] },
      whyChooseUs: { title: '', description: '', features: [] },
      testimonials: { title: '', description: '', reviews: [] },
    };
  }
}


export default async function AdminDashboard() {
  const homeContent = await getHomeContent();
  return <AdminDashboardClient initialHomeContent={homeContent} />;
}
