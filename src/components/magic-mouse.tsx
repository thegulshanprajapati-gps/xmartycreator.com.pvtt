'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    magicMouse?: (options?: Record<string, unknown>) => void;
  }
}

const MAGIC_MOUSE_SRC =
  'https://res.cloudinary.com/veseylab/raw/upload/v1684982764/magicmouse-2.0.0.cdn.min.js';

export default function MagicMouseProvider() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supportsFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isSmallViewport = window.innerWidth < 768;

    if (!supportsFinePointer || prefersReducedMotion || isSmallViewport) {
      return;
    }

    const root = document.documentElement;

    const applyHoverClasses = () => {
      const selectors =
        'a, button, [role="button"], .cursor-pointer, input, textarea, select, summary';
      document.querySelectorAll(selectors).forEach((el) => {
        if (!el.classList.contains('magic-hover')) {
          el.classList.add('magic-hover');
        }
      });
    };

    applyHoverClasses();

    const observer = new MutationObserver(() => applyHoverClasses());
    observer.observe(document.body, { childList: true, subtree: true });

    const initMagicMouse = () => {
      if (window.magicMouse) {
        window.magicMouse({
          cursorOuter: 'circle',
          hoverEffect: 'circle-move',
          hoverItemMove: false,
          defaultCursor: false,
          outerWidth: 32,
          outerHeight: 32,
        });
        root.classList.add('magic-mouse-enabled');
      }
    };

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

    return () => {
      observer.disconnect();
      root.classList.remove('magic-mouse-enabled');
    };
  }, []);

  return null;
}
