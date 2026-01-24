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
    
    if (page?.content) {
      console.log('✅ [Admin] Home content found');
      return page.content;
    }
    
    console.log('⚠️  [Admin] No home content found, using defaults');
    // Return a default structure if not found
    return {
      hero: { title: '', description: '', buttons: { primary: { text: '', link: '' }, secondary: { text: '', link: '' }}},
      featuredCourses: { title: '', description: '', courses: [] },
      whyChooseUs: { title: '', description: '', features: [] },
      testimonials: { title: '', description: '', reviews: [] },
    };
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
