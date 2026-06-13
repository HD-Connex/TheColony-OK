'use client';

import { useEffect, useState } from 'react';
import * as Sentry from "@sentry/nextjs";

/**
 * SiteClient (PWA bootstrap + Heirloom page reveals + Phase 4 theme toggle)
 * - Registers SW for offline shell + clips metadata cache (Phase 3)
 * - Orchestrated load reveal for masthead/folio/hero (stagger, reduced-motion safe)
 * - IntersectionObserver for .rule-draw and .develop elements
 * - Dark/light theme toggle persisted (data-theme on html); default dark (ink) per brutalist DS.
 *   Toggle appears as fixed brutalist button (bottom-right). Pure CSS vars swap. A11y: aria, labels.
 * - Phase 7: RUM CWV observers (LCP/INP/CLS via native PerformanceObserver) reporting to console + Sentry (see useEffect). Term "web-vitals" refers to the metrics (Core Web Vitals).
 */
export default function SiteClient() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Theme init + persist (Phase 4)
    const root = document.documentElement;
    const saved = (localStorage.getItem('colony:theme') as 'dark' | 'light' | null) || 'dark';
    const initial = saved;
    root.setAttribute('data-theme', initial);
    setTheme(initial);

    // PWA SW
    if ('serviceWorker' in navigator) {
      const register = async () => {
        try {
          const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          if (process.env.NODE_ENV !== 'production') {
            console.log('[PWA] SW registered', reg.scope);
          }
        } catch (err) {
          if (process.env.NODE_ENV !== 'production') console.warn('[PWA] SW register failed', err);
        }
      };
      const t = setTimeout(register, 1200);
      // cleanup in return
    }

    // Heirloom orchestrated reveal
    root.classList.add('is-loaded');

    // Intersection for drawn rules and duotone develop
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-inview', 'is-developed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    const rules = document.querySelectorAll('.rule-draw, .develop');
    rules.forEach((el) => observer.observe(el));

    // Phase 7 Monitoring: Basic RUM for CWV (LCP/INP/CLS) per PERF_AUDIT.md rec + MONITORING.md.
    // Native PerformanceObserver (no new deps; reuse @sentry/nextjs already in package + error/csp patterns; graceful degrade).
    // Reports to console in dev; Sentry.captureMessage (guarded by try; inits are dsn-conditional in sentry.client.config.ts so safe no-op if unset).
    // Simple, one-time buffered observers; reuses SiteClient client lifecycle (theme/PWA/observer pattern).
    // Tags with vital + page path for Sentry dashboards/alerts (e.g. LCP>2500ms, high INP).
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const reportVital = (name: 'LCP' | 'CLS' | 'INP', value: number, details?: Record<string, unknown>) => {
        const isCLS = name === 'CLS';
        const display = isCLS ? value.toFixed(3) : Math.round(value);
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[RUM] ${name}: ${display}`, details || {});
        }
        try {
          // Graceful: capture even if Sentry not fully configured (dsn-less is no-op per sentry.*.config + env audit).
          Sentry.captureMessage(`Web Vital: ${name}`, {
            level: 'info',
            tags: {
              vital: name,
              page: window.location?.pathname || 'unknown',
              source: 'rum-siteclient',
            },
            extra: {
              value: display,
              rawValue: value,
              ...details,
              url: window.location?.href,
              ts: Date.now(),
            },
          });
        } catch {
          // Degrade silently (no Sentry DSN or runtime block).
        }
      };

      // LCP (Largest Contentful Paint) — primary perf metric from audit (hero driven).
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
          if (lastEntry && typeof lastEntry.startTime === 'number') {
            reportVital('LCP', lastEntry.startTime, { entryType: lastEntry.entryType });
          }
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch {
        // Browser may not support; degrade.
      }

      // CLS (Cumulative Layout Shift) — already excellent (0) per PERF_AUDIT but monitor field.
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput?: boolean }>) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value || 0;
              reportVital('CLS', clsValue, { hadRecentInput: entry.hadRecentInput });
            }
          }
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch {
        // Degrade.
      }

      // INP (Interaction to Next Paint) approx via 'event' entries (modern; durationThreshold for long tasks).
      // Real INP aggregates max recent interactions; this surfaces actionable long events to Sentry/console.
      // (Full polyfill would require dep; native here is sufficient per "basic" + no-new-deps.)
      try {
        const inpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as Array<PerformanceEntry & { duration?: number; interactionId?: number; name?: string }>) {
            const dur = typeof entry.duration === 'number' ? entry.duration : 0;
            if (dur > 0) {
              reportVital('INP', dur, {
                interactionId: entry.interactionId,
                eventName: entry.name,
                entryType: entry.entryType,
              });
            }
          }
        });
        // durationThreshold 16ms to catch interactive perf (INP target <200ms good).
        // Cast to satisfy TS (PerformanceObserverInit in current lib.dom may not list it; runtime supported in Chromium+ for event timing/INP).
        inpObserver.observe({ type: 'event', buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
      } catch {
        // Older browsers or no support; degrade (FID proxy could be added but INP focus).
      }
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    const root = document.documentElement;
    root.setAttribute('data-theme', next);
    localStorage.setItem('colony:theme', next);
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-toggle btn btn--outline btn--sm"
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      title={theme === 'dark' ? 'Light mode (paper)' : 'Dark mode (ink)'}
    >
      {theme === 'dark' ? '☼ LIGHT' : '◉ DARK'}
    </button>
  );
}
