'use client';

import { useState, useEffect, useCallback } from 'react';
import { type ThemePref, getStoredPref, resolveTheme, applyResolved, setThemePref as setPref } from '@/lib/theme';

export function useTheme() {
  const [pref, setPrefState] = useState<ThemePref>(getStoredPref);
  const [resolved, setResolved] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const t = resolveTheme(pref);
    applyResolved(t);
    setResolved(t);
  }, [pref]);

  useEffect(() => {
    if (pref !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const t = e.matches ? 'dark' : 'light';
      applyResolved(t);
      setResolved(t);
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [pref]);

  const setPrefFn = useCallback((newPref: ThemePref) => {
    setPref(newPref);
    setPrefState(newPref);
  }, []);

  return { pref, resolved, setPref: setPrefFn };
}
