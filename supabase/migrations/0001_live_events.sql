-- Core live_events table (required by 0004 chat/poll FKs and LiveStage realtime)
CREATE TABLE IF NOT EXISTS public.live_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'idle'
    CHECK (status IN ('idle', 'preview', 'live', 'ended')),
  scheduled_start TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  mux_playback_id TEXT,
  video_url TEXT,
  tier_required TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_live_events_status ON public.live_events(status);
CREATE INDEX IF NOT EXISTS idx_live_events_scheduled ON public.live_events(scheduled_start);

ALTER TABLE public.live_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "live_events_public_read" ON public.live_events
  FOR SELECT USING (true);

COMMENT ON TABLE public.live_events IS 'Live TV events: idle → preview → live → ended. Drives /live, homepage embed, Header bar.';