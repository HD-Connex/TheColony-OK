# docs/MOBILE_TWA_PWA_STRATEGY.md

**Phase 7 D+15+ TWA/Mobile/PWA Strategy - Layer 4/15+ (Native Parity + Rural Offline)**

**For rural OK users (low-connectivity areas):** PWA + TWA + agent offline packs > basic app offline (DW) or mobile (Blaze).

## PWA
- manifest.json (name: The Colony OK, short_name: ColonyOK, icons crisp 1:1 hosts + logo navy/cream/red, start_url, display: standalone, theme_color: #002868 navy, background: #F5F0E6 cream).
- Service worker: cache pods/clips/live archives + offline synth briefs; background sync for clip uploads.
- Install prompt on hub; add to home.

## TWA (Trusted Web Activity)
- Android Play Store app using TWA (custom tabs, no browser UI, verified domain assetlinks.json).
- Parity with web hub: live queue, clips player, comments, personal agent, vs-blaze.
- Splash with crisp host image; deep links.
- Future: iOS PWA + full native if volume.

## Agentic + Rural
- Smart offline packs: personal Colony Agent pre-downloads rural-relevant (based on county/beat subs) for travel/farm work. Low-bandwidth mode.
- Clip capture mobile-first (camera in TWA/PWA).
- Verified in CI via Lighthouse mobile + web_fetch responsive.

**MCP:** 1. manifest + sw.js. 2. assetlinks + TWA config (bubblewrap or similar). 3. Offline pack logic + agent. 4. Best-of-n mobile UI variants (tested 375 viewport). 5. CI mobile perf gate + browser proxy verify. 6. Store listings emphasizing OK rural + agentic.

**Competitive:** Matches/exceeds DW offline + Blaze mobile with local/agent/rural optimization + full feature parity (comments/clips vs siloed).

**Impl Stub:** public/manifest.json (create next); next.config.js PWA plugin; app/the-colony-vs-blaze etc mobile responsive + schema.

---
**MOBILE TWA/PWA STRATEGY COMPLETE - D+15+ TRACK.**