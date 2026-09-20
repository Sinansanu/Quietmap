import { useEffect, useState } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';

export function useTheme(preference: ThemePreference = 'system') {
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    if (preference === 'dark') return 'dark';
    if (preference === 'light') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (theme: 'light' | 'dark') => {
      setResolvedTheme(theme);
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (preference === 'dark') {
      applyTheme('dark');
      return;
    }

    if (preference === 'light') {
      applyTheme('light');
      return;
    }

    // System mode: track OS / browser color scheme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    applyTheme(mediaQuery.matches ? 'dark' : 'light');

    const handleChange = (e: MediaQueryListEvent) => {
      applyTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [preference]);

  return { resolvedTheme, preference };
}
