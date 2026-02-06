'use client';

import { useEffect } from 'react';

const CURSOR_STYLES = new Set([
  'sparkle',
  'neon',
  'classic',
  'magic',
  'pulse',
  'orbit',
  'glow',
  'ripple',
]);

function applyCursorStyle(style: string) {
  if (!CURSOR_STYLES.has(style)) return;
  document.documentElement.dataset.cursor = style;
  if (document.body) {
    document.body.dataset.cursor = style;
  }
  try {
    localStorage.setItem('xmarty:cursorStyle', style);
  } catch {
    // ignore storage errors
  }
}

export default function SiteSettingsClient() {
  useEffect(() => {
    let cancelled = false;

    const fetchSettings = async () => {
      try {
        const cached = (() => {
          try {
            const value = localStorage.getItem('xmarty:cursorStyle');
            return value && CURSOR_STYLES.has(value) ? value : null;
          } catch {
            return null;
          }
        })();
        if (cached) {
          applyCursorStyle(cached);
        }

        const res = await fetch('/api/site-settings', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data?.cursorStyle) {
          // If user already selected a style locally, don't override it with stale DB data.
          if (!cached) {
            applyCursorStyle(data.cursorStyle);
          }
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
