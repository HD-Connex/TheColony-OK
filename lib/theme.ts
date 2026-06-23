export type ThemePref = 'system' | 'light' | 'dark';
export const STORAGE_KEY = 'colony:theme';

export function getStoredPref(): ThemePref {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return 'system';
}

export function resolveTheme(pref: ThemePref): 'light' | 'dark' {
  if (pref === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return pref;
}

export function applyResolved(resolved: 'light' | 'dark') {
  document.documentElement.dataset.theme = resolved;
}

export function setThemePref(pref: ThemePref) {
  localStorage.setItem(STORAGE_KEY, pref);
  applyResolved(resolveTheme(pref));
}
