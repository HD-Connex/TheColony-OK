-- Video catalog: series + video_episodes (ported from TheColony schema).
-- Podcast RSS content stays in `episodes` / `shows`; this is the Blaze-style video library.
-- lib/series.ts queries these tables via supabasePublic().

CREATE TABLE IF NOT EXISTS public.series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'show'
    CHECK (type IN ('show', 'documentary', 'podcast', 'live_event', 'clip')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  pillar TEXT CHECK (pillar IS NULL OR pillar IN ('truth', 'faith', 'freedom')),
  is_oklahoma BOOLEAN NOT NULL DEFAULT false,
  poster_url TEXT,
  hero_url TEXT,
  accent_color TEXT,
  tier_required TEXT NOT NULL DEFAULT 'free',
  rss_url TEXT,
  apple_url TEXT,
  spotify_url TEXT,
  rumble_url TEXT,
  youtube_url TEXT,
  sort_weight INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_series_type_status ON public.series(type, status);
CREATE INDEX IF NOT EXISTS idx_series_pillar ON public.series(pillar) WHERE pillar IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_series_sort ON public.series(sort_weight, title);

CREATE TABLE IF NOT EXISTS public.video_episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  season_number INTEGER NOT NULL DEFAULT 1,
  episode_number INTEGER,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  tier_required TEXT NOT NULL DEFAULT 'free',
  mux_asset_id TEXT,
  mux_playback_id TEXT,
  mux_playback_policy TEXT DEFAULT 'public',
  duration_seconds INTEGER,
  thumbnail_url TEXT,
  video_url TEXT,
  badges JSONB DEFAULT '[]'::jsonb,
  chapters JSONB,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (series_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_video_episodes_series ON public.video_episodes(series_id);
CREATE INDEX IF NOT EXISTS idx_video_episodes_published ON public.video_episodes(published_at DESC)
  WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_video_episodes_slug ON public.video_episodes(slug) WHERE slug IS NOT NULL;

ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_episodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "series_public_read" ON public.series;
CREATE POLICY "series_public_read" ON public.series
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "video_episodes_public_read" ON public.video_episodes;
CREATE POLICY "video_episodes_public_read" ON public.video_episodes
  FOR SELECT USING (status = 'published');

COMMENT ON TABLE public.series IS
  'Video show catalog (The Patriot Hour, documentaries, etc.). Distinct from podcast `shows` table.';
COMMENT ON TABLE public.video_episodes IS
  'Episodes for video series. Playback via video_url embed/HLS or mux_playback_id.';
