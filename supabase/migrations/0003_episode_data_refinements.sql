-- Phase 6 full data model refinements (Step 1+3) -- video/ep fields + per-ep
-- Adds slug for per-ep routes /podcasts/[show-slug]/[ep-slug]
-- Ensures video fields (safe if 0002 run)
-- See plan Phase 6, lib/supabase Episode, per-ep page impl

ALTER TABLE episodes 
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS mux_playback_id TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS chapters JSONB,
  ADD COLUMN IF NOT EXISTS host_name TEXT;

CREATE INDEX IF NOT EXISTS idx_episodes_slug ON episodes(slug) WHERE slug IS NOT NULL;
COMMENT ON COLUMN episodes.chapters IS 'Phase 6 jsonb for EpisodePlayer chapters + seek + per-ep rich UI. Array of {t, label}';
COMMENT ON COLUMN episodes.slug IS 'Phase 6: enables app/podcasts/[slug]/[ep]/page.tsx real dedicated pages with SEO/JsonLd';
-- Note: host_name bridge until full FK migration; see lib/contributors.ts
