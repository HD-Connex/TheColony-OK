... (existing content preserved; appended test checklist below)

## Comprehensive Test Checklist (swarmed for deploy-ready root)

**Pre-reqs for local or preview:**
- Clone: `git clone -b latest-for-testing https://github.com/hizzy-made-it/thecolony-app.git thecolony-app && cd thecolony-app` (thecolony-app production only; thecolony-ok GH archived after porting missing strategy docs + enhancements; legacy _archived_TheColony kept as design reference).
- `npm install`
- Supabase: link project, apply supabase/migrations/0003_episode_data_refinements.sql and 0004_realtime_chat_polls.sql (and prior if needed). Run supabase/seed-content.sql (or seed.sql) for test video ep e.g. show 'colony-report' + ep slug 'real-video-ep' or id with video_url/mux_playback_id + chapters JSONB.
- Add 4 host jpgs to public/assets/images/hosts/ (jake-merrick.jpg, marcus-webb.jpg, rachel-torres.jpg, dan-hollis.jpg or per code mapping in [slug]page + README in hosts/). Use from C: session backup or generate matching OK aesthetic.
- .env.local with NEXT_PUBLIC_SUPABASE_URL/ANON_KEY , SUPABASE_SERVICE_ROLE_KEY (for admin), and any stripe/resend if testing gated.
- `npm run dev` (or Vercel preview deploy of branch)

**1. Per-Ep Video Player (Spotify parity: toggle/viz/PiP/chapters/reduced) on /podcasts/[slug]/[ep]**
- Visit e.g. /podcasts/colony-report/real-video-ep (after seed)
- Toggle Video/Audio modes: video stage uses VideoPlayer or embed; audio uses AudioPlayer + real WebAudio canvas viz (bars animate to freq only in audio+hasVideo).
- Chapters: list in player clickable, seeks active source (audio or video) via shared cmd; keyboard arrows work in player.
- PiP: button in VideoPlayer (native or custom); Media Session for lockscreen/background.
- Reduced motion: OS setting disables framer AnimatePresence transitions and viz init.
- Edges: loading, error, reconnect, gated preview for non-member (5min cap).
- Mobile: responsive, touch seek, 375px test no overflow.
- Per-ep rich: metadata, host rail with image (spotlight), JsonLd VideoObject, prev/next, share.

**2. 24/7 Live + Framer Queue + Realtime on /live and home live block**
- No active event: shows 24/7 fallback (from lib/live-247 stub schedule wheel, HLS or slate).
- Framer: queue buttons stagger on load, pulse on active, layout anim, whileInView if present; respects prefers-reduced-motion (no variants).
- Viewer count 'realtime' (sim interval + can wire presence).
- Realtime chat: LiveChat subscribes postgres_changes, optimistic send (member only), scroll, dedupe, a11y.
- Polls: LivePoll (optimistic votes, realtime tally; member gate).
- VideoPlayer for live: latency display, GO LIVE edge, quality, reconnect.
- Mobile: full screen friendly, chat scroll.

**3. Images in spotlight / rails**
- Host images load in podcast show page rail and per-ep contributor rail (no 404 after place jpgs).
- ContributorCard etc use mapped /assets/images/hosts/* .

**4. Other**
- No console errors on feature pages.
- Build: `npm run build` succeeds (stubs allow; real data from Supabase).
- Vercel preview: deploy branch, test same flows on prod-like (env vars set in Vercel for Supabase).

**Seed example (run in Supabase SQL):** see supabase/seed-content.sql for 'real-video-ep' with chapters + video fields.

Ready for user testing of all implemented (framer, video/audio + viz + PiP + chapters, 24/7 + realtime chat/polls, per-ep, images). Merge to main after sign-off for prod deploy.

(Full original TESTING_DEPLOY content above this append for one-frontend/one-backend instructions.)
