'use client';

import { useEffect } from 'react';

const CURSOR_STYLES = new Set(['sparkle', 'neon', 'classic', 'magic']);

function applyCursorStyle(style: string) {
  if (!CURSOR_STYLES.has(style)) return;
  document.documentElement.dataset.cursor = style;
}

export default function SiteSettingsClient() {
  useEffect(() => {
    let cancelled = false;

    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/site-settings', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data?.cursorStyle) {
          applyCursorStyle(data.cursorStyle);
        }
      } catch (error) {
        console.error('❌ [Site Settings] Failed to load settings:', error);
      }
    };

    const handler = (event: Event) => {
      const detail = (event as CustomEvent)?.detail;
      if (detail?.cursorStyle) {
        applyCursorStyle(detail.cursorStyle);
      }
    };

    fetchSettings();
    window.addEventListener('site-settings-updated', handler as EventListener);

    return () => {
      cancelled = true;
      window.removeEventListener('site-settings-updated', handler as EventListener);
    };
  }, []);

  return null;
}

