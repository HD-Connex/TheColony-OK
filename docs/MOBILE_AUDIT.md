# Mobile Audit Report — The Colony OK

**Date:** 2026-06-25
**Scope:** Static, code-grounded audit of mobile behaviour across routes and components, with priority on the video / live player. Every finding cites a real file:line.
**Stack:** Next.js 16.2.6 (App Router), React 19, Supabase, Mux (server SDK only), custom `hls.js`-from-CDN player + YouTube/Rumble embeds. PWA via `app/manifest.ts` + `public/sw.js`.

> This report covers what is verifiable from source. Phase-1 manual QA on real devices, Lighthouse mobile runs, and Sentry/Vercel-Analytics mobile filtering still require a physical device + credentials and are listed under **Not Verified** at the end.

---

## Severity summary

| # | Severity | Finding | File |
|---|----------|---------|------|
| 1 | **Blocker** | YouTube embeds omit `playsinline=1` → iOS force-fullscreens the 24/7 live stream on play | `lib/video.ts` |
| 2 | **Critical** | Custom player chrome (`.live-chrome`, `.live-player--custom`, `.live-player video`) has **no CSS** → controls spill out of the 16/9 box on every native HLS/MP4 playback (Mux live, replays, episode video) | `app/_components/VideoPlayer.tsx` + `app/styles/components/live.css` |
| 3 | Major | `/live` double-wraps the stage in a second `.live-player` aspect box → nested 16/9 + overflow on mobile | `app/live/page.tsx:93` |
| 4 | Major | RUM observers fire `Sentry.captureMessage` on **every** INP event + layout-shift → mobile Sentry flood (quota/cost) + main-thread cost | `app/_components/SiteClient.tsx:104-140` |
| 5 | Major | `hls.js` `lowLatencyMode:true` on **all** streams incl. VOD; no mobile buffer/start-level tuning → rebuffering on cellular | `app/_components/VideoPlayer.tsx:197` |
| 6 | Major | `hls.js` loaded from external CDN at runtime → Android HLS fails offline (PWA) / if CDN blocked | `app/_components/VideoPlayer.tsx:9` |
| 7 | Major | No Page Visibility handling → live keeps buffering/playing in background (battery) | `app/_components/VideoPlayer.tsx` |
| 8 | Major | No global `overflow-x` guard; absolute reel overlays + wide grids risk horizontal scroll at 360–375px | `app/styles/*` |
| 9 | Minor | Manifest locks `orientation: portrait` → blocks landscape video in standalone; missing `id`, no `narrow` screenshot | `app/manifest.ts` |
| 10 | Minor | Primary above-the-fold live iframe uses `loading="lazy"` → delays main content | `app/_components/VideoEmbed.tsx:26` |
| 11 | Minor | Touch ergonomics: 3px range scrubbers, 14px control SVGs (hit area once styled), no tap-highlight reset | `app-shell.css:175`, `VideoPlayer.tsx` |

---

## Detailed findings

### 1. BLOCKER — YouTube embeds omit `playsinline` (iOS force-fullscreen on the live path)
The 24/7 channel resolves to a YouTube embed (`LiveStage` → `isEmbed` → `VideoEmbed` → `toEmbedSrc`). Every YouTube branch builds params as `autoplay/mute/rel/modestbranding` **without `playsinline`**:

- `youtubeLiveEmbed()` — `lib/video.ts:25-32`
- watch-id branch — `lib/video.ts:65`
- embed-id branch — `lib/video.ts:71`
- `/streams` + `@handle` branch — `lib/video.ts:82`

On iPhone Safari, a YouTube iframe without `playsinline=1` jumps to native fullscreen the moment playback starts — exactly the "forced fullscreen" symptom in the brief. This is the single highest-impact mobile bug because it hits the default 24/7 stream.

**Repro:** iPhone (any iOS), Safari → `/live` → stream auto-plays → tap → fullscreen takeover.

**Patch** (`lib/video.ts`): add `playsinline: "1"` to each params object, including the live-stream helper.
```ts
const params = new URLSearchParams({
  autoplay: "1", mute: "1", rel: "0", modestbranding: "1", playsinline: "1",
});
```
And in `youtubeLiveEmbed()`:
```ts
const params = new URLSearchParams({
  channel: channelId, autoplay: "1", mute: "1", rel: "0",
  modestbranding: "1", playsinline: "1",
});
```
**Verify:** iPhone Safari `/live` → playback stays inline in the 16/9 box.

---

### 2. CRITICAL — Custom player chrome is unstyled
`VideoPlayer.tsx` renders a full custom control layer:
- root `div.live-player.live-player--custom` (`:312`)
- `<video>` with **no fill rule** (`:313`)
- `button.live-player__center-play` (`:324`)
- `div.live-player__offline.live-player__error` (`:338`)
- `div.live-chrome` with `.live-chrome__btn / __play / __seek / __time / __live / __latency / __go / __quality / __reconnect` (`:346-403`)

A grep of `app/styles/**` finds **none** of these selectors, and there is no `.live-player video {}` rule. `.live-player` is `position:relative; aspect-ratio:16/9` (`live.css:9-14`) and only styles a child `iframe` (`live.css:16-22`). So for the native player:
- the `<video>` only gets `display:block; max-width:100%` from `reset.css:25` (no `position:absolute; inset:0; width/height:100%`), so it sizes to intrinsic/poster dimensions, not the box;
- `.live-chrome` and `.live-player__center-play` fall into **normal flow below the video**, overflowing the aspect-ratio box and pushing into following content.

This path is live wherever a source is `.m3u8`/`.mp4`: Mux live events, replays, and **podcast/show episode video** (`EpisodePlayer.tsx:312`). It "looks fine" today only because the 24/7 default goes through the YouTube *iframe* path, which is styled.

**Repro:** Any device → play a non-YouTube replay or an episode with video → controls render as a stray row beneath a mis-sized video.

**Fix:** add a `live-player--custom` block to `live.css` — `video` absolute-fills the box; chrome is an absolutely-positioned bottom bar; center-play centered; error overlay `inset:0`; all `.live-chrome__btn` ≥44×44px with `touch-action:manipulation`. (Patch ready on request.)

---

### 3. MAJOR — `/live` double-wraps the stage in a `.live-player` aspect box
`app/live/page.tsx:93` puts `<LiveStageMount>` inside `<div className="live-player">`, but `LiveStage` already renders `div.live-stage` → `div.live-player` internally (`LiveStage.tsx:208`). Result: an outer `aspect-ratio:16/9` box (`live.css:9`) containing the entire stage (header, player, queue, interactivity), which overflows badly — the source of the recurring "text leaking outside the player container" the code comments fight (`LiveStage.tsx:41-44`). On mobile (`live.css:316-319` collapses to one column) the outer box clamps height and the rest spills.

**Fix:** the page wrapper should be a plain container (e.g. `div.live-stage-host`), not `.live-player`; reserve `.live-player`'s aspect box for the actual video element only.

---

### 4. MAJOR — RUM observers spam Sentry per-event on mobile
`SiteClient.tsx` reports to `Sentry.captureMessage` **inside the observer loop**:
- INP: every `event` entry with `duration>0` at `durationThreshold:16` (`:122-140`)
- CLS: every `layout-shift` entry, cumulatively (`:104-117`)

On a touch device this is dozens–hundreds of `captureMessage` calls per session: Sentry quota/cost blowout plus main-thread work on the exact metric you're trying to protect. INP/CLS should be aggregated and sent **once** on `visibilitychange→hidden`/`pagehide` (max INP, final CLS), not per entry.

**Fix:** buffer `clsValue` and the max interaction duration; flush a single message on `pagehide`. (Or adopt `web-vitals` `onINP/onCLS/onLCP`, which already debounce correctly — note `web-vitals` was previously removed, so the native-buffer approach keeps deps flat.)

---

### 5. MAJOR — `hls.js` config not tuned for mobile
`new w.Hls({ enableWorker: true, lowLatencyMode: true })` (`VideoPlayer.tsx:197`) applies `lowLatencyMode` to **every** stream, including VOD replays where it's pointless and increases stalls on cellular. There's no `maxBufferLength`, `maxMaxBufferLength`, or conservative `startLevel` for mobile.

**Fix:** gate `lowLatencyMode` on `isLive`; set mobile-friendly buffer caps and a capped `startLevel`/`capLevelToPlayerSize:true` so cellular doesn't open on the top rendition.

---

### 6. MAJOR — `hls.js` is a runtime CDN dependency
`HLS_CDN = "https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js"` (`VideoPlayer.tsx:9`) is injected at runtime. On Android (no native HLS), Mux replays/live won't play if the device is offline (PWA shell), on a captive/filtered network, or if jsDelivr is slow. It's allowlisted in CSP (`next.config.ts:22`) but that doesn't help availability.

**Fix:** add `hls.js` as a real dependency and `import()` it dynamically (still code-split, but served from your own origin and cacheable by the service worker for offline replay).

---

### 7. MAJOR — No Page Visibility handling for live playback
The native player has no `visibilitychange` listener; the brief explicitly calls for pause/resume on background. Live HLS keeps fetching segments when the tab/app is backgrounded — battery and data drain on mobile.

**Fix:** on `document.hidden`, pause non-PiP live playback (or at least stop fetching); on return, snap back to live edge via the existing `goLiveEdge()` (`VideoPlayer.tsx:265`).

---

### 8. MAJOR — No global horizontal-overflow guard
No `overflow-x:hidden` on `html`/`body` anywhere in `app/styles/**`. Combined with absolutely-positioned reel overlays (`live.css:322-376`) and several `grid-3`/`grid-4` rails, there's real risk of a 1–2px horizontal scroll on 360–375px screens. Needs a device check to confirm offenders, but no guard exists today.

**Fix:** add `overflow-x:hidden` to the body/app wrapper and audit fixed-width children with `max-width:100%`.

---

### 9. MINOR — PWA manifest
`app/manifest.ts`: `orientation:"portrait"` (`:13`) locks orientation — for a video product this prevents landscape viewing in standalone. Also missing `id` (recommended for install identity) and a `narrow` `form_factor` screenshot (Android's richer install UI uses it; only a `wide` one exists, `:35-43`).

**Fix:** drop the orientation lock (or set `"any"`); add `id:"/"`; add a portrait screenshot.

---

### 10. MINOR — Primary live iframe is lazy-loaded
`VideoEmbed.tsx:26` sets `loading="lazy"` on the iframe. For the primary, above-the-fold `/live` stage that delays the most important element. Keep lazy for embeds far down a page, but the primary stage should load eagerly.

---

### 11. MINOR — Touch ergonomics
- Mini-player scrubber is `height:3px` (`app-shell.css:175`) — hard to grab; needs a larger thumb / padded hit area.
- Custom-player control SVGs are 14px (`VideoPlayer.tsx:355`); once finding #2 is styled, ensure the buttons are ≥44×44px.
- No `-webkit-tap-highlight-color` reset → grey tap flash on the brutalist surfaces (cosmetic).

---

## Already correct (do not redo)

- **Viewport**: `width=device-width, initial-scale=1, viewport-fit=cover`, themeColor light/dark — `layout.tsx:56-64`.
- **Inline playback**: native `<video playsInline preload="metadata">` present — `VideoPlayer.tsx:313-318`.
- **Safe-area insets**: header `nav.css:12`, bottom tabs `app-shell.css:46`, mini-player `app-shell.css:94,100`, body padding reserve `app-shell.css:15-29`.
- **PWA**: `manifest.ts`, `public/sw.js` v6 (app-shell + SWR + clip cache), icons 192/512/maskable/apple, SW registration `SiteClient.tsx:24-37`.
- **Tap targets**: `.btn` `min 44×44` (`buttons.css:87-88`); mobile nav `48px` (`main.css:761`).
- **Images**: `next/image` AVIF/WebP + remotePatterns — `next.config.ts:40-51`.
- **Fonts**: `next/font` (no external request) + `display:swap` — `layout.tsx:22-50`.
- **Autoplay policy**: muted-first on YT embeds (`autoplay=1 mute=1`) — `lib/video.ts`.
- **Error recovery**: reconnect UI on native player — `VideoPlayer.tsx:336-343,401-403`.
- **Reduced motion**: `useReducedMotion()` gates LiveStage animations — `LiveStage.tsx:66`.

---

## Not verified (needs device / credentials)

- Phase-1 manual QA: iOS Safari (latest), Chrome Android, a mid-range device — navigation, gestures, keyboard/forms, rotation, lock/resume, 3G/offline recovery.
- Lighthouse mobile (LCP/INP/CLS) per route; bundle analysis (`framer-motion@12` is still bundled and is the heaviest mobile chunk candidate).
- Sentry mobile filter (`os.name:iOS|Android`) and Vercel Analytics RUM mobile view.
- `thecolonyok.com` is reportedly broken — a DNS/domain issue separate from app code; `thecolony-app.vercel.app` is the working host for device QA.

---

## Recommended order of work

1. **#1 playsinline** (one-line-per-branch, unblocks iOS live) — ship immediately.
2. **#2 player chrome CSS** (restores native player on episodes/replays/Mux live).
3. **#4 RUM aggregation** (stops cost/perf bleed) + **#5 hls.js mobile tuning**.
4. **#6 bundle hls.js**, **#7 Page Visibility**, **#3 /live nesting**, **#8 overflow guard**.
5. Minors (#9–#11) as polish.
6. Then device QA + Playwright mobile-profile E2E asserting a `playing` event ≤5s on `/live`.
