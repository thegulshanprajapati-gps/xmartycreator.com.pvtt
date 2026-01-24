import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Login',
  description: 'Admin login for Xmarty Creator.',
};

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
