# Mobile Release Runbook — The Colony OK

One-page checklist to run before every release. Goal: the video/live player and
core routes work on real phones, every time. Pairs with `docs/MOBILE_AUDIT.md`
(findings) and `docs/MOBILE_TWA_PWA_STRATEGY.md` (PWA/TWA strategy).

## 0. Pre-flight (automated — must be green)
- [ ] `npx tsc --noEmit --skipLibCheck` → 0 errors
- [ ] `npm run lint` → 0 errors
- [ ] `npm run build` → succeeds (no `ignoreBuildErrors`; a red build cannot deploy)
- [ ] `npm run build && npm run e2e` → Playwright passes, incl. `tests/e2e/mobile.spec.ts`
      on the `iphone-13` and `pixel-7` projects (`npx playwright install --with-deps` first in CI)

## 1. Physical device smoke (iOS Safari + Chrome Android)
Test on `https://thecolony-app.vercel.app` (the working host; `thecolonyok.com` is a
separate DNS/domain issue). Use at least one iPhone (Safari) and one Android (Chrome);
a mid-range Android is best for the performance pass.

**Video / live player (the priority):**
- [ ] `/live` 24/7 stream plays **inline** — no forced fullscreen on iOS (regression guard for `playsinline=1`)
- [ ] Native replay/episode video: controls (`.live-chrome`) sit inside the 16/9 box, buttons are tappable (≥44px), seek/quality/reconnect work
- [ ] Tap fullscreen → rotate → exit: returns cleanly, no frozen frame
- [ ] Lock screen / background the tab ~30s → return: live **resumes at the live edge** (Page Visibility)
- [ ] Throttle to 3G (DevTools): player shows loading/recovers; quality caps to player size (no 1080p on a phone)
- [ ] Kill network mid-stream → "stream error / reconnect" UI appears and the reconnect button works
- [ ] Android: HLS replay plays (hls.js is bundled/served from our origin — works offline-cached, no jsDelivr)

**Navigation & layout:**
- [ ] Every bottom-tab route loads (Home / Watch / Listen / Read / Account)
- [ ] No horizontal scroll on a 360–375px screen on `/`, `/live`, `/watch`, `/podcasts`, `/news`, `/membership`
- [ ] Content clears the notch / home indicator (safe-area insets) — header top + bottom tabs + mini-player
- [ ] Hamburger menu opens/closes; links are tappable; no double-tap zoom on controls
- [ ] Mini-player: scrubber is grabbable; play/close work; rides above the tab bar

**Forms / keyboard (if testing chat/auth):**
- [ ] Virtual keyboard doesn't cover the focused input; layout doesn't jump

## 2. PWA / install
- [ ] `/manifest.webmanifest` serves (200); `display:standalone`, `orientation:any`, `id` present, icons load
- [ ] Service worker registers (`/sw.js`); offline → app shell still renders an offline-friendly screen
- [ ] "Add to Home Screen" installs; standalone launch shows correct icon/splash; landscape works for video

## 3. Performance (mobile profile)
- [ ] Lighthouse (mobile) on `/` and `/live`: LCP < 2.5s, INP < 200ms, CLS < 0.1 (investigate if LCP > 4s / INP > 300ms)
- [ ] After release, check Vercel Analytics RUM filtered to mobile for LCP/INP/CLS regressions
- [ ] Check Sentry filtered by `os.name:iOS` / `os.name:Android` for new mobile-only errors;
      confirm the single per-session "Web Vitals" event arrives (not a per-interaction flood)

## 4. Rollback
- [ ] If a mobile playback regression ships: revert the offending commit and redeploy, or
      promote the previous Vercel deployment. The 24/7 fallback (Jake Merrick YouTube) should
      keep `/live` watchable even if the native player path breaks.

---
**Owner:** _<assign>_  ·  **Last reviewed:** 2026-06-25
