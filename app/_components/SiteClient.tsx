'use client';

import { useEffect } from 'react';

/**
 * SiteClient (PWA bootstrap + Heirloom page reveals)
 * - Registers SW for offline shell + clips metadata cache (Phase 3)
 * - Orchestrated load reveal for masthead/folio/hero (stagger, reduced-motion safe)
 * - IntersectionObserver for .rule-draw and .develop elements
 */
export default function SiteClient() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

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
    const root = document.documentElement;
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

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}
