-- supabase/seed-content.sql
-- Idempotent test content for local deploy + TESTING_DEPLOY.md checklist.
-- Run in Supabase SQL Editor after applying migrations (0001–0004 minimum; 0007+ optional).
--
-- Verifies:
--   /podcasts/colony-report/real-video-ep  (video + audio toggle, chapters, PiP)
--   /podcasts/colony-report                (show rollup)
--   /podcasts , /shows , /stories , /news , /journalists  (full catalogs, no empty states)
--   /live                                  (live/preview/replay events)
--
-- Safe to re-run: uses WHERE NOT EXISTS inserts + UPDATE refresh for the flagship ep.
-- 5 podcast shows (shows+episodes), 5 video series (series+video_episodes), 12+ eps, 11 articles (8 core + 3 Substack pages imported to articles for /stories), 5 contributors, 3 live.
-- Matches claims in advertise/about/vs etc after reconciliation. Brutalist patriotic OK tone.

BEGIN;

-- ─── Deterministic IDs (stable across re-seeds) ───
-- Shows (podcasts table): a1111111... to a5555555...
-- Episodes: c1111111-1111-4111-8111-111111111111 onward (12+)
-- Series (video /shows): d1111111-1111-4111-8111-111111111111 onward
-- Video eps: e1111111... onward
-- Live:  b2222222-2222-4222-8222-222222222222
-- Articles: f1111111... (8+)
-- Contributors: seeded idempotently by slug (migration also seeds core 4)

-- ─── 1-5. Podcast shows (for /podcasts, getShowsWithEpisodeCounts, lib/podcasts) ───
-- Matches names in seed-thecolony.ts, LOCAL strategy, live fallbacks, vs/blaze, about masthead.
INSERT INTO public.shows (id, slug, title, host, description, cover_url, rss_url, active)
SELECT 'a1111111-1111-4111-8111-111111111111'::uuid, 'colony-report', 'The Colony Report', 'Jake Merrick',
  'Oklahoma''s daily dose of unfiltered truth — flagship podcast with first-class video episodes. Statehouse, investigations, and rural beats.',
  '/assets/images/podcasts/colony-report.jpg', 'https://example.com/rss/colony-report.xml', true
WHERE NOT EXISTS (SELECT 1 FROM public.shows WHERE slug = 'colony-report');

INSERT INTO public.shows (id, slug, title, host, description, cover_url, rss_url, active)
SELECT 'a2222222-2222-4222-8222-222222222222'::uuid, 'faith-and-freedom', 'Faith & Freedom', 'Pastor Dan Hollis',
  'Where Scripture meets the public square. Weekly deep dives on faith, family, religious liberty, and Oklahoma values.',
  '/assets/images/podcasts/faith-freedom.jpg', NULL, true
WHERE NOT EXISTS (SELECT 1 FROM public.shows WHERE slug = 'faith-and-freedom');

INSERT INTO public.shows (id, slug, title, host, description, cover_url, rss_url, active)
SELECT 'a3333333-3333-4333-8333-333333333333'::uuid, 'patriot-hour', 'Patriot Hour', 'Marcus Webb',
  'One hour. Zero spin. National news and commentary from a pro-America, pro-liberty, constitutional lens.',
  '/assets/images/podcasts/patriot-hour.jpg', NULL, true
WHERE NOT EXISTS (SELECT 1 FROM public.shows WHERE slug = 'patriot-hour');

INSERT INTO public.shows (id, slug, title, host, description, cover_url, rss_url, active)
SELECT 'a4444444-4444-4444-8444-444444444444'::uuid, 'oklahoma-underground', 'OK Underground', 'Rachel Torres',
  'Field reports from the counties. Government accountability, rural Oklahoma stories, and on-the-ground investigations the papers miss.',
  '/assets/images/podcasts/oklahoma-underground.jpg', NULL, true
WHERE NOT EXISTS (SELECT 1 FROM public.shows WHERE slug = 'oklahoma-underground');

INSERT INTO public.shows (id, slug, title, host, description, cover_url, rss_url, active)
SELECT 'a5555555-5555-4555-8555-555555555555'::uuid, 'energy-ok', 'Energy OK', 'Jake Merrick',
  'Oil, gas, wind, pipelines, and the jobs that power America. Policy from the patch, not the coasts. Local energy beats for rural Oklahoma.',
  NULL, NULL, true
WHERE NOT EXISTS (SELECT 1 FROM public.shows WHERE slug = 'energy-ok');

-- ─── Episodes: 12+ across the 5 shows (for /podcasts/* , recent rails, episode counts, video support) ───
-- Mix of audio, video_url (sample mp4), mux_playback_id (demo), chapters jsonb, host_name, durations.
-- Colony flagship first (includes original video ep)

-- Ep1: flagship video (keep original id for /podcasts/colony-report/real-video-ep)
INSERT INTO public.episodes (id, show_id, show_slug, guid, slug, title, description, audio_url, video_url, mux_playback_id, thumbnail_url, chapters, host_name, duration_s, episode_no, pub_date)
SELECT 'c3333333-3333-4333-8333-333333333333'::uuid, s.id, s.slug, 'seed:colony-report:real-video-ep', 'real-video-ep',
  'The Real Video Episode — OK Investigations',
  'Full video + audio mode demo with chapters. First-class video podcast for deploy testing. Capitol documents and energy mandate fallout.',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  NULL,
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
  '[{"t":0,"label":"Cold Open"},{"t":45,"label":"The Lead"},{"t":180,"label":"Field Report"},{"t":420,"label":"Analysis & Close"}]'::jsonb,
  'Jake Merrick', 1800, 42, now() - interval '1 day'
FROM public.shows s WHERE s.slug = 'colony-report'
  AND NOT EXISTS (SELECT 1 FROM public.episodes e WHERE e.show_slug='colony-report' AND e.slug='real-video-ep');

UPDATE public.episodes SET
  title = 'The Real Video Episode — OK Investigations',
  description = 'Full video + audio mode demo with chapters. First-class video podcast for deploy testing. Capitol documents and energy mandate fallout.',
  audio_url = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  mux_playback_id = NULL,
  thumbnail_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
  chapters = '[{"t":0,"label":"Cold Open"},{"t":45,"label":"The Lead"},{"t":180,"label":"Field Report"},{"t":420,"label":"Analysis & Close"}]'::jsonb,
  host_name = 'Jake Merrick', duration_s = 1800, episode_no = 42,
  pub_date = COALESCE(pub_date, now() - interval '1 day')
WHERE show_slug = 'colony-report' AND slug = 'real-video-ep';

-- Ep2 audio only on colony
INSERT INTO public.episodes (id, show_id, show_slug, guid, slug, title, description, audio_url, video_url, mux_playback_id, thumbnail_url, chapters, host_name, duration_s, episode_no, pub_date)
SELECT 'c4444444-4444-4444-8444-444444444444'::uuid, s.id, s.slug, 'seed:colony-report:audio-followup', 'audio-followup',
  'Audio Only Followup — Budget Shell Game',
  'Pure audio episode — tests audio-only path and WebAudio visualizer. Followup on the budget amendments.',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', NULL, NULL, NULL, NULL,
  'Jake Merrick', 900, 43, now() - interval '2 days'
FROM public.shows s WHERE s.slug = 'colony-report'
  AND NOT EXISTS (SELECT 1 FROM public.episodes e WHERE e.show_slug='colony-report' AND e.slug='audio-followup');

-- Ep3 colony with mux demo
INSERT INTO public.episodes (id, show_id, show_slug, guid, slug, title, description, audio_url, video_url, mux_playback_id, thumbnail_url, chapters, host_name, duration_s, episode_no, pub_date)
SELECT 'c5555555-5555-4555-8555-555555555555'::uuid, s.id, s.slug, 'seed:colony-report:mux-demo', 'mux-demo',
  'Ep. 44 — Mux HLS Test Broadcast',
  'Demo episode using mux_playback_id path. Pipeline jobs report from the patch.',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', NULL, 'muxseed001colony', '/assets/images/podcasts/colony-report.jpg',
  '[{"t":0,"label":"Intro"},{"t":120,"label":"Energy Patch Update"},{"t":480,"label":"Q&A from Members"}]'::jsonb,
  'Jake Merrick', 1320, 44, now() - interval '3 days'
FROM public.shows s WHERE s.slug = 'colony-report'
  AND NOT EXISTS (SELECT 1 FROM public.episodes e WHERE e.show_slug='colony-report' AND e.slug='mux-demo');

-- Faith & Freedom eps (2)
INSERT INTO public.episodes (id, show_id, show_slug, guid, slug, title, description, audio_url, video_url, mux_playback_id, thumbnail_url, chapters, host_name, duration_s, episode_no, pub_date)
SELECT gen_random_uuid(), s.id, s.slug, 'seed:faith-and-freedom:ep-019', 'ep-019-scripture-and-sovereignty',
  'Ep. 019 — Scripture and Sovereignty',
  'How the founders read Romans 13 and what it means for state vs federal power in 2026 Oklahoma.',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', NULL, NULL, NULL, NULL,
  'Pastor Dan Hollis', 2100, 19, now() - interval '4 days'
FROM public.shows s WHERE s.slug = 'faith-and-freedom'
  AND NOT EXISTS (SELECT 1 FROM public.episodes e WHERE e.show_slug='faith-and-freedom' AND e.slug='ep-019-scripture-and-sovereignty');

INSERT INTO public.episodes (id, show_id, show_slug, guid, slug, title, description, audio_url, video_url, mux_playback_id, thumbnail_url, chapters, host_name, duration_s, episode_no, pub_date)
SELECT gen_random_uuid(), s.id, s.slug, 'seed:faith-and-freedom:ep-020', 'ep-020',
  'Ep. 020 — Faith in the Schoolhouse',
  'Parents, pastors, and the 2026 curriculum fights. Live clips from Lawton and Edmond.',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', NULL, 'muxseed002faith', NULL,
  '[{"t":0,"label":"Opening Prayer"},{"t":90,"label":"Lawton Town Hall"},{"t":600,"label":"Call to Action"}]'::jsonb,
  'Pastor Dan Hollis', 2700, 20, now() - interval '1 day'
FROM public.shows s WHERE s.slug = 'faith-and-freedom'
  AND NOT EXISTS (SELECT 1 FROM public.episodes e WHERE e.show_slug='faith-and-freedom' AND e.slug='ep-020');

-- Patriot Hour eps (2)
INSERT INTO public.episodes (id, show_id, show_slug, guid, slug, title, description, audio_url, video_url, mux_playback_id, thumbnail_url, chapters, host_name, duration_s, episode_no, pub_date)
SELECT gen_random_uuid(), s.id, s.slug, 'seed:patriot-hour:ep-207', 'ep-207-federal-overreach',
  'Ep. 207 — Federal Overreach and Oklahoma Sovereignty',
  'Marcus Webb on the latest DC mandates hitting ranchers and drillers. No spin, just the Constitution.',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', NULL, NULL, NULL, NULL,
  'Marcus Webb', 3600, 207, now() - interval '5 days'
FROM public.shows s WHERE s.slug = 'patriot-hour'
  AND NOT EXISTS (SELECT 1 FROM public.episodes e WHERE e.show_slug='patriot-hour' AND e.slug='ep-207-federal-overreach');

INSERT INTO public.episodes (id, show_id, show_slug, guid, slug, title, description, audio_url, video_url, mux_playback_id, thumbnail_url, chapters, host_name, duration_s, episode_no, pub_date)
SELECT gen_random_uuid(), s.id, s.slug, 'seed:patriot-hour:live-replay', 'live-replay-061',
  'Live Replay — Governor Race Special',
  'Extended cut from the June 6 live broadcast. Whistleblower testimony and county-level polling.',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', NULL, NULL,
  '[{"t":0,"label":"Opening"},{"t":300,"label":"Whistleblower"},{"t":900,"label":"Live Q&A"}]'::jsonb,
  'Marcus Webb', 4200, 208, now() - interval '6 days'
FROM public.shows s WHERE s.slug = 'patriot-hour'
  AND NOT EXISTS (SELECT 1 FROM public.episodes e WHERE e.show_slug='patriot-hour' AND e.slug='live-replay-061');

-- OK Underground (2)
INSERT INTO public.episodes (id, show_id, show_slug, guid, slug, title, description, audio_url, video_url, mux_playback_id, thumbnail_url, chapters, host_name, duration_s, episode_no, pub_date)
SELECT gen_random_uuid(), s.id, s.slug, 'seed:oklahoma-underground:field-014', 'field-014-sheriff-audit',
  'Field Report 014 — The Sheriff''s Race They Don''t Want Audited',
  'Door-to-door money vs PAC filings in central Oklahoma. On the ground with volunteers.',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', NULL, NULL, '/assets/images/podcasts/oklahoma-underground.jpg', NULL,
  'Rachel Torres', 1500, 14, now() - interval '2 days'
FROM public.shows s WHERE s.slug = 'oklahoma-underground'
  AND NOT EXISTS (SELECT 1 FROM public.episodes e WHERE e.show_slug='oklahoma-underground' AND e.slug='field-014-sheriff-audit');

INSERT INTO public.episodes (id, show_id, show_slug, guid, slug, title, description, audio_url, video_url, mux_playback_id, thumbnail_url, chapters, host_name, duration_s, episode_no, pub_date)
SELECT gen_random_uuid(), s.id, s.slug, 'seed:oklahoma-underground:ep-015', 'ep-015',
  'Ep. 015 — Lobbyist Shells in the Oil Patch',
  'How out-of-state firms hide influence in energy policy. Maps, LLCs, and midnight amendments.',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', NULL, 'muxseed003underground', NULL, NULL,
  'Rachel Torres', 2400, 15, now() - interval '7 days'
FROM public.shows s WHERE s.slug = 'oklahoma-underground'
  AND NOT EXISTS (SELECT 1 FROM public.episodes e WHERE e.show_slug='oklahoma-underground' AND e.slug='ep-015');

-- Energy OK (2) — completes 12 episodes
INSERT INTO public.episodes (id, show_id, show_slug, guid, slug, title, description, audio_url, video_url, mux_playback_id, thumbnail_url, chapters, host_name, duration_s, episode_no, pub_date)
SELECT gen_random_uuid(), s.id, s.slug, 'seed:energy-ok:ep-003', 'ep-003-green-mandates',
  'Ep. 003 — Green Mandates Hit the Pipeline',
  'Proposed rules threaten Panhandle jobs. County-by-county breakdown and the lawmakers carving out exemptions.',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', NULL, NULL, NULL, NULL,
  'Jake Merrick', 1800, 3, now() - interval '3 days'
FROM public.shows s WHERE s.slug = 'energy-ok'
  AND NOT EXISTS (SELECT 1 FROM public.episodes e WHERE e.show_slug='energy-ok' AND e.slug='ep-003-green-mandates');

INSERT INTO public.episodes (id, show_id, show_slug, guid, slug, title, description, audio_url, video_url, mux_playback_id, thumbnail_url, chapters, host_name, duration_s, episode_no, pub_date)
SELECT gen_random_uuid(), s.id, s.slug, 'seed:energy-ok:ep-004', 'ep-004',
  'Ep. 004 — Co-ops, Wind, and the Grid Reality',
  'Rural electric co-ops tell the truth about reliability. No coastal fantasy — just Oklahoma facts.',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', NULL, NULL,
  '[{"t":0,"label":"Co-op Dispatch"},{"t":240,"label":"Field Interview"},{"t":700,"label":"What Comes Next"}]'::jsonb,
  'Jake Merrick', 1950, 4, now() - interval '8 days'
FROM public.shows s WHERE s.slug = 'energy-ok'
  AND NOT EXISTS (SELECT 1 FROM public.episodes e WHERE e.show_slug='energy-ok' AND e.slug='ep-004');

-- ─── Contributors (4+ for /journalists, masthead, bylines on articles; idempotent by slug) ───
-- Core 4 match migration 0013 + about page. Extra ag host for Energy/Ag beats.
INSERT INTO public.contributors (slug, name, tier, role, bio, location, email, x_handle, status)
SELECT 'sarah-mitchell', 'Sarah Mitchell', 'headliner', 'Investigations Editor',
  'Twelve years on the politics beat. Focus: campaign finance, public records, statehouse accountability. Named bylines only.',
  'Oklahoma City, OK', 'sarah@thecolonyok.com', '@sarahm_ok', 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.contributors WHERE slug = 'sarah-mitchell');

INSERT INTO public.contributors (slug, name, tier, role, bio, location, email, x_handle, status)
SELECT 'marcus-webb', 'Marcus Webb', 'featured', 'Host · Patriot Hour',
  'Former Marine officer. Talk radio veteran. Focus: federal/state tension, constitutional law, and the Patriot Hour no-spin hour.',
  'Oklahoma City, OK', 'marcus@thecolonyok.com', '@marcuswebb', 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.contributors WHERE slug = 'marcus-webb');

INSERT INTO public.contributors (slug, name, tier, role, bio, location, email, x_handle, status)
SELECT 'rachel-torres', 'Rachel Torres', 'featured', 'Host · OK Underground',
  'Field reporter, formerly with KFOR. Rural Oklahoma and on-the-ground government reporting from the counties.',
  'Lawton, OK', 'rachel@thecolonyok.com', '@rachel_ok', 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.contributors WHERE slug = 'rachel-torres');

INSERT INTO public.contributors (slug, name, tier, role, bio, location, email, x_handle, status)
SELECT 'dan-hollis', 'Pastor Dan Hollis', 'contributor', 'Host · Faith & Freedom',
  'Pastor of First Baptist Lawton, 22 years. Faith in public life, religious liberty, and Oklahoma family values.',
  'Lawton, OK', 'dan@thecolonyok.com', NULL, 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.contributors WHERE slug = 'dan-hollis');

INSERT INTO public.contributors (slug, name, tier, role, bio, location, email, x_handle, status)
SELECT 'wes-carter', 'Wes Carter', 'featured', 'Ag & Energy Correspondent',
  'Fifth-generation Oklahoma rancher and energy worker. Covers the patch, the co-ops, and Farm Bureau beats.',
  'Waurika, OK', 'wes@thecolonyok.com', '@wescarter_ok', 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.contributors WHERE slug = 'wes-carter');

-- ─── Live events (1-2+ for /live : live + preview + ended replays) ───
-- Kept original + refreshed. Matches live fallbacks in app/live/page.tsx and lib/live-events.
INSERT INTO public.live_events (
  id, series_id, title, description, status,
  scheduled_start, actual_start, ended_at,
  mux_playback_id, video_url, tier_required
)
SELECT 'b2222222-2222-4222-8222-222222222222'::uuid, NULL,
  'Colony Report — Live Test Broadcast',
  'Seed preview event for LiveStage queue + realtime chat/poll wiring. Replace video_url or mux_playback_id with a real stream before go-live. Oklahoma sovereignty on the line.',
  'preview', now() + interval '2 hours', NULL, NULL, NULL,
  'https://www.youtube.com/@jakemerrick212/streams', 'free'
WHERE NOT EXISTS (SELECT 1 FROM public.live_events WHERE id = 'b2222222-2222-4222-8222-222222222222'::uuid);

INSERT INTO public.live_events (
  id, series_id, title, description, status,
  scheduled_start, actual_start, ended_at,
  mux_playback_id, video_url, tier_required
)
SELECT 'b3333333-3333-4333-8333-333333333333'::uuid, NULL,
  'The Colony Report — Live with Jake Merrick',
  'The Colony Report — Live with Jake Merrick. Whistleblower segment, governor race update, and live Q&A from the counties. Free for all.',
  'live', now() - interval '30 minutes', now() - interval '25 minutes', NULL, NULL,
  'https://www.youtube.com/@jakemerrick212/streams', 'free'
WHERE NOT EXISTS (SELECT 1 FROM public.live_events WHERE id = 'b3333333-3333-4333-8333-333333333333'::uuid);

INSERT INTO public.live_events (
  id, series_id, title, description, status,
  scheduled_start, actual_start, ended_at,
  mux_playback_id, video_url, tier_required
)
SELECT 'b4444444-4444-4444-8444-444444444444'::uuid, NULL,
  'Patriot Hour — Friday Replay',
  'Marcus Webb on federal overreach and Oklahoma sovereignty. Full replay of the live special.',
  'ended', now() - interval '2 days', now() - interval '2 days', now() - interval '1 day', NULL,
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'free'
WHERE NOT EXISTS (SELECT 1 FROM public.live_events WHERE id = 'b4444444-4444-4444-8444-444444444444'::uuid);

-- ─── 5. Video catalog series + video_episodes (for /shows page, lib/series.ts, getVideoSeries) ───
-- 5 series matching patriotic OK strategy + seed-thecolony reference. 8+ published video episodes.
-- Uses sample video + mux for demo. Populates /shows and per-series episode lists.
INSERT INTO public.series (id, slug, title, tagline, description, type, status, pillar, is_oklahoma, poster_url, accent_color, tier_required, sort_weight)
SELECT 'd1111111-1111-4111-8111-111111111111'::uuid, 'colony-report', 'The Colony Report', 'Oklahoma''s daily dose of unfiltered truth.',
  'Flagship investigations and statehouse reporting. Truth pillar. Video episodes + live integration.', 'podcast', 'published', 'truth', true,
  '/assets/images/podcasts/colony-report.jpg', '#f0b429', 'free', 100
WHERE NOT EXISTS (SELECT 1 FROM public.series WHERE slug = 'colony-report');

INSERT INTO public.series (id, slug, title, tagline, description, type, status, pillar, is_oklahoma, poster_url, accent_color, tier_required, sort_weight)
SELECT 'd2222222-2222-4222-8222-222222222222'::uuid, 'faith-and-freedom', 'Faith & Freedom', 'Where Scripture meets the public square.',
  'Biblical foundations of liberty. Weekly with Pastor Dan Hollis. Faith pillar.', 'podcast', 'published', 'faith', true,
  '/assets/images/podcasts/faith-freedom.jpg', '#d4a017', 'free', 90
WHERE NOT EXISTS (SELECT 1 FROM public.series WHERE slug = 'faith-and-freedom');

INSERT INTO public.series (id, slug, title, tagline, description, type, status, pillar, is_oklahoma, poster_url, accent_color, tier_required, sort_weight)
SELECT 'd3333333-3333-4333-8333-333333333333'::uuid, 'patriot-hour', 'Patriot Hour', 'One hour. Zero spin.',
  'National news from a pro-America lens. Marcus Webb. Freedom pillar.', 'show', 'published', 'freedom', false,
  '/assets/images/podcasts/patriot-hour.jpg', '#c0392b', 'settler', 80
WHERE NOT EXISTS (SELECT 1 FROM public.series WHERE slug = 'patriot-hour');

INSERT INTO public.series (id, slug, title, tagline, description, type, status, pillar, is_oklahoma, poster_url, accent_color, tier_required, sort_weight)
SELECT 'd4444444-4444-4444-8444-444444444444'::uuid, 'oklahoma-underground', 'OK Underground', 'Following the story wherever it leads.',
  'Long-form field investigations on corruption and courage in rural Oklahoma.', 'documentary', 'published', 'truth', true,
  '/assets/images/podcasts/oklahoma-underground.jpg', '#8e6f3a', 'free', 70
WHERE NOT EXISTS (SELECT 1 FROM public.series WHERE slug = 'oklahoma-underground');

INSERT INTO public.series (id, slug, title, tagline, description, type, status, pillar, is_oklahoma, poster_url, accent_color, tier_required, sort_weight)
SELECT 'd5555555-5555-4555-8555-555555555555'::uuid, 'ag-report', 'Ag Report', 'Farm, ranch, and rural Oklahoma.',
  'OSU agronomists, 5th-gen ranchers, Farm Bureau updates. The land that feeds America.', 'podcast', 'published', 'freedom', true,
  NULL, '#6b8e23', 'free', 60
WHERE NOT EXISTS (SELECT 1 FROM public.series WHERE slug = 'ag-report');

-- Video episodes (8+) for the series. Mix mux + direct video_url. All published.
INSERT INTO public.video_episodes (id, series_id, slug, title, description, season_number, episode_number, status, tier_required, mux_playback_id, duration_seconds, thumbnail_url, video_url, badges, chapters, published_at)
SELECT 'e1111111-1111-4111-8111-111111111111'::uuid, ser.id, 'ep-101-seed', 'Ep. 101 — Seed Video', 'Full video demo episode for /shows catalog. Budget crisis documents and the midnight session.',
  1, 101, 'published', 'free', NULL, 596,
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  '["bonus"]'::jsonb,
  '[{"t":0,"label":"Cold Open"},{"t":200,"label":"The Numbers"}]'::jsonb,
  now() - interval '3 days'
FROM public.series ser WHERE ser.slug = 'colony-report'
  AND NOT EXISTS (SELECT 1 FROM public.video_episodes ve WHERE ve.series_id = ser.id AND ve.slug = 'ep-101-seed');

INSERT INTO public.video_episodes (id, series_id, slug, title, description, season_number, episode_number, status, tier_required, mux_playback_id, duration_seconds, thumbnail_url, video_url, badges, chapters, published_at)
SELECT 'e2222222-2222-4222-8222-222222222222'::uuid, ser.id, 'ep-102-members', 'Ep. 102 — Members Deep Dive', 'Extended cut. The lobbyist network and who really wrote the carve-outs.',
  1, 102, 'published', 'settler', 'muxseed101colony', 3600, NULL, NULL, '["members-only"]'::jsonb, NULL,
  now() - interval '4 days'
FROM public.series ser WHERE ser.slug = 'colony-report'
  AND NOT EXISTS (SELECT 1 FROM public.video_episodes ve WHERE ve.series_id = ser.id AND ve.slug = 'ep-102-members');

INSERT INTO public.video_episodes (id, series_id, slug, title, description, season_number, episode_number, status, tier_required, mux_playback_id, duration_seconds, thumbnail_url, video_url, badges, chapters, published_at)
SELECT 'e3333333-3333-4333-8333-333333333333'::uuid, ser.id, 'faith-ep-019', 'Ep. 019 — Scripture and Sovereignty (Video)', 'Video edition of the faith and state power discussion.',
  1, 19, 'published', 'free', NULL, 2100, NULL,
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', '[]'::jsonb, NULL,
  now() - interval '5 days'
FROM public.series ser WHERE ser.slug = 'faith-and-freedom'
  AND NOT EXISTS (SELECT 1 FROM public.video_episodes ve WHERE ve.series_id = ser.id AND ve.slug = 'faith-ep-019');

INSERT INTO public.video_episodes (id, series_id, slug, title, description, season_number, episode_number, status, tier_required, mux_playback_id, duration_seconds, thumbnail_url, video_url, badges, chapters, published_at)
SELECT 'e4444444-4444-4444-8444-444444444444'::uuid, ser.id, 'patriot-207', 'Ep. 207 — Federal Overreach (Video Cut)', 'The live special in full video. Constitution, ranchers, and drillers.',
  2, 207, 'published', 'free', 'muxseedpatriot01', 3600, NULL, NULL, '[]'::jsonb, NULL,
  now() - interval '6 days'
FROM public.series ser WHERE ser.slug = 'patriot-hour'
  AND NOT EXISTS (SELECT 1 FROM public.video_episodes ve WHERE ve.series_id = ser.id AND ve.slug = 'patriot-207');

INSERT INTO public.video_episodes (id, series_id, slug, title, description, season_number, episode_number, status, tier_required, mux_playback_id, duration_seconds, thumbnail_url, video_url, badges, chapters, published_at)
SELECT 'e5555555-5555-4555-8555-555555555555'::uuid, ser.id, 'underground-014', 'Field 014 — Sheriff Audit (Video)', 'On-the-ground footage from the contested race. Documents the PACs don''t show.',
  1, 14, 'published', 'free', NULL, 1500,
  '/assets/images/podcasts/oklahoma-underground.jpg',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', '["investigation"]'::jsonb,
  '[{"t":30,"label":"Door Knock"},{"t":480,"label":"Finance Mismatch"}]'::jsonb,
  now() - interval '2 days'
FROM public.series ser WHERE ser.slug = 'oklahoma-underground'
  AND NOT EXISTS (SELECT 1 FROM public.video_episodes ve WHERE ve.series_id = ser.id AND ve.slug = 'underground-014');

INSERT INTO public.video_episodes (id, series_id, slug, title, description, season_number, episode_number, status, tier_required, mux_playback_id, duration_seconds, thumbnail_url, video_url, badges, chapters, published_at)
SELECT 'e6666666-6666-4666-8666-666666666666'::uuid, ser.id, 'ag-003', 'Ag Report 003 — Harvest and Mandates', 'Soil, yields, and the federal rules that ignore flyover reality. With OSU guests.',
  1, 3, 'published', 'free', 'muxseedag01', 2400, NULL, NULL, '[]'::jsonb, NULL,
  now() - interval '7 days'
FROM public.series ser WHERE ser.slug = 'ag-report'
  AND NOT EXISTS (SELECT 1 FROM public.video_episodes ve WHERE ve.series_id = ser.id AND ve.slug = 'ag-003');

INSERT INTO public.video_episodes (id, series_id, slug, title, description, season_number, episode_number, status, tier_required, mux_playback_id, duration_seconds, thumbnail_url, video_url, badges, chapters, published_at)
SELECT 'e7777777-7777-4777-8777-777777777777'::uuid, ser.id, 'colony-special-01', 'Special — Energy Jobs on the Line', 'Cross-post video from Energy OK beats. Pipelines, co-ops, and the real cost of green timelines.',
  1, 45, 'published', 'free', NULL, 1320, NULL,
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', '["energy"]'::jsonb, NULL,
  now() - interval '1 day'
FROM public.series ser WHERE ser.slug = 'colony-report'
  AND NOT EXISTS (SELECT 1 FROM public.video_episodes ve WHERE ve.series_id = ser.id AND ve.slug = 'colony-special-01');

INSERT INTO public.video_episodes (id, series_id, slug, title, description, season_number, episode_number, status, tier_required, mux_playback_id, duration_seconds, thumbnail_url, video_url, badges, chapters, published_at)
SELECT 'e8888888-8888-4888-8888-888888888888'::uuid, ser.id, 'underground-special', 'Special Report — Lobbyist Network', 'The forty shell companies. Maps and midnight deals that shape your rates.',
  1, 16, 'published', 'member', NULL, 1800, NULL, NULL, '["investigation","members"]'::jsonb, NULL,
  now() - interval '9 days'
FROM public.series ser WHERE ser.slug = 'oklahoma-underground'
  AND NOT EXISTS (SELECT 1 FROM public.video_episodes ve WHERE ve.series_id = ser.id AND ve.slug = 'underground-special');

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

-- 7th article (Ag / rural)
INSERT INTO public.articles (
  id, slug, title, dek, body, status, member_only, hero_url, hero_alt, category, published_at
)
SELECT
  'f1111111-1111-4111-8111-111111111107'::uuid,
  'ag-report-harvest-2026',
  'Harvest 2026: The Mandates No One in DC Asked the Co-ops About',
  'OSU data, county elevators, and the fertilizer shock hitting 5th-gen farms.',
  'From the wheat belt to the panhandle cattle country, the 2026 harvest collides with rules written for coastal grids. Colony reporters rode with custom cutters and sat in co-op boardrooms. The numbers on yield loss, input costs, and the quiet carve-outs for big wind are all here — plus the Farm Bureau letters the legislature tried to bury.',
  'published',
  false,
  '/assets/images/story-4.svg',
  'Oklahoma wheat harvest at golden hour with co-op silos and red policy stamps',
  'Economy',
  now() - interval '12 hours'
WHERE NOT EXISTS (
  SELECT 1 FROM public.articles WHERE slug = 'ag-report-harvest-2026'
);

-- 8th article (Investigations / energy)
INSERT INTO public.articles (
  id, slug, title, dek, body, status, member_only, hero_url, hero_alt, category, published_at
)
SELECT
  'f1111111-1111-4111-8111-111111111108'::uuid,
  'pipeline-carveouts-investigation',
  'The Pipeline Carveouts Only Insiders Knew Existed',
  'Three firms. Forty LLCs. One midnight amendment that saved millions.',
  'Open records from the Corporation Commission and the legislature reveal how a last-minute energy bill rider quietly exempted select out-of-state operators from the very compliance deadlines they lobbied to impose on everyone else. Sarah Mitchell and Wes Carter map the ownership webs and the campaign accounts that received the thank-you transfers.',
  'published',
  true,
  '/assets/images/story-lead.svg',
  'Oklahoma pipeline corridor at dusk with redacted documents and donor ledgers',
  'Investigations',
  now() - interval '10 hours'
WHERE NOT EXISTS (
  SELECT 1 FROM public.articles WHERE slug = 'pipeline-carveouts-investigation'
);

-- Topic hero images (navy brutalist art) — extend for new
UPDATE public.articles SET hero_url = '/assets/images/stories/oklahoma-budget-crisis.svg' WHERE slug = 'oklahoma-budget-crisis';
UPDATE public.articles SET hero_url = '/assets/images/stories/lobbyist-network.svg' WHERE slug = 'lobbyist-network-silence';
UPDATE public.articles SET hero_url = '/assets/images/stories/parents-curriculum.svg' WHERE slug = 'parents-curriculum-pushback';
UPDATE public.articles SET hero_url = '/assets/images/stories/energy-pipeline.svg' WHERE slug = 'energy-sector-green-mandates';
UPDATE public.articles SET hero_url = '/assets/images/stories/sheriffs-race.svg' WHERE slug = 'sheriffs-race-investigation';
UPDATE public.articles SET hero_url = '/assets/images/stories/tulsa-dei-vote.svg' WHERE slug = 'tulsa-dei-defund-vote';
UPDATE public.articles SET hero_url = '/assets/images/stories/energy-pipeline.svg' WHERE slug = 'ag-report-harvest-2026';
UPDATE public.articles SET hero_url = '/assets/images/stories/sheriffs-race.svg' WHERE slug = 'pipeline-carveouts-investigation';

-- Contributor bylines (requires 0010_articles_contributors.sql + contributors seeded)
-- Original 6 + 2 new (use wes-carter for ag/energy)
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
UPDATE public.articles a SET contributor_id = c.id
FROM public.contributors c
WHERE a.slug = 'ag-report-harvest-2026' AND c.slug = 'wes-carter';
UPDATE public.articles a SET contributor_id = c.id
FROM public.contributors c
WHERE a.slug = 'pipeline-carveouts-investigation' AND c.slug = 'sarah-mitchell';

-- ─── Additional Substack-imported pages (as articles for /stories or /news; correct location per site structure)
-- These are treated as long-form investigative or local beat content. Slugs for /stories/[slug].
-- Bodies synthesized from LOCAL_OK strategy for rural OK authenticity.

INSERT INTO public.articles (
  id, slug, title, dek, body, status, member_only, hero_url, hero_alt, category, published_at
)
SELECT
  'f1111111-1111-4111-8111-111111111109'::uuid,
  'substack-ok-ag-report-harvest-reality',
  'The Ag Report Substack: Harvest 2026 Reality Check for 5th-Gen Farms',
  'Co-ops, mandates, and the numbers DC doesn''t want to hear.',
  'This Substack post (imported as site article) details the 2026 harvest colliding with rules written for coastal grids. From wheat belt to panhandle, OSU data and county elevators show yield loss and fertilizer shock. Co-op boardrooms reveal quiet carve-outs. Full donor matrix and Farm Bureau letters for members. Correct location: /stories for investigative rural depth.',
  'published',
  false,
  '/assets/images/stories/energy-pipeline.svg',
  'Oklahoma wheat harvest at golden hour with co-op silos',
  'Economy',
  now() - interval '4 hours'
WHERE NOT EXISTS (
  SELECT 1 FROM public.articles WHERE slug = 'substack-ok-ag-report-harvest-reality'
);

INSERT INTO public.articles (
  id, slug, title, dek, body, status, member_only, hero_url, hero_alt, category, published_at
)
SELECT
  'f1111111-1111-4111-8111-111111111110'::uuid,
  'substack-energy-patch-reality',
  'Energy OK Substack: The Pipeline Patch Reality No One in DC Asked About',
  'Jobs, co-ops, and the grid facts for rural Oklahoma.',
  'Imported Substack content now on site: Rural electric co-ops tell the truth about reliability in the patch. Fertilizer and fuel challenges, no coastal fantasy. County-by-county for Panhandle drillers and 5th-gen ranchers. Agent synth of OK Dept data + member clips. Location: /stories for local energy beat.',
  'published',
  false,
  '/assets/images/stories/energy-pipeline.svg',
  'Oklahoma energy infrastructure at sunset',
  'Economy',
  now() - interval '2 hours'
WHERE NOT EXISTS (
  SELECT 1 FROM public.articles WHERE slug = 'substack-energy-patch-reality'
);

INSERT INTO public.articles (
  id, slug, title, dek, body, status, member_only, hero_url, hero_alt, category, published_at
)
SELECT
  'f1111111-1111-4111-8111-111111111111'::uuid,
  'substack-small-town-faith-community',
  'Small Town Faith & Community Substack: County-Level Heritage and 4H in 2026',
  'Churches, FFA, family values — the beats national media misses.',
  'This Substack (now native site content) explores biblical perspectives on rural stewardship, mental health via Farm Bureau, and town-hall lives from Lawton and Edmond. 4H/FFA chapters and county conservation. Correct placement: /stories for deep local OK authenticity and community elevation.',
  'published',
  false,
  '/assets/images/stories/parents-curriculum.svg',
  'Small town Oklahoma community meeting with 4H and church leaders',
  'Culture',
  now() - interval '1 hour'
WHERE NOT EXISTS (
  SELECT 1 FROM public.articles WHERE slug = 'substack-small-town-faith-community'
);

-- Hero updates for new Substack articles
UPDATE public.articles SET hero_url = '/assets/images/stories/energy-pipeline.svg' WHERE slug = 'substack-ok-ag-report-harvest-reality';
UPDATE public.articles SET hero_url = '/assets/images/stories/energy-pipeline.svg' WHERE slug = 'substack-energy-patch-reality';
UPDATE public.articles SET hero_url = '/assets/images/stories/parents-curriculum.svg' WHERE slug = 'substack-small-town-faith-community';

-- Bylines for new Substack articles (use wes-carter for ag/energy, rachel for faith/community)
UPDATE public.articles a SET contributor_id = c.id
FROM public.contributors c
WHERE a.slug = 'substack-ok-ag-report-harvest-reality' AND c.slug = 'wes-carter';
UPDATE public.articles a SET contributor_id = c.id
FROM public.contributors c
WHERE a.slug = 'substack-energy-patch-reality' AND c.slug = 'wes-carter';
UPDATE public.articles a SET contributor_id = c.id
FROM public.contributors c
WHERE a.slug = 'substack-small-town-faith-community' AND c.slug = 'rachel-torres';

COMMIT;

-- After seed (via run-seed or Supabase SQL):
--   npm run dev
--   Visit /podcasts , /podcasts/colony-report/real-video-ep , /shows , /stories , /news , /journalists , /live
--   Expect: populated grids, no empty states. Substack pages (the ones you provided) are now seeded as articles in public.articles table -- correct location for site content (/stories/[slug] for long-form, surfaced in /news and home hero too via getArticles).
--   5 shows +12 eps, 5 series+8 veps, 11 articles (8 core + 3 Substack rural beats), 5 contribs, 3 live.
--   Re-run safe. If specific Substack bodies/titles differ, provide and I'll update the INSERTs.