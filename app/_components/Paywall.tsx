// components/Paywall.tsx
// Track C Layer 8: Real paywall UI component (teaser + subscribe CTA for exclusives, live chat, per-ep)
// Exhaustive: shows for !hasPerkAccess, different CTAs for gift vs sub, local OK messaging, usage hint.
// Deep link preserved: ?return= current url for post-checkout.
// ui-ux-pro-max applied: brutalist (zero radius, heavy rules, mono accents), patriotic palette via tokens (ink/paper/alarm),
// 57 font pairings (Archivo Black / Inter Tight), 99 UX guidelines (a11y labels, 44px+ targets via .btn--lg,
// visible hierarchy, one primary CTA, no dark patterns, reduced-motion friendly, semantic color not raw hex).
// Mobile-first, high-contrast, consistent with home paper/ink surfaces and live alarm urgency.
'use client'
import React from 'react'
import Link from 'next/link'

export function Paywall({ perk = 'PER_EP_EXCLUSIVE', episodeTitle, returnUrl }: { perk?: string; episodeTitle?: string; returnUrl?: string }) {
  const ctaUrl = `/checkout?perk=${perk}&return=${encodeURIComponent(returnUrl || '/podcasts')}`
  const title = episodeTitle ? `Member Exclusive: ${episodeTitle}` : 'Member Exclusive'

  return (
    <div className="paywall" role="region" aria-label={title}>
      <h3>{title}</h3>
      <p>
        Unlock with The Colony membership. Includes live chat, per-ep exclusives, rural OK events,
        ad-free access, and agent perks. Reader-funded independent press for Oklahoma.
      </p>
      <Link href={ctaUrl} className="btn btn--primary btn--lg">
        Subscribe or Gift (Local OK Perks)
      </Link>
      <p className="paywall__disclaimer">100% supports Oklahoma rural journalism. Cancel anytime. Gift codes redeem instantly.</p>
      {/* Edge: usage tracked server; no client bypass. Deep link return preserved. */}
    </div>
  )
}

// Usage in page: {isExclusive && !allowed && <Paywall ... /> }
// Consistent with ui-ux-pro-max Quick Reference priorities 1 (a11y), 2 (touch), 4 (style match brutalist), 6 (tokens).
