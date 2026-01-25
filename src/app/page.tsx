import HomePageClient from './home-page-client';
import type { Metadata } from 'next';
import { getPageContent } from '@/lib/page-content-cache';

// Enable ISR - revalidate every 60 seconds
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Home',
};

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

const DEFAULT_HOME_CONTENT: HomeContent = {
  hero: { title: 'Learn & Grow', description: 'Master new skills with our expert courses', buttons: { primary: { text: 'Get Started', link: '/courses' }, secondary: { text: 'Join Community', link: '#' }}},
  featuredCourses: { 
    title: 'Featured Courses', 
    description: 'Explore our most popular courses',
    courses: [
      { title: 'Web Development', description: 'Learn modern web development', imageId: 'placeholder-1' },
      { title: 'Mobile Apps', description: 'Build amazing mobile applications', imageId: 'placeholder-2' },
      { title: 'Data Science', description: 'Master data science and analytics', imageId: 'placeholder-3' }
    ] 
  },
  whyChooseUs: { title: '', description: '', features: [] },
  testimonials: { title: '', description: '', reviews: [] },
};

async function getHomeContent(): Promise<HomeContent> {
  try {
    const content = await getPageContent('home');
    
    // Validate the content structure has required properties
    if (
      Object.keys(content).length > 0 &&
      content.hero &&
      content.featuredCourses &&
      Array.isArray(content.featuredCourses.courses)
    ) {
      console.log('✅ [Home Page] Home content loaded successfully');
      console.log('📊 [Home Page] Featured Courses:', content.featuredCourses.courses?.length || 0);
      return content as HomeContent;
    }
    
    console.log('⚠️  [Home Page] No valid home content found, using default');
    return DEFAULT_HOME_CONTENT;
  } catch (error) {
    console.error("❌ [Home Page] Failed to fetch home content:", error);
    return DEFAULT_HOME_CONTENT;
  }
}

export default async function Home() {
  const homeContent = await getHomeContent();
  return <HomePageClient initialHomeContent={homeContent} />;
}
