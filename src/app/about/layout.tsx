import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about Xmarty Creator and our mission.',
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
