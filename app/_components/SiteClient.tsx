'use client';

import { useEffect } from 'react';
import * as Sentry from "@sentry/nextjs";
import { useTheme } from './useTheme';

/**
 * SiteClient (PWA bootstrap + Heirloom page reveals + Phase 4 theme toggle)
 * - Registers SW for offline shell + clips metadata cache (Phase 3)
 * - Orchestrated load reveal for masthead/folio/hero (stagger, reduced-motion safe)
 * - IntersectionObserver for .rule-draw and .develop elements
 * - Theme toggle (desktop only): driven by useTheme hook. Pure CSS vars swap. A11y: aria, labels.
 * - Phase 7: RUM CWV observers (LCP/INP/CLS via native PerformanceObserver) reporting to console + Sentry (see useEffect). Term "web-vitals" refers to the metrics (Core Web Vitals).
 */
export default function SiteClient() {
  const { resolved, setPref } = useTheme();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

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
      // Buffer the latest values and flush ONE Sentry event when the page is hidden.
      // Reporting per-entry (esp. INP 'event' + CLS 'layout-shift') floods Sentry on
      // mobile (quota/cost) and adds main-thread work to the metric we're measuring.
      const vitals: { LCP?: number; CLS?: number; INP?: number } = {};
      const reportVital = (name: 'LCP' | 'CLS' | 'INP', value: number, _details?: Record<string, unknown>) => {
        if (name === 'INP') vitals.INP = Math.max(vitals.INP ?? 0, value); // worst interaction wins
        else vitals[name] = value; // LCP = latest candidate, CLS = cumulative-so-far
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[RUM] ${name}: ${name === 'CLS' ? value.toFixed(3) : Math.round(value)}`);
        }
      };

      let flushed = false;
      const flushVitals = () => {
        if (flushed || (vitals.LCP == null && vitals.CLS == null && vitals.INP == null)) return;
        flushed = true;
        try {
          // Graceful: no-op when Sentry DSN unset (per sentry.*.config guards).
          Sentry.captureMessage('Web Vitals', {
            level: 'info',
            tags: { page: window.location?.pathname || 'unknown', source: 'rum-siteclient' },
            extra: {
              LCP: vitals.LCP != null ? Math.round(vitals.LCP) : undefined,
              CLS: vitals.CLS != null ? Number(vitals.CLS.toFixed(3)) : undefined,
              INP: vitals.INP != null ? Math.round(vitals.INP) : undefined,
              url: window.location?.href,
              ts: Date.now(),
            },
          });
        } catch {
          // Degrade silently (no Sentry DSN or runtime block).
        }
      };
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flushVitals();
      });
      window.addEventListener('pagehide', flushVitals);

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

  return (
    <button
      type="button"
      onClick={() => setPref(resolved === 'dark' ? 'light' : 'dark')}
      className="theme-toggle btn btn--outline btn--sm"
      aria-label={resolved === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      title={resolved === 'dark' ? 'Light mode (paper)' : 'Dark mode (ink)'}
    >
      {resolved === 'dark' ? '☼ LIGHT' : '◉ DARK'}
    </button>
  );
}
