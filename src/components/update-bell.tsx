'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';

const UPDATES_UNREAD_KEY = 'updatesUnreadCount';

export default function UpdateBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const readCount = () => Number(localStorage.getItem(UPDATES_UNREAD_KEY) || 0);
    setCount(readCount());

    const handleStorage = (event: StorageEvent) => {
      if (event.key === UPDATES_UNREAD_KEY) {
        setCount(readCount());
      }
    };

    const handleCustom = (event: Event) => {
      const detail = (event as CustomEvent<{ count: number }>).detail;
      if (detail && typeof detail.count === 'number') {
        setCount(detail.count);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('updates:unread', handleCustom as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('updates:unread', handleCustom as EventListener);
    };
  }, []);

  return (
    <Link
      href="/updates"
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-white/95 dark:hover:bg-white/10 transition"
      aria-label="Updates"
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 shadow">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
