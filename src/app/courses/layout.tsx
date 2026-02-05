import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Courses',
  description: 'Explore our comprehensive courses and enhance your skills.',
};

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
