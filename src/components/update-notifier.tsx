'use client';

import { useEffect } from 'react';

const NOTIFICATIONS_ENABLED_KEY = 'notificationsEnabled';
const UPDATES_UNREAD_KEY = 'updatesUnreadCount';
const UPDATES_LAST_SEEN_KEY = 'updatesLastSeenAt';
const UPDATES_LAST_NOTIFIED_KEY = 'updatesLastNotifiedAt';

const setUnreadCount = (count: number) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(UPDATES_UNREAD_KEY, String(count));
  window.dispatchEvent(new CustomEvent('updates:unread', { detail: { count } }));
};

export default function UpdateNotifier() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let mounted = true;

    const pollUpdates = async () => {
      try {
        const res = await fetch('/api/updates?status=published&order=desc&sortBy=createdAt', {
          cache: 'no-store',
        });
        if (!res.ok) return;

        const data = await res.json();
        const updates = Array.isArray(data?.updates) ? data.updates : [];
        if (!updates.length || !mounted) return;

        const lastSeen = Number(localStorage.getItem(UPDATES_LAST_SEEN_KEY) || 0);
        const latestAt = Math.max(
          ...updates.map((u: any) => new Date(u.createdAt || u.updatedAt || Date.now()).getTime())
        );
        const newUpdates = updates.filter(
          (u: any) => new Date(u.createdAt || u.updatedAt || 0).getTime() > lastSeen
        );

        if (newUpdates.length > 0) {
          setUnreadCount(newUpdates.length);
        }

        const notificationsEnabled = localStorage.getItem(NOTIFICATIONS_ENABLED_KEY) === 'true';
        const canNotify = notificationsEnabled && 'Notification' in window && Notification.permission === 'granted';
        const lastNotified = Number(localStorage.getItem(UPDATES_LAST_NOTIFIED_KEY) || 0);

        if (canNotify && latestAt > lastNotified) {
          const first = newUpdates[0] || updates[0];
          new Notification('New Update', {
            body: first?.title || 'A new update has been posted.',
          });
          localStorage.setItem(UPDATES_LAST_NOTIFIED_KEY, String(latestAt));
        }
      } catch (error) {
        console.warn('Update notifier failed:', error);
      }
    };

    pollUpdates();
    const interval = setInterval(pollUpdates, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return null;
}
