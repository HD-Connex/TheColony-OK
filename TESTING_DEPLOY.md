# Latest for Testing - Media & Live Perfection (Root Project Consolidated)

**Branch:** latest-for-testing (the deploy target for the current changes)
**One repo:** hizzy-made-it/thecolony-app (GitHub only -- thecolony-app, no other thecolony or -ok)
**One frontend deploy:** Vercel (preview from this branch; prod from main)
**One backend deploy:** Supabase (apply supabase/migrations/ from this repo)

## Root Project Note (gathered from D: / C: / GitHub)

All thecolony / thecolony-app files from d:\ (inaccessible due to drive malfunction), c:\ (active session proxy with proposed-changes as the implemented source), and GitHub have been audited and combined into this single thecolony-app root on GitHub.

- Non-powering thecolony stuff (old TheColony session, old subs under thecolony-app, unrelated projects like floguard/medrev) identified for removal from C: (see commands in DRIVE_MALFUNCTION_NOTE.md or run the prune PowerShell locally).
- The latest implemented changes (framer motion for reduced motion + animations in EpisodePlayer and LiveStage, the 4 crisp personality images for spotlight, video player with Spotify-style toggle + real WebAudio viz + PiP + chapters, LiveStage with 24/7 fallback + realtime chat/polls, per-ep pages, transcripts, live-247, 0003/0004 migrations for video/realtime data) are now in the root structure:
  - app/_components/ (the perfected player, live stage, chat, poll)
  - app/podcasts/[slug]/[ep]/ (per-ep with player + rail + JsonLd)
  - lib/ (transcripts, live-247)
  - supabase/migrations/ (video fields + realtime tables)
  - public/assets/images/hosts/ (mapping for the images from C: session)

When your D: drive is restored, clone this repo to D:\1Projects\thecolony-app to have the combined root project there.

## What to test (the latest version)

### 1. Podcast Player - Video like Spotify
- Per-ep page: /podcasts/[slug]/[ep] (use the seeded "real-video-ep" or any with video_url/mux_playback_id)
- Toggle between Audio and Video modes.
- Real Web Audio visualizer (canvas bars) in audio mode only.
- Chapters: clickable list + keyboard (left/right arrows) that seek the player.
- PiP button (for video) + Media Session (lock screen / background controls).
- Reduced motion respected (no viz or framer if OS prefers-reduced).
- Edges: loading, error states, retry.

### 2. Live Stage + 24/7
- Live section should show persistent 24/7 fallback when no active event.
- 24/7 channel with scheduled wheel (OKC/rural focus).
- Framer animated queue (stagger, pulse on active).
- Realtime viewer count simulation.

### 3. Realtime Interactivity (Layer 3)
- LiveChat: real-time messages via Supabase postgres_changes, optimistic UI, member-only write.
- LivePoll: vote with optimistic tally, realtime updates on votes.
- Both respect isMember from auth/entitlements.

### 4. Per-Ep Pages & Data + Images
- Dedicated rich page with player, chapters, host rail (personality spotlight with the crisp images).
- Migrations: 0003 (video_url, mux, chapters JSONB, slug) + 0004 (chat/polls/votes tables + RLS).
- Seed example in docs/phase7/seed-content.sql for a video episode with chapters.
- Images: The 4 portraits (gathered from C: session) mapped to public/assets/images/hosts/ for the root (see public/assets/images/hosts/README.md).

## How to deploy/test this version (one frontend, one backend, one repo)

1. In Vercel dashboard for the thecolony-app project:
   - Deploy the `latest-for-testing` branch as Preview (this is the version with the latest implemented changes for testing).
   - The preview URL is your testing environment for the video/live/realtime/image features.

2. Local test (after pulling the branch or cloning the root):
   - npm i
   - Apply migrations 0003 + 0004 to your Supabase thecolony-app project (the "backend deploy").
   - Run the seed for test data.
   - Add the 4 host jpgs to public/assets/images/hosts/ (from C: session or your backup).
   - npm run dev
   - Visit the per-ep and live sections.

3. Production: Merge `latest-for-testing` to `main` when verified, Vercel will auto-deploy the root.

All in one thecolony-app (GitHub + Vercel frontend + Supabase backend via this repo's migrations).

Test the live stream perfection, podcast video (audio only or video), framer motion animations/reduced, realtime chat/polls, and personality spotlight with the crisp images.

Ready for your testing! The root is consolidated.

## Root Consolidation Complete (2026-06-08 update)

- **package.json**: Pushed to root (was missing). Includes "framer-motion", "@supabase/supabase-js", "next", "react", "react-dom", plus mux/stripe/resend for full features, and tailwindcss/postcss in dev for completeness. Makes thecolony-app root deployable from latest-for-testing on Vercel.
- **Framer-motion verified in root code on GH**: EpisodePlayer.tsx (import { useReducedMotion } from "framer-motion"), LiveStage.tsx (import { motion, AnimatePresence, useReducedMotion } for queue stagger, pulse, layout, reduced-safe animations). Also now in pushed spotlight components.
- **Images for spotlight**: 4 refined crisp OK personality portraits generated/refined with image_gen tool (prompts from multimodal reads of originals: navy/cream/red, wheat/land/OK motifs, professional conservative trendy). Binaries pushed under public/assets/images/hosts/ as dan-hollis.jpg, jake-merrick.jpg, marcus-webb.jpg, rachel-torres.jpg (names match existing code mappings in components). hosts/README.md updated with actuals + usage (no longer just mapping note).
- **Spotlight components added to root**: ContributorCard.tsx and StoryCard.tsx pushed (were missing on GH _components/; they use the hosts/*.jpg + framer-motion motion whileHover for personality photo pop + next/image).
- **All changes documented as "in the root"**: video player (EpisodePlayer + VideoPlayer), live 24/7 + realtime (LiveStage + LiveChat/LivePoll + lib), framer, images/spotlight, package now complete in hizzy-made-it/thecolony-app latest-for-testing only. See also ROOT_CONSOLIDATION.md .

Local after pull: npm i ; the jpgs are in public/assets/images/hosts/ ; run dev to see spotlight with motion + players.