-- supabase/seed-content.sql
-- Idempotent test content for local deploy + TESTING_DEPLOY.md checklist.
-- Run in Supabase SQL Editor after applying migrations (0001–0004 minimum; 0007+ optional).
--
-- Verifies:
--   /podcasts/colony-report/real-video-ep  (video + audio toggle, chapters, PiP)
--   /podcasts/colony-report                (show rollup)
--   /live                                  (optional upcoming preview event)
--
-- Safe to re-run: uses WHERE NOT EXISTS inserts + UPDATE refresh for the flagship ep.

BEGIN;

-- ─── Deterministic IDs (stable across re-seeds) ───
-- Show:  a1111111-1111-4111-8111-111111111111
-- Ep:    c3333333-3333-4333-8333-333333333333
-- Live:  b2222222-2222-4222-8222-222222222222

-- ─── 1. Podcast show: colony-report ───
INSERT INTO public.shows (
  id,
  slug,
  title,
  host,
  description,
  cover_url,
  rss_url,
  active
)
SELECT
  'a1111111-1111-4111-8111-111111111111'::uuid,
  'colony-report',
  'The Colony Report',
  'Jake Merrick',
  'Oklahoma''s daily dose of unfiltered truth — flagship podcast with first-class video episodes.',
  NULL,
  NULL,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.shows WHERE slug = 'colony-report'
);

-- ─── 2. Flagship video episode: real-video-ep ───
INSERT INTO public.episodes (
  id,
  show_id,
  show_slug,
  guid,
  slug,
  title,
  description,
  audio_url,
  video_url,
  mux_playback_id,
  thumbnail_url,
  chapters,
  host_name,
  duration_s,
  episode_no,
  pub_date
)
SELECT
  'c3333333-3333-4333-8333-333333333333'::uuid,
  s.id,
  s.slug,
  'seed:colony-report:real-video-ep',
  'real-video-ep',
  'The Real Video Episode — OK Investigations',
  'Full video + audio mode demo with chapters. First-class video podcast for deploy testing.',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  NULL,
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
  '[
    {"t": 0,   "label": "Cold Open"},
    {"t": 45,  "label": "The Lead"},
    {"t": 180, "label": "Field Report"},
    {"t": 420, "label": "Analysis & Close"}
  ]'::jsonb,
  'Jake Merrick',
  1800,
  1,
  now() - interval '1 day'
FROM public.shows s
WHERE s.slug = 'colony-report'
  AND NOT EXISTS (
    SELECT 1
    FROM public.episodes e
    WHERE e.show_slug = 'colony-report'
      AND e.slug = 'real-video-ep'
  );

-- Refresh video/chapter fields when re-running seed (idempotent upsert behavior)
UPDATE public.episodes
SET
  title = 'The Real Video Episode — OK Investigations',
  description = 'Full video + audio mode demo with chapters. First-class video podcast for deploy testing.',
  audio_url = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  mux_playback_id = NULL,
  thumbnail_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
  chapters = '[
    {"t": 0,   "label": "Cold Open"},
    {"t": 45,  "label": "The Lead"},
    {"t": 180, "label": "Field Report"},
    {"t": 420, "label": "Analysis & Close"}
  ]'::jsonb,
  host_name = 'Jake Merrick',
  duration_s = 1800,
  episode_no = 1,
  pub_date = COALESCE(pub_date, now() - interval '1 day')
WHERE show_slug = 'colony-report'
  AND slug = 'real-video-ep';

-- ─── 3. Audio-only sibling (optional second ep on same show) ───
INSERT INTO public.episodes (
  id,
  show_id,
  show_slug,
  guid,
  slug,
  title,
  description,
  audio_url,
  video_url,
  mux_playback_id,
  thumbnail_url,
  chapters,
  host_name,
  duration_s,
  episode_no,
  pub_date
)
SELECT
  'c4444444-4444-4444-8444-444444444444'::uuid,
  s.id,
  s.slug,
  'seed:colony-report:audio-followup',
  'audio-followup',
  'Audio Only Followup',
  'Pure audio episode — tests audio-only path and WebAudio visualizer.',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  NULL,
  NULL,
  NULL,
  NULL,
  'Marcus Webb',
  900,
  2,
  now() - interval '2 days'
FROM public.shows s
WHERE s.slug = 'colony-report'
  AND NOT EXISTS (
    SELECT 1
    FROM public.episodes e
    WHERE e.show_slug = 'colony-report'
      AND e.slug = 'audio-followup'
  );

-- ─── 4. Optional live_events row (upcoming preview for /live queue) ───
INSERT INTO public.live_events (
  id,
  series_id,
  title,
  description,
  status,
  scheduled_start,
  actual_start,
  ended_at,
  mux_playback_id,
  video_url,
  tier_required
)
SELECT
  'b2222222-2222-4222-8222-222222222222'::uuid,
  NULL,
  'Colony Report — Live Test Broadcast',
  'Seed preview event for LiveStage queue + realtime chat/poll wiring. Replace video_url or mux_playback_id with a real stream before go-live.',
  'preview',
  now() + interval '2 hours',
  NULL,
  NULL,
  NULL,
  'https://www.youtube.com/@jakemerrick212/streams',
  'free'
WHERE NOT EXISTS (
  SELECT 1 FROM public.live_events WHERE id = 'b2222222-2222-4222-8222-222222222222'::uuid
);

-- ON AIR demo for board walkthrough (replace with Mux playback before go-live)
INSERT INTO public.live_events (
  id, series_id, title, description, status,
  scheduled_start, actual_start, ended_at,
  mux_playback_id, video_url, tier_required
)
SELECT
  'b3333333-3333-4333-8333-333333333333'::uuid,
  NULL,
  'The Colony Report — Live with Jake Merrick',
  'Board demo broadcast. Whistleblower segment, governor race update, and live Q&A.',
  'live',
  now() - interval '30 minutes',
  now() - interval '25 minutes',
  NULL,
  NULL,
  'https://www.youtube.com/@jakemerrick212/streams',
  'free'
WHERE NOT EXISTS (
  SELECT 1 FROM public.live_events WHERE id = 'b3333333-3333-4333-8333-333333333333'::uuid
);

-- Ended replay for queue realism
INSERT INTO public.live_events (
  id, series_id, title, description, status,
  scheduled_start, actual_start, ended_at,
  mux_playback_id, video_url, tier_required
)
SELECT
  'b4444444-4444-4444-8444-444444444444'::uuid,
  NULL,
  'Patriot Hour — Friday Replay',
  'Marcus Webb on federal overreach and Oklahoma sovereignty.',
  'ended',
  now() - interval '2 days',
  now() - interval '2 days',
  now() - interval '1 day',
  NULL,
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'free'
WHERE NOT EXISTS (
  SELECT 1 FROM public.live_events WHERE id = 'b4444444-4444-4444-8444-444444444444'::uuid
);

-- ─── 5. Optional video catalog (requires 0007_video_catalog.sql) ───
-- Uncomment if series / video_episodes tables exist:
--
-- INSERT INTO public.series (id, slug, title, tagline, type, status, pillar, is_oklahoma, tier_required, sort_weight)
-- SELECT 'd5555555-5555-4555-8555-555555555555'::uuid, 'the-colony-report', 'The Colony Report', 'Oklahoma truth daily.', 'podcast', 'published', 'truth', true, 'free', 100
-- WHERE NOT EXISTS (SELECT 1 FROM public.series WHERE slug = 'the-colony-report');
--
-- INSERT INTO public.video_episodes (id, series_id, slug, title, status, tier_required, video_url, duration_seconds, published_at)
-- SELECT 'e6666666-6666-4666-8666-666666666666'::uuid, ser.id, 'ep-101-seed', 'Ep. 101 — Seed Video', 'published', 'free',
--   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 596, now() - interval '3 days'
-- FROM public.series ser
-- WHERE ser.slug = 'the-colony-report'
--   AND NOT EXISTS (SELECT 1 FROM public.video_episodes WHERE series_id = ser.id AND slug = 'ep-101-seed');

-- ─── 6. Published articles (public.articles table) ───
-- Home hero + /news headlines — patriotic Oklahoma press theme.
-- Production schema uses body (article text) + member_only (paywall flag).

INSERT INTO public.articles (
  id, slug, title, dek, body, status, member_only, hero_url, hero_alt, category, published_at
)
SELECT
  'f1111111-1111-4111-8111-111111111101'::uuid,
  'oklahoma-budget-crisis',
  'What They Don''t Want You to Know About Oklahoma''s Budget Crisis',
  'Six weeks inside the capitol. The numbers do not add up.',
  'Our journalists spent six weeks inside the state capitol tracing how emergency funds, education dollars, and infrastructure bonds were rerouted without a public vote. Documents obtained through open-records requests show a pattern of last-minute amendments pushed through after midnight sessions. What we found will make you angry — and it is why independent Oklahoma media exists.',
  'published',
  false,
  '/assets/images/story-lead.svg',
  'Oklahoma state capitol at dusk — budget crisis investigation',
  'Investigations',
  now() - interval '6 hours'
WHERE NOT EXISTS (
  SELECT 1 FROM public.articles WHERE slug = 'oklahoma-budget-crisis'
);

INSERT INTO public.articles (
  id, slug, title, dek, body, status, member_only, hero_url, hero_alt, category, published_at
)
SELECT
  'f1111111-1111-4111-8111-111111111102'::uuid,
  'lobbyist-network-silence',
  'The Lobbyist Network That Keeps Oklahoma Voters in the Dark',
  'Forty shell companies. Three firms. One closed door.',
  'A coordinated roster of contract lobbyists has been shaping utility rates, education policy, and tax credits while their clients stay off the public docket. Colony reporters mapped more than forty LLC shells tied to three out-of-state firms operating from Oklahoma City office suites. Members get the full donor matrix, meeting logs, and the lawmakers who signed the confidentiality agreements.',
  'published',
  true,
  '/assets/images/story-2.svg',
  'Lobbyist network diagram — Oklahoma politics investigation',
  'Politics',
  now() - interval '1 day'
WHERE NOT EXISTS (
  SELECT 1 FROM public.articles WHERE slug = 'lobbyist-network-silence'
);

INSERT INTO public.articles (
  id, slug, title, dek, body, status, member_only, hero_url, hero_alt, category, published_at
)
SELECT
  'f1111111-1111-4111-8111-111111111103'::uuid,
  'parents-curriculum-pushback',
  'Oklahoma Parents Draw the Line on Classroom Curriculum Mandates',
  'From Edmond to Lawton, families are taking back the classroom.',
  'School board meetings from Edmond to Lawton have turned into standing-room-only forums as parents demand a say in reading lists, history standards, and vendor contracts. The Colony interviewed two dozen families who pulled public records on curriculum adoptions their districts never advertised. Their pushback is reshaping the 2026 legislative session — and both parties are scrambling to claim the parent vote.',
  'published',
  false,
  '/assets/images/story-3.svg',
  'Parents at an Oklahoma school board meeting on curriculum',
  'Culture',
  now() - interval '2 days'
WHERE NOT EXISTS (
  SELECT 1 FROM public.articles WHERE slug = 'parents-curriculum-pushback'
);

INSERT INTO public.articles (
  id, slug, title, dek, body, status, member_only, hero_url, hero_alt, category, published_at
)
SELECT
  'f1111111-1111-4111-8111-111111111104'::uuid,
  'energy-sector-green-mandates',
  'Oklahoma Energy Jobs on the Line as Green Mandates Hit the Pipeline',
  'Pipeline country braces for mandates written on the coasts.',
  'Proposed federal emissions rules and state-level renewable quotas threaten thousands of oil-field and refinery jobs across the Panhandle and eastern Oklahoma. Industry leaders warn that compliance timelines ignore the reality of rural power grids and existing pipeline contracts. We break down which counties face the steepest losses — and which lawmakers are quietly negotiating carve-outs.',
  'published',
  false,
  '/assets/images/story-4.svg',
  'Oklahoma oil field and pipeline infrastructure at sunset',
  'Economy',
  now() - interval '3 days'
WHERE NOT EXISTS (
  SELECT 1 FROM public.articles WHERE slug = 'energy-sector-green-mandates'
);

INSERT INTO public.articles (
  id, slug, title, dek, body, status, member_only, hero_url, hero_alt, category, published_at
)
SELECT
  'f1111111-1111-4111-8111-111111111105'::uuid,
  'sheriffs-race-investigation',
  'Inside the Sheriff''s Race That Oklahoma Power Brokers Don''t Want Audited',
  'PAC money, off-book contracts, and a race too close to call.',
  'Campaign finance filings for a contested sheriff''s race in central Oklahoma do not match the door-to-door spending volunteers reported on the ground. Colony investigators cross-referenced PAC transfers, in-kind donations, and off-book security contracts tied to a single consulting firm. The full audit — including names redacted from public filings — is available to members.',
  'published',
  true,
  '/assets/images/story-lead.svg',
  'Oklahoma sheriff campaign rally — campaign finance investigation',
  'Investigations',
  now() - interval '4 days'
WHERE NOT EXISTS (
  SELECT 1 FROM public.articles WHERE slug = 'sheriffs-race-investigation'
);

INSERT INTO public.articles (
  id, slug, title, dek, body, status, member_only, hero_url, hero_alt, category, published_at
)
SELECT
  'f1111111-1111-4111-8111-111111111106'::uuid,
  'tulsa-dei-defund-vote',
  'Tulsa Council Narrowly Votes to Defund City DEI Programs',
  'A 5–4 vote, a packed chamber, and a veto fight ahead.',
  'After a six-hour public hearing, the Tulsa City Council voted 5–4 to zero out diversity, equity, and inclusion line items in next year''s municipal budget. Protesters and pastors filled the chamber while business leaders warned the move could affect federal grant eligibility. The Colony has the roll-call vote, the amended budget pages, and what happens when the mayor''s veto pen lands.',
  'published',
  false,
  '/assets/images/story-2.svg',
  'Tulsa City Council chamber during DEI budget vote',
  'State',
  now() - interval '5 days'
WHERE NOT EXISTS (
  SELECT 1 FROM public.articles WHERE slug = 'tulsa-dei-defund-vote'
);

-- Topic hero images (navy brutalist art)
UPDATE public.articles SET hero_url = '/assets/images/stories/oklahoma-budget-crisis.svg' WHERE slug = 'oklahoma-budget-crisis';
UPDATE public.articles SET hero_url = '/assets/images/stories/lobbyist-network.svg' WHERE slug = 'lobbyist-network-silence';
UPDATE public.articles SET hero_url = '/assets/images/stories/parents-curriculum.svg' WHERE slug = 'parents-curriculum-pushback';
UPDATE public.articles SET hero_url = '/assets/images/stories/energy-pipeline.svg' WHERE slug = 'energy-sector-green-mandates';
UPDATE public.articles SET hero_url = '/assets/images/stories/sheriffs-race.svg' WHERE slug = 'sheriffs-race-investigation';
UPDATE public.articles SET hero_url = '/assets/images/stories/tulsa-dei-vote.svg' WHERE slug = 'tulsa-dei-defund-vote';

-- Contributor bylines (requires 0010_articles_contributors.sql + contributors seeded)
UPDATE public.articles a SET contributor_id = c.id
FROM public.contributors c
WHERE a.slug = 'oklahoma-budget-crisis' AND c.slug = 'sarah-mitchell';
UPDATE public.articles a SET contributor_id = c.id
FROM public.contributors c
WHERE a.slug = 'lobbyist-network-silence' AND c.slug = 'sarah-mitchell';
UPDATE public.articles a SET contributor_id = c.id
FROM public.contributors c
WHERE a.slug = 'parents-curriculum-pushback' AND c.slug = 'rachel-torres';
UPDATE public.articles a SET contributor_id = c.id
FROM public.contributors c
WHERE a.slug = 'energy-sector-green-mandates' AND c.slug = 'marcus-webb';
UPDATE public.articles a SET contributor_id = c.id
FROM public.contributors c
WHERE a.slug = 'sheriffs-race-investigation' AND c.slug = 'sarah-mitchell';
UPDATE public.articles a SET contributor_id = c.id
FROM public.contributors c
WHERE a.slug = 'tulsa-dei-defund-vote' AND c.slug = 'rachel-torres';

COMMIT;

-- After seed:
--   npm run dev
--   Visit /podcasts/colony-report/real-video-ep
--   Visit /live (preview event in upcoming queue when no live event is active)