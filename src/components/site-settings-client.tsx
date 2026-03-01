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

function applyLoginButtonVisibilitySetting(enabled: boolean) {
  document.documentElement.dataset.loginOnlyOnBceceLe = enabled ? 'true' : 'false';
  if (document.body) {
    document.body.dataset.loginOnlyOnBceceLe = enabled ? 'true' : 'false';
  }

  try {
    localStorage.setItem('xmarty:loginOnlyOnBceceLe', enabled ? 'true' : 'false');
  } catch {
    // ignore storage errors
  }
}

export default function SiteSettingsClient() {
  useEffect(() => {
    let cancelled = false;

    const fetchSettings = async () => {
      try {
        const cachedCursor = (() => {
          try {
            const value = localStorage.getItem('xmarty:cursorStyle');
            return value && CURSOR_STYLES.has(value) ? value : null;
          } catch {
            return null;
          }
        })();

        if (cachedCursor) {
          applyCursorStyle(cachedCursor);
        }

        try {
          const loginCached = localStorage.getItem('xmarty:loginOnlyOnBceceLe');
          if (loginCached === 'true' || loginCached === 'false') {
            applyLoginButtonVisibilitySetting(loginCached === 'true');
          }
        } catch {
          // ignore storage errors
        }

        const res = await fetch('/api/site-settings', { cache: 'no-store' });
        if (!res.ok) return;

        const data = await res.json();

        if (!cancelled && data?.cursorStyle) {
          // If user already selected a style locally, don't override it with stale DB data.
          if (!cachedCursor) {
            applyCursorStyle(data.cursorStyle);
          }
        }

        if (!cancelled && typeof data?.loginButtonOnlyOnBceceLe === 'boolean') {
          applyLoginButtonVisibilitySetting(data.loginButtonOnlyOnBceceLe);
        }
      } catch (error) {
        console.error('[Site Settings] Failed to load settings:', error);
      }
    };

    const handler = (event: Event) => {
      const detail = (event as CustomEvent)?.detail;
      if (detail?.cursorStyle) {
        applyCursorStyle(detail.cursorStyle);
      }
      if (typeof detail?.loginButtonOnlyOnBceceLe === 'boolean') {
        applyLoginButtonVisibilitySetting(detail.loginButtonOnlyOnBceceLe);
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
