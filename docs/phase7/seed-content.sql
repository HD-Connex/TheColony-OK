-- seed content for episodes / colony-report sample (dual video ep with chapters) per verified + 0002 + Phase 6 refinements
-- Full video ep + slug for per-ep page testing. Data-driven.
-- Note: Main expanded seed is now in ../supabase/seed-content.sql (includes Substack pages as articles). This is legacy partial.
INSERT INTO episodes 
  (title, slug, show_slug, description, audio_url, video_url, mux_playback_id, thumbnail_url, chapters, host_name, published_at, duration)
VALUES 
  ('The Real Video Episode - OK Investigations', 'real-video-ep', 'colony-report', 
   'Full video + audio mode demo with chapters. First-class video podcast.', 
   'https://example.com/audio-sample.mp3', 
   'https://example.com/video-sample.mp4', 
   null, 
   'https://example.com/thumb.jpg',
   '[{"t": 0, "label": "Cold Open"}, {"t": 45, "label": "The Lead"}, {"t": 180, "label": "Field Report"}, {"t": 420, "label": "Analysis & Close"}]'::jsonb,
   'Jake Merrick',
   now() - interval '1 day',
   1800),
  -- audio only fallback sample
  ('Audio Only Followup', 'audio-followup', 'colony-report', 'Pure audio ep.', 'https://audio2.mp3', null, null, null, null, 'Marcus Webb', now(), 900);
-- Update fixtures/colony-report.xml similarly for parser test (video enclosure + itunes:video)
-- After seed, admin can edit video fields; per-ep at /podcasts/colony-report/real-video-ep loads rich page + player
