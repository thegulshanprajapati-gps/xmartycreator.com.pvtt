import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Updates',
};

export default function AdminUpdatesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
