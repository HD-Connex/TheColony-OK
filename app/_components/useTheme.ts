'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { type ThemePref, getStoredPref, resolveTheme, applyResolved, setThemePref as setPref } from '@/lib/theme';

export function useTheme() {
  const [pref, setPrefState] = useState<ThemePref>(getStoredPref);
  const resolved = useMemo<'light' | 'dark'>(() => resolveTheme(pref), [pref]);

  useEffect(() => {
    applyResolved(resolved);
  }, [resolved]);

  useEffect(() => {
    if (pref !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const t = e.matches ? 'dark' : 'light';
      // `resolved` is derived from `pref` via useMemo; in system mode we apply the
      // OS change directly to the DOM (no setter needed).
      applyResolved(t);
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
