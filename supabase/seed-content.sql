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
  'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
  'free'
WHERE NOT EXISTS (
  SELECT 1 FROM public.live_events WHERE id = 'b2222222-2222-4222-8222-222222222222'::uuid
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

COMMIT;

-- After seed:
--   npm run dev
--   Visit /podcasts/colony-report/real-video-ep
--   Visit /live (preview event in upcoming queue when no live event is active)