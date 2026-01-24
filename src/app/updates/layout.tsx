import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Updates',
};

export default function UpdatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
