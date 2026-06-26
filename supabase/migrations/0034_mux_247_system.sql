-- 0034_mux_247_system.sql
-- 24/7 broadcast platform: Mux sync schema + programs/schedules + analytics.
-- Run AFTER @mux/supabase init tables (mux.assets, mux.live_streams, mux.uploads, mux.events).
-- If @mux/supabase init was not run, the mux schema tables are created inline below.

-- ── 1. Mux sync schema (mirrors what @mux/supabase init creates) ──
-- Safe to re-run: all CREATEs use IF NOT EXISTS.
CREATE SCHEMA IF NOT EXISTS mux;

CREATE TABLE IF NOT EXISTS mux.assets (
  id            TEXT PRIMARY KEY,
  asset_id      TEXT NOT NULL,
  playback_id   TEXT,
  status        TEXT NOT NULL DEFAULT 'preparing',
  duration      DOUBLE PRECISION,
  max_stored_resolution TEXT,
  max_stored_frame_rate DOUBLE PRECISION,
  aspect_ratio  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  mp4_support   TEXT,
  master_access TEXT,
  -- enrichment fields (populated by webhook Edge Function)
  title         TEXT,
  description   TEXT,
  custom_thumbnail_url TEXT,
  is_premium    BOOLEAN NOT NULL DEFAULT false,
  fallback_playback_id TEXT,
  enrichment_data JSONB
);

CREATE TABLE IF NOT EXISTS mux.live_streams (
  id              TEXT PRIMARY KEY,
  live_stream_id  TEXT NOT NULL,
  playback_id     TEXT,
  status          TEXT NOT NULL DEFAULT 'idle',
  stream_key      TEXT,
  reconnect_window INTEGER,
  latency_mode    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  active_asset_id TEXT,
  -- enrichment
  title           TEXT,
  description     TEXT
);

CREATE TABLE IF NOT EXISTS mux.uploads (
  id          TEXT PRIMARY KEY,
  upload_id   TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'waiting',
  asset_id    TEXT REFERENCES mux.assets(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  cors_origin TEXT,
  url         TEXT
);

CREATE TABLE IF NOT EXISTS mux.events (
  id            BIGSERIAL PRIMARY KEY,
  event_id      TEXT NOT NULL UNIQUE,
  event_type    TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  data          JSONB,
  processed     BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_mux_events_type ON mux.events(event_type);
CREATE INDEX IF NOT EXISTS idx_mux_events_created ON mux.events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mux_assets_status ON mux.assets(status);
CREATE INDEX IF NOT EXISTS idx_mux_live_streams_status ON mux.live_streams(status);

-- ── 2. Application tables ──

-- Programs: metadata for each video program (joins to mux.assets by playback_id)
CREATE TABLE IF NOT EXISTS public.programs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  description       TEXT,
  playback_id       TEXT NOT NULL,                          -- mux.assets.playback_id
  duration_seconds  DOUBLE PRECISION,                       -- known duration; null = compute from mux.assets
  thumbnail_url     TEXT,
  category          TEXT NOT NULL DEFAULT 'general',         -- general, news, documentary, talk, music, bumper
  is_premium        BOOLEAN NOT NULL DEFAULT false,          -- requires signed token
  fallback_playback_id TEXT,                                 -- secondary playback ID if primary fails
  status            TEXT NOT NULL DEFAULT 'active',          -- active, archived, draft
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  tags              TEXT[] DEFAULT '{}',
  custom_metadata   JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_programs_playback_id ON public.programs(playback_id);
CREATE INDEX IF NOT EXISTS idx_programs_status ON public.programs(status);
CREATE INDEX IF NOT EXISTS idx_programs_category ON public.programs(category);

-- Schedules: ordered playlist of programs for the 24/7 channel
CREATE TABLE IF NOT EXISTS public.schedules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  position        INTEGER NOT NULL,                          -- sort order within the playlist
  start_time      TIMESTAMPTZ,                                -- optional wall-clock time (for scheduled breaks)
  duration_override DOUBLE PRECISION,                        -- override program duration for this slot
  is_active       BOOLEAN NOT NULL DEFAULT true,
  is_loop_point   BOOLEAN NOT NULL DEFAULT false,            -- if true, loop restarts here after last program
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schedules_position ON public.schedules(position);
CREATE INDEX IF NOT EXISTS idx_schedules_active ON public.schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_schedules_start_time ON public.schedules(start_time);

-- Player config: global 24/7 channel settings (singleton row)
CREATE TABLE IF NOT EXISTS public.player_configs (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_title           TEXT NOT NULL DEFAULT 'The Colony 24/7',
  channel_logo_url        TEXT,
  default_thumbnail_url   TEXT,
  global_fallback_playback_id TEXT,                          -- last-resort fallback if no programs work
  offline_slate_url       TEXT,
  loop_schedule           BOOLEAN NOT NULL DEFAULT true,     -- wrap around at end of playlist
  crossfade_duration_ms   INTEGER NOT NULL DEFAULT 0,
  signed_token_duration   TEXT NOT NULL DEFAULT '2h',
  signing_key_id          TEXT,                               -- MUX_SIGNING_KEY_ID override
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the default player config
INSERT INTO public.player_configs (channel_title)
SELECT 'The Colony 24/7'
WHERE NOT EXISTS (SELECT 1 FROM public.player_configs LIMIT 1);

-- Playback sessions: rich analytics for each playback session
CREATE TABLE IF NOT EXISTS public.playback_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playback_id       TEXT NOT NULL,
  program_id        UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  viewer_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- nullable for anonymous
  session_start     TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_end       TIMESTAMPTZ,
  watch_seconds     DOUBLE PRECISION NOT NULL DEFAULT 0,
  avg_bitrate       INTEGER,
  quality_switches  INTEGER NOT NULL DEFAULT 0,
  error_count       INTEGER NOT NULL DEFAULT 0,
  last_error_code   TEXT,
  device_type       TEXT,                                      -- mobile, desktop, tablet
  browser           TEXT,
  country           TEXT,
  is_live           BOOLEAN NOT NULL DEFAULT false,
  metadata          JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_playback_sessions_playback_id ON public.playback_sessions(playback_id);
CREATE INDEX IF NOT EXISTS idx_playback_sessions_viewer ON public.playback_sessions(viewer_id);
CREATE INDEX IF NOT EXISTS idx_playback_sessions_start ON public.playback_sessions(session_start DESC);

-- Enable Realtime on the schedule and program tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.programs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_configs;

-- ── 3. Views ──

-- Current program: the active program based on schedule position + wall clock
CREATE OR REPLACE VIEW public.current_program AS
WITH ordered AS (
  SELECT
    s.id AS schedule_id,
    s.position,
    s.start_time,
    s.is_loop_point,
    s.duration_override,
    p.id AS program_id,
    p.title,
    p.description,
    p.playback_id,
    p.duration_seconds,
    p.thumbnail_url,
    p.category,
    p.is_premium,
    p.fallback_playback_id,
    COALESCE(s.duration_override, p.duration_seconds, 0) AS effective_duration,
    ROW_NUMBER() OVER (ORDER BY s.position) AS rn
  FROM public.schedules s
  JOIN public.programs p ON p.id = s.program_id
  WHERE s.is_active = true AND p.status = 'active'
)
SELECT * FROM ordered
WHERE rn = 1;

-- Upcoming queue: the next N programs after the current one
CREATE OR REPLACE VIEW public.upcoming_queue AS
WITH ordered AS (
  SELECT
    s.id AS schedule_id,
    s.position,
    s.start_time,
    s.is_loop_point,
    s.duration_override,
    p.id AS program_id,
    p.title,
    p.description,
    p.playback_id,
    p.duration_seconds,
    p.thumbnail_url,
    p.category,
    p.is_premium,
    p.fallback_playback_id,
    COALESCE(s.duration_override, p.duration_seconds, 0) AS effective_duration,
    ROW_NUMBER() OVER (ORDER BY s.position) AS rn,
    COUNT(*) OVER () AS total_programs
  FROM public.schedules s
  JOIN public.programs p ON p.id = s.program_id
  WHERE s.is_active = true AND p.status = 'active'
)
SELECT *, (rn - 1) AS queue_position FROM ordered
WHERE rn > 1
ORDER BY rn
LIMIT 5;

-- ── 4. RLS Policies ──

-- Programs: public read for active, admin write
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY programs_public_read ON public.programs
  FOR SELECT USING (status = 'active');
CREATE POLICY programs_admin_all ON public.programs
  FOR ALL USING (
    auth.role() = 'service_role' OR
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
  );

-- Schedules: public read for active, admin write
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY schedules_public_read ON public.schedules
  FOR SELECT USING (is_active = true);
CREATE POLICY schedules_admin_all ON public.schedules
  FOR ALL USING (
    auth.role() = 'service_role' OR
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
  );

-- Player configs: public read, admin write
ALTER TABLE public.player_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY player_configs_public_read ON public.player_configs
  FOR SELECT USING (true);
CREATE POLICY player_configs_admin_all ON public.player_configs
  FOR ALL USING (
    auth.role() = 'service_role' OR
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
  );

-- Playback sessions: insert any, read own, admin read all
ALTER TABLE public.playback_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY playback_sessions_insert ON public.playback_sessions
  FOR INSERT WITH CHECK (true);
CREATE POLICY playback_sessions_read_own ON public.playback_sessions
  FOR SELECT USING (
    viewer_id = auth.uid() OR
    viewer_id IS NULL OR
    auth.role() = 'service_role' OR
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
  );

-- mux schema tables: service_role only
ALTER TABLE mux.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY mux_service_role ON mux.assets
  FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE mux.live_streams ENABLE ROW LEVEL SECURITY;
CREATE POLICY mux_ls_service_role ON mux.live_streams
  FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE mux.uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY mux_uploads_service_role ON mux.uploads
  FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE mux.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY mux_events_service_role ON mux.events
  FOR ALL USING (auth.role() = 'service_role');

-- ── 5. Helper functions ──

-- Bump the current program (admin override for "break in")
-- Moves the specified program to position 1 and re-sequences
CREATE OR REPLACE FUNCTION public.bump_program(target_program_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_max INTEGER;
BEGIN
  SELECT COALESCE(MAX(position), 0) + 1 INTO current_max FROM public.schedules WHERE is_active = true;
  UPDATE public.schedules
  SET position = position + 1
  WHERE is_active = true;
  UPDATE public.schedules
  SET position = 1
  WHERE program_id = target_program_id AND is_active = true;
END;
$$;

-- Get the next program in the schedule
CREATE OR REPLACE FUNCTION public.next_program(current_position INTEGER DEFAULT 1)
RETURNS TABLE(
  schedule_id UUID,
  program_id UUID,
  title TEXT,
  playback_id TEXT,
  duration_seconds DOUBLE PRECISION,
  fallback_playback_id TEXT,
  is_premium BOOLEAN,
  position INTEGER
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    p.id,
    p.title,
    p.playback_id,
    COALESCE(s.duration_override, p.duration_seconds, 0),
    p.fallback_playback_id,
    p.is_premium,
    s.position
  FROM public.schedules s
  JOIN public.programs p ON p.id = s.program_id
  WHERE s.is_active = true AND p.status = 'active'
    AND s.position > current_position
  ORDER BY s.position
  LIMIT 1;
END;
$$;
