'use client';

import { useEffect, useRef } from 'react';

const CUSTOM_CURSOR_STYLES = new Set(['pulse', 'orbit', 'glow', 'ripple']);
const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], .cursor-pointer, input, textarea, select, summary';

export default function CustomCursorProvider() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const cursor = cursorRef.current;
    if (!cursor) return;

    let raf = 0;
    let mouseX = 0;
    let mouseY = 0;
    let posX = 0;
    let posY = 0;
    let isVisible = false;

    const supportsFinePointer = () =>
      window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    const updatePosition = () => {
      posX += (mouseX - posX) * 0.18;
      posY += (mouseY - posY) * 0.18;
      cursor.style.transform = `translate3d(${posX}px, ${posY}px, 0)`;
      raf = requestAnimationFrame(updatePosition);
    };

    const handleMove = (event: MouseEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;

      if (!isVisible) {
        cursor.style.opacity = '1';
        isVisible = true;
      }

      const target = event.target as HTMLElement | null;
      const interactive =
        !!target &&
        !!target.closest(INTERACTIVE_SELECTOR) &&
        !target.closest('[data-cursor-ignore]');
      root.classList.toggle('cursor-hover', interactive);

      if (!raf) {
        raf = requestAnimationFrame(updatePosition);
      }
    };

    const handleClick = () => {
      root.classList.add('cursor-click');
      window.clearTimeout((root as any)._cursorClickTimer);
      (root as any)._cursorClickTimer = window.setTimeout(() => {
        root.classList.remove('cursor-click');
      }, 180);
    };

    const handleLeave = () => {
      cursor.style.opacity = '0';
      isVisible = false;
      root.classList.remove('cursor-hover');
    };

    let listening = false;

    const addListeners = () => {
      if (listening) return;
      listening = true;
      document.addEventListener('mousemove', handleMove, { passive: true });
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('mouseleave', handleLeave);
      window.addEventListener('blur', handleLeave);
    };

    const removeListeners = () => {
      if (!listening) return;
      listening = false;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('mouseleave', handleLeave);
      window.removeEventListener('blur', handleLeave);
      root.classList.remove('cursor-hover');
      root.classList.remove('cursor-click');
      cursor.style.opacity = '0';
      cursor.style.display = 'none';
      isVisible = false;
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const applyMode = () => {
      const style = root.dataset.cursor || '';
      const wantsCustom = CUSTOM_CURSOR_STYLES.has(style);
      const enabled = wantsCustom && supportsFinePointer();

      root.classList.toggle('cursor-disabled', wantsCustom && !enabled);

      if (enabled) {
        cursor.style.display = 'block';
        addListeners();
      } else {
        removeListeners();
      }
    };

    applyMode();

    const observer = new MutationObserver(() => applyMode());
    observer.observe(root, { attributes: true, attributeFilter: ['data-cursor'] });

    const hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const handleMedia = () => applyMode();

    hoverQuery.addEventListener?.('change', handleMedia);

    return () => {
      removeListeners();
      observer.disconnect();
      hoverQuery.removeEventListener?.('change', handleMedia);
    };
  }, []);

  return (
    <div ref={cursorRef} id="xmarty-cursor" className="xmarty-cursor" aria-hidden="true">
      <span className="xmarty-cursor-ring" />
      <span className="xmarty-cursor-dot" />
    </div>
  );
}
