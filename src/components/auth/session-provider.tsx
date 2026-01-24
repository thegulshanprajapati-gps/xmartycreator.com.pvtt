
'use client';

import { createContext, useContext, ReactNode } from 'react';

interface SessionContextType {
  isLoggedIn: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({
  children,
  isLoggedIn,
}: {
  children: ReactNode;
  isLoggedIn: boolean;
}) {
  return (
    <SessionContext.Provider value={{ isLoggedIn }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
