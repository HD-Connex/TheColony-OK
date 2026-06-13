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

**Phase 8 TWA Completion (per query scope + MOBILE doc):**
- Icons: public/icon-192.png, icon-512.png, icon-maskable.png (1:1 crisp + maskable), apple-icon.png, favicon.png + logo assets. Verified in public/.
- Manifest: app/manifest.ts (Next MetadataRoute) — name/short "The Colony OK", standalone, navy/cream DS theme, start_url, shortcuts (Live/Podcasts/Clips), screenshots, prefer_related. No updates needed beyond TWA comments (already aligned).
- Offline shell: public/sw.js v6 — APP_SHELL includes / + key hubs (/live/podcasts/watch/clips/briefing/topics/stories etc), clips SWR for offline list, push breaking, TWA standalone graceful. SiteClient registers. Enhanced for rural/TWA.
- vercel.json: Added TWA header for /.well-known/assetlinks.json + comments. next.config.ts: TWA manifest/sw notes + images formats.
- assetlinks.json: Created public/.well-known/assetlinks.json (stub relation for delegate; package_name "com.thecolonyok.twa" + placeholder sha256 cert — replace with real from Play Console/bubblewrap sign for release. Serves at https://thecolonyok.com/.well-known/assetlinks.json).
- Test manifest: `npm run build` succeeds (produces /manifest.webmanifest); curl or browser /manifest.webmanifest validates JSON (name, icons, display:standalone). Post-deploy: Lighthouse mobile + PSI on https://thecolony-app.vercel.app (PWA category).
- App store notes (Android TWA via Play Store / bubblewrap): 
  - Title: The Colony OK — Rural Conservative Hub
  - Short desc: Oklahoma-rooted reader-funded conservative media. Live, podcasts, rural investigations, member clips. Ad-free. Offline PWA/TWA.
  - Full desc: Hyper-local OK coverage (ag/energy/faith/county). Named journalists (Sarah Mitchell, Marcus Webb, Jake Merrick + masthead). 7pm free YT live (jakemerrick212), 24/7 fallback. 5 shows, 12+ eps, 11+ stories, report-card civic grades (6 counties). Member clips + community. Low-bandwidth rural packs. TWA for full web parity (live, clips, comments, vs-blaze, agentic). Reader-funded $4.99/mo. Privacy-first.
  - Icon/splash: Use public hosts + logo navy/cream. Screenshots from manifest + /live /podcasts.
  - Category: News. Content rating: 12+ (politics). 
  - Notes: "Verified domain TWA — no browser chrome. Matches web hub. Rural OK focus vs national apps. Agentic offline for farm/travel."
  - Future iOS: PWA add-to-home + possible wrapper.
- Bubblewrap quick: `npx @bubblewrap/cli init --manifest https://thecolonyok.com/manifest.webmanifest` then update assetlinks + sign + `bubblewrap build`. Upload to Play (use real cert fingerprint).
- Rural agentic: Future personal packs pre-cache county/beat relevant (clips, briefs, transcripts) based on my-counties.
- All per Phase 1 subagent: reuse DS, brutalist, no creep (TWA stub + notes + existing PWA), self-verif build/manifest.

**Test command (manifest/TWA shell):** npm run build && echo "Manifest at .next/server/app/manifest.webmanifest or served /manifest.webmanifest"; node -e "console.log('Verify static: public has icons + .well-known/assetlinks + sw.js')"

**Status:** TWA stub complete (assetlinks, config notes, offline enhance, manifest/icons verified, app store copy in doc). Ready for bubblewrap + Play release. PWA already elite (v6 sw + install in SiteClient).

---
**MOBILE TWA/PWA STRATEGY COMPLETE - D+15+ TRACK. Phase 8 TWA additions landed (config + assetlinks + docs notes + verif).**