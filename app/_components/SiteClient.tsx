'use client';

import { useEffect } from 'react';

/**
 * SiteClient (PWA bootstrap)
 * - Registers SW for offline shell + clips metadata cache (Phase 3)
 * - Future: install prompt, push notifs, background sync for clip uploads
 * Per audit + MOBILE_TWA_PWA strategy. Minimal, no-op if no SW support.
 */
export default function SiteClient() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        // Optional: log for debug (prod: remove or sentry)
        if (process.env.NODE_ENV !== 'production') {
          console.log('[PWA] SW registered', reg.scope);
        }
      } catch (err) {
        // Graceful: PWA is enhancement, never block core site
        if (process.env.NODE_ENV !== 'production') console.warn('[PWA] SW register failed', err);
      }
    };

    // Delay register slightly to not contend with critical LCP
    const t = setTimeout(register, 1200);
    return () => clearTimeout(t);
  }, []);

  return null;
}
 