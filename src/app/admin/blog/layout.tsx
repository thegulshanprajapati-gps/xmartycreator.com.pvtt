import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Blog Admin - Xmarty Creator',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminBlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
