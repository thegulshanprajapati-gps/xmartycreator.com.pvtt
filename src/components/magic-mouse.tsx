'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    magicMouse?: (options?: Record<string, unknown>) => void;
  }
}

const MAGIC_MOUSE_SRC =
  'https://res.cloudinary.com/veseylab/raw/upload/v1684982764/magicmouse-2.0.0.cdn.min.js';
const MAGIC_MOUSE_CSS =
  'https://res.cloudinary.com/veseylab/raw/upload/v1684982764/magicmouse-2.0.0.cdn.min.css';
export default function MagicMouseProvider() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supportsFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isSmallViewport = window.innerWidth < 768;

    const root = document.documentElement;

    const applyHoverClasses = () => {
      if (root.dataset.cursor !== 'magic') return;
      const selectors =
        'a, button, [role="button"], .cursor-pointer, input, textarea, select, summary';
      document.querySelectorAll(selectors).forEach((el) => {
        if (!el.classList.contains('magic-hover')) {
          el.classList.add('magic-hover');
        }
      });
    };

    const cleanupMagicMouse = () => {
      root.classList.remove('magic-mouse-enabled');
      document.querySelectorAll('.magicmouse-cursor, .magicmouse-pointer, #magicMouseCursor')
        .forEach((el) => el.remove());
    };

    const initMagicMouse = () => {
      if (root.dataset.cursor !== 'magic') {
        cleanupMagicMouse();
        return;
      }

      if (!supportsFinePointer || prefersReducedMotion || isSmallViewport) {
        cleanupMagicMouse();
        return;
      }

      if (window.magicMouse) {
        window.magicMouse({
          hoverEffect: 'circle-move',
          hoverItemMove: false,
          defaultCursor: false,
          outerWidth: 32,
          outerHeight: 32,
        });
        root.classList.add('magic-mouse-enabled');
      }
    };

    const applyMode = () => {
      const cursorStyle = root.dataset.cursor || 'sparkle';
      if (cursorStyle !== 'magic') {
        cleanupMagicMouse();
        return;
      }

      if (!document.getElementById('magicmouse-css')) {
        const link = document.createElement('link');
        link.id = 'magicmouse-css';
        link.rel = 'stylesheet';
        link.href = MAGIC_MOUSE_CSS;
        document.head.appendChild(link);
      }

      applyHoverClasses();

      if (window.magicMouse) {
        initMagicMouse();
      } else {
        const existingScript = document.getElementById('magicmouse-script') as HTMLScriptElement | null;
        if (existingScript) {
          existingScript.addEventListener('load', initMagicMouse, { once: true });
        } else {
          const script = document.createElement('script');
          script.id = 'magicmouse-script';
          script.src = MAGIC_MOUSE_SRC;
          script.async = true;
          script.onload = initMagicMouse;
          document.body.appendChild(script);
        }
      }
    };

    applyMode();

    const observer = new MutationObserver(() => applyHoverClasses());
    observer.observe(document.body, { childList: true, subtree: true });

    const modeObserver = new MutationObserver(() => applyMode());
    modeObserver.observe(root, { attributes: true, attributeFilter: ['data-cursor'] });

    return () => {
      observer.disconnect();
      modeObserver.disconnect();
      cleanupMagicMouse();
    };
  }, []);

  return null;
}
