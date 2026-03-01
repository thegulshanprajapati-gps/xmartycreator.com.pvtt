'use client';

import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';

export function StudentSessionProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
