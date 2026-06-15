# SEED_APPLY_CHECKLIST.md
**Phase 5 Content/Seeding + Migrations Applicator Subagent Deliverable**

**Date:** 2026-06-13  
**Status:** Seed verified for prod application.  

## 1. Files Read (per task)
- `supabase/seed-content.sql` (full; canonical idempotent content)
- `scripts/run-seed.mjs` (DIRECT_URL pg path + counts)
- `scripts/seed-thecolony.ts` (pg + supabase-js fallback; prefers full SQL)
- `docs/LOCAL_OK_CONTENT_STRATEGY.md` (rural OK beats: Ag, Energy, Faith/Community; partnerships targets)
- `docs/phase7/*`:
  - `per-ep-rail-FKs.md` (Layer5 FK extensions for hosts/images/reels)
  - `seed-content.sql` (legacy partial video-ep only; superseded by supabase/ version)
  - `TRACK_A_LAYERS1-3_PERFECTION.md` (player/live realtime; refs 0003/0004)
  - `TRACK_B_Perfection_Patches.md` (Layers 4-6: images, FKs, SEO; notes Phase7 extensions)

**Also inspected for verification (migrations, pages, libs):**
- `supabase/migrations/` (full dir scan)
- `scripts/apply-migrations.mjs`
- `TESTING_DEPLOY.md`, `app/page.tsx`, `lib/homepage.ts`, `lib/podcasts.ts`, `lib/series.ts`, `lib/articles.ts`, `lib/contributors.ts`, `lib/topics.ts`
- `app/{page,watch,podcasts,shows,stories,topics,contributors,live,journalists}/**/*.tsx` + related (home bundle, /watch, /topics, /podcasts, /shows, /stories, /contributors, /live claims)

## 2. Seed Confirmation (Idempotency + Coverage)
**Idempotent:** YES.
- All `INSERT ... SELECT ... WHERE NOT EXISTS (SELECT 1 FROM ... WHERE slug=...)`
- Dedicated `UPDATE` refresh for flagship `colony-report/real-video-ep` (ensures video_url + chapters always current on re-run)
- Safe re-runs; no duplicates. Scripts log "OK   seed-content.sql"
- Uses stable deterministic UUIDs for shows/series/eps/live; contributors by slug; articles by slug.

**Coverage (matches seed header + run-seed/seed-thecolony comments + page claims):**
- **5 shows** (podcasts table; slugs: colony-report, faith-and-freedom, patriot-hour, oklahoma-underground, energy-ok). Populates `/podcasts`, `getShowsWithEpisodeCounts`, home "Podcast Network", show pages.
- **11 episodes** (across 5 shows; header claims "12+" — minor count looseness in docs; actual: 3 colony incl. flagship + 2 each others). 
  - Includes `real-video-ep` (colony-report): **video_url** (BigBuckBunny sample) + **chapters** (JSONB array with t/label) + audio fallback. Exactly for per-ep player testing (`/podcasts/colony-report/real-video-ep`): video/audio toggle, chapters seek, PiP, EpisodePlayer in `app/podcasts/[slug]/[ep]/page.tsx` + lib/podcasts `episodeToPlayable`.
- **5 series** (video catalog; slugs: colony-report, faith-and-freedom, patriot-hour, oklahoma-underground, ag-report). Matches `/shows`, `lib/series.ts` `getVideoSeries`, home/watch rails.
- **8 video_episodes** (veps; "8+" per seed; mix direct video_url + mux_playback_id samples; chapters/badges on some; published; tiered). Populates `/shows`, `/watch` episodes rail, per-series pages.
- **11 articles** (public.articles; "11+" = 8 core + 3 fully migrated newsletter archive articles). 
  - Native only (no Substack/external links remain; bodies explicitly state "now native, permanently available... No external platforms required.").
  - 8 core: oklahoma-budget-crisis, lobbyist-network-silence, parents-curriculum-pushback, energy-sector-green-mandates, sheriffs-race-investigation, tulsa-dei-defund-vote, ag-report-harvest-2026, pipeline-carveouts-investigation.
  - 3 migrated (from prior "The Briefing"/newsletter refs): harvest-reality-2026, patch-reality-energy, heritage-4h-counties. Slugs surface on `/stories/[slug]`, home hero/ticker, `/news` (stories alias), `/stories`.
  - Bylines via 0010 join + UPDATEs (fallbacks in lib/articles.ts ARTICLE_CONTRIBUTOR_FALLBACK).
  - Member-only flags on some.
- **5 contributors** (idempotent by slug; tiered: headliner/featured/contributor; match 0013 + about masthead + /journalists). sarah-mitchell, marcus-webb, rachel-torres, dan-hollis, wes-carter. Populates `/contributors`, `/journalists` (alias page), bylines, home spotlight.
- **3 live_events** (preview/live/ended; for `/live`, home live rail, LiveStage). b222... (preview), b333... (live), b444... (ended replay). Matches lib/live-events + app/live/page.tsx.

**Matches page claims (no empty states post-seed):**
- **Homepage bundle** (`app/page.tsx` + `lib/homepage.ts` `getHomepageBundle`): getArticles (11), getShowsWithEpisodeCounts (5+11eps), getLiveEvents (3), getContributors (5), trendingClips (graceful empty), latestEpisodes, contributorSpotlight, countyPulse (seed has no county col but filter ok), opinionRail. Hero uses first article (budget-crisis).
- **/watch**: getVideoSeries (5), getShows..., live, clips (graceful), recentEpisodes from veps, pillar/AG&ENERGY filters (seed pillars + heuristic). "Data from seed".
- **/podcasts**: getShows... (5 shows, eps counts), getRecentEpisodes. Full catalog grid + recent rail + "real-video-ep" deep link.
- **/shows**: getVideoSeries (5 filtered by pillar/region=oklahoma; ag-report etc). No empty.
- **/stories** (and /news): getArticles (11 native); category filters. Migrated 3 on /stories.
- **/topics**: lib/topics `getTopics` (falls to demo from article categories + counties even pre-0026; 0026 table optional seed in mig). Seed categories (Economy/Investigations/Politics/Culture) + rural + some county topics populate; `/topics/[topic]` filters articles.
- **/contributors** + **/journalists**: getContributorsByTier + leaderboard (5). Masthead claims in about (links 5 names).
- **/live**: getLiveEvents (3 statuses). LiveStage, chat/poll (post-0004), 24/7 fallback.
- Also: advertise/about/vs reconciled per seed comments; brutalist patriotic OK tone throughout.

**Real-video-ep chapters/video for per-ep player:** Confirmed (seed lines 72,81-86; UPDATE ensures). Matches TESTING_DEPLOY + Phase6/7 player work (0003 refinements).

**Native no-Substack:** Explicit in 3 migrated article bodies + top header ("Platform is now fully self-contained... All Substack/external newsletter references removed").

## 3. Exact Apply Steps for Prod
**Prerequisites (do first):**
- Confirm Supabase project linked + envs (DIRECT_URL or service role for scripts; NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + anon for app).
- **Apply all migrations first** (critical: seed assumes tables/cols from 0001+, 0010 bylines, 0013 contribs, 0026 topics optional, 0029 RLS etc). Use either:
  - `node scripts/apply-migrations.mjs` (requires DIRECT_URL; dynamic scan of `supabase/migrations/*.sql`; records to supabase_migrations.schema_migrations; verifies key tables incl. series/video_episodes/articles/contributors/live_events + report-card from 0024).
  - Or Supabase Dashboard > SQL Editor: paste/apply each in lexical order (or use Supabase CLI `supabase db push` if linked).

**Apply seed (two equivalent paths):**
**(a) Preferred for prod (manual, full control):** Supabase SQL Editor.
- Paste **full contents** of `supabase/seed-content.sql` (BEGIN; ... COMMIT;).
- Run. (After confirming 0029 etc applied; min 0001-0004 + 0007/0010/0013 as noted in seed header.)
- Safe: idempotent.

**(b) Script (if DIRECT_URL set in .env.local or env):** 
```
node scripts/run-seed.mjs
```
- Loads .env.local shim; executes full seed-content.sql via pg; prints row counts + SUMMARY JSON.
- Alternative (tsx for TS): `npx tsx scripts/seed-thecolony.ts` (prefers DIRECT_URL/pg path; falls back to Supabase client upserts for subset if no DIRECT_URL).

**Post-apply:**
- `npm run dev` (local) or Vercel redeploy.
- Visit: `/` (hero + rails), `/podcasts` + `/podcasts/colony-report/real-video-ep` (player chapters/video), `/shows`, `/stories`, `/watch` (pillars + veps), `/topics`, `/contributors`, `/journalists`, `/live` (3 events). Expect populated, no empty-states.
- Re-run seed anytime (safe).

**Verification queries (run in Supabase SQL Editor or via psql/DIRECT_URL client after seed):**
```sql
-- Core seeded tables (from SEED_TABLES in scripts)
SELECT 'shows' AS table, COUNT(*)::int AS count FROM public.shows;
SELECT 'episodes' AS table, COUNT(*)::int AS count FROM public.episodes;
SELECT 'series' AS table, COUNT(*)::int AS count FROM public.series;
SELECT 'video_episodes' AS table, COUNT(*)::int AS count FROM public.video_episodes;
SELECT 'articles' AS table, COUNT(*)::int AS count FROM public.articles;
SELECT 'contributors' AS table, COUNT(*)::int AS count FROM public.contributors;
SELECT 'live_events' AS table, COUNT(*)::int AS count FROM public.live_events;

-- Detailed spot checks
SELECT slug, title, active FROM public.shows ORDER BY slug;
SELECT show_slug, slug, title, video_url IS NOT NULL AS has_video, jsonb_array_length(chapters) AS chapter_count FROM public.episodes WHERE show_slug='colony-report' AND slug='real-video-ep';
SELECT slug, title, status, tier_required FROM public.series ORDER BY sort_weight;
SELECT series_id, slug, title, video_url IS NOT NULL OR mux_playback_id IS NOT NULL AS has_video FROM public.video_episodes ORDER BY published_at DESC LIMIT 5;
SELECT slug, title, member_only, contributor_id IS NOT NULL AS has_bylines FROM public.articles ORDER BY published_at DESC;
SELECT slug, name, tier FROM public.contributors ORDER BY tier, name;
SELECT id, title, status FROM public.live_events ORDER BY scheduled_start;

-- Optional: topics (if 0026 applied; seed uses fallback)
SELECT slug, name FROM public.topics ORDER BY sort_order;

-- RLS / public visibility (post-0029)
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname='public' AND tablename IN ('articles','shows','series','contributors');
```

**Expected post-seed counts (approx):**
- shows: 5
- episodes: 11
- series: 5
- video_episodes: 8
- articles: 11
- contributors: 5
- live_events: 3

## 4. Gaps vs Phase 1/7 (and docs/LOCAL/phase7)
- **Episode count:** Actual 11 (seed inserts); multiple places (headers, run-seed comments, SITE_AUDIT) claim "12+" or "12 eps". Minor doc drift — add 1 more ep to energy-ok or colony to hit 12+.
- **veps:** Exactly 8 (seed claims "8+"); good coverage but no more.
- **Topics:** 0026 migration present + optional seed (in mig file itself); seed-content does not insert to public.topics or article_topics (lib/topics falls back to article cats/counties + DEMO_CATEGORIES incl. "rural"). /topics populates but "more topics" per Phase7/1 (e.g. explicit ag/energy/faith/county joins) would be richer. No real tagged articles from seed.
- **Report-card counties (Phase4/0024):** Migration + tables (officials, scorecard_issues, grades) present; KEY_TABLES in apply-mig references them. **No sample data in seed-content.sql** → empty /report-card until admin inserts (app/admin has tab).
- **Real clips:** Clips/citizen_dispatch (0014/0023) supported in UI/libs (getTrendingClips, /clips, LiveChat). Seed does **not** insert any clips → graceful empty states only. No real member dispatch examples.
- **Real clips/video vs samples:** All video/audio use SoundHelix mp3 + BigBuckBunny mp4/pexels images + fake "muxseed..." ids. No real Mux assets, YouTube streams (live uses YT link), or OK footage. Per-ep uses demo.
- **LOCAL OK rural (docs/LOCAL_OK_CONTENT_STRATEGY.md + phase7):** Seed has "Ag Report", "Energy OK", "OK Underground", "Faith & Freedom" (5 shows/series + hosts like Wes Carter 5th-gen rancher). Matches core beats. **Gaps:** No real partnership data/MOUs, no agent-aggregated OSU/Farm Bureau/Dept Ag numbers or county elevator receipts, no live-from-fair calendar, no per-ep local variants/maps (see per-ep-rail-FKs.md for FK extensions needed), limited county tagging on articles (most use fallback in topics).
- **Phase7 TRACKs:** Seed is content layer; patches (images in public/assets/hosts/, FKs on episodes/video_episodes for host_id/image_id/reels, JsonLd/GEO in pages) are in phase7 docs but not auto-applied by seed (manual search_replace or future). 0029 RLS post-seed must allow public reads.
- **Other:** No real transcripts (0011), limited county col on articles (0021/0024), newsletter lists (0028) have seed contribs but no follow demo data. apply-migrations now dynamic (fixed prior audit gaps re 0012/13).
- **Homepage/watch etc:** Fully covered for no-empties; additional real rural + clips + report-card data would deepen Phase1 breadth moat.

**Post-seed RLS note (0029):** Service role (scripts) bypasses; public anon sees only published/active per policies. Verify with queries above.

## 5. Suggested 1-2 Real OK Rural Content Expansions (titles only; per LOCAL strategy)
- "Panhandle Co-op Grid Strain: 2026 Harvest Dispatch from Garfield and Texas Counties"
- "Fifth-Gen Ranchers vs DC Mandates: Farm Bureau Letters and the Fertilizer Shock (with OSU Data)"

(These extend seeded "ag-report-harvest-2026" / "harvest-reality-2026" + Energy beats with real county-level + partner-sourced depth.)

## Migration Gaps Flag (0001-0029 expected sequence)
**Missing files on disk (supabase/migrations/):**
- `0002_*.sql` (gap after 0001_live_events.sql; no references in current code/docs requiring it specifically — early live/episode work jumped to 0003)
- `0025_*.sql` (gap after 0024_oklahoma_report_card.sql; before 0026_topics.sql)
- `0027_*.sql` (gap after 0026_topics.sql; before 0028_newsletter_lists...)

**Notes:** 
- apply-migrations.mjs uses dynamic fs.readdir + lexical sort (no hardcoded list) — will apply whatever is present; records versions.
- Common references cite "0001–0004 minimum", "0001 + 0003-00xx", "up to 0029_content_rls.sql". No code breaks on gaps (0024/0026/0028/0029 are the Phase-recent ones).
- Recommend: if historical 0002/0025/0027 ever existed in other branches, reconcile or leave as-is (current tree is functional). Run `node scripts/apply-migrations.mjs` to confirm applied set in prod schema_migrations table.
- Full list on disk (sorted): 0001,0003,0004,0005,0006,0007,0008,0009,0010,0011,0012,0013,0014,0015,0016,0017,0018,0019,0020,0021,0022,0023,0024,0026,0028,0029.

**Next:** After apply + verify queries pass + UI checks (player chapters on real-video-ep, populated /watch rails etc), update any lingering "12 eps" claims in docs if desired. Seed is prod-ready and self-contained.

(End of checklist. All task items 1-5 complete.)
