'use client';

import React from 'react';
import Link from 'next/link';
import MotionReveal from './motion/MotionReveal';
import MotionStagger from './motion/MotionStagger';

/**
 * SectionRail — standardized reusable horizontal scroller rail.
 * Phase 4 UX: now wraps header with MotionReveal + scroller content with MotionStagger
 * for consistent motion on new rails (home, /watch, ContinueRail, /topics etc).
 * Reduced-motion safe via the motion primitives. Brutalist pure CSS + framer.
 * Reused by ContinueRail, watch hub, homepage rails.
 */
interface SectionRailProps {
  title: string;
  dateline?: string;
  linkHref?: string;
  linkLabel?: string;
  children: React.ReactNode;
}

export default function SectionRail({ title, dateline, linkHref, linkLabel, children }: SectionRailProps) {
  return (
    <MotionReveal>
      <section className="section-rail" aria-label={title}>
        <header className="section-rail__header">
          <MotionReveal delay={0.03}>
            <div>
              <h2 className="section-rail__title">{title}</h2>
              {dateline && <span className="section-rail__dateline">{dateline}</span>}
            </div>
          </MotionReveal>
          {linkHref && (
            <Link href={linkHref} className="section-rail__link">{linkLabel || 'See all →'}</Link>
          )}
        </header>
        <MotionStagger className="section-rail__scroller" /* stagger children for reveal polish */>
          <div tabIndex={0} role="region" aria-label={`${title} rail`}>
            {children}
          </div>
        </MotionStagger>
      </section>
    </MotionReveal>
  );
}
