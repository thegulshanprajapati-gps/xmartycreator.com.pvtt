'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

export function ThemePersistence() {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme-preference');
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Default to light theme
      setTheme('light');
    }
  }, [setTheme]);

  useEffect(() => {
    // Save theme preference whenever it changes
    if (theme) {
      localStorage.setItem('theme-preference', theme);
    }
  }, [theme]);

  return null;
}
