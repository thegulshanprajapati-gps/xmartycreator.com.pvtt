import HomePageClient from './home-page-client';
import type { Metadata } from 'next';
import { getPageContent } from '@/lib/page-content-cache';

// Enable ISR - revalidate every 60 seconds
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Home',
};

const DEFAULT_HOME_CONTENT = {
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

async function getHomeContent() {
  try {
    const content = await getPageContent('home');
    
    if (Object.keys(content).length > 0) {
      console.log('✅ [Home Page] Home content loaded successfully');
      console.log('📊 [Home Page] Featured Courses:', content.featuredCourses?.courses?.length || 0);
      return content;
    }
    
    console.log('⚠️  [Home Page] No home content found, using default');
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
