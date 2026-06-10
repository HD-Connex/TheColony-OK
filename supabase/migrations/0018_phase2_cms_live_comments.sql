-- Phase 2 parity: Admin CMS foundations, live ingest, comments moderation, articles editorial polish.
-- Run after 0017. Idempotent alters + new tables.

-- 1. Enhance articles for full editorial workflow (status already good; ensure 'review' supported + body_md for clean MD source).
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS body_md TEXT,
  ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- Expand status check to support review workflow (draft → review → scheduled/published).
ALTER TABLE public.articles DROP CONSTRAINT IF EXISTS articles_status_check;
ALTER TABLE public.articles
  ADD CONSTRAINT articles_status_check
  CHECK (status IN ('draft', 'review', 'scheduled', 'published', 'archived'));

-- 2. Live ingest columns on live_events (for real Mux live streams + auto VOD).
ALTER TABLE public.live_events
  ADD COLUMN IF NOT EXISTS mux_live_stream_id TEXT,
  ADD COLUMN IF NOT EXISTS stream_key TEXT,
  ADD COLUMN IF NOT EXISTS mux_asset_id TEXT,
  ADD COLUMN IF NOT EXISTS playback_policy TEXT DEFAULT 'public';

CREATE INDEX IF NOT EXISTS idx_live_events_mux_live ON public.live_events(mux_live_stream_id) WHERE mux_live_stream_id IS NOT NULL;

COMMENT ON COLUMN public.live_events.mux_live_stream_id IS 'Mux live stream id from createLiveStream() — used for webhooks + stream key display (admin only).';
COMMENT ON COLUMN public.live_events.stream_key IS 'RTMP ingest key (admin only; never public).';

-- 3. Threaded comments moderation (approved flag + admin actions).
ALTER TABLE public.threaded_comments
  ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS threaded_comments_approved_idx ON public.threaded_comments(approved) WHERE approved = false;

-- Update public read policy to only approved (tighten previous loose policy).
DROP POLICY IF EXISTS "comments_public_read" ON public.threaded_comments;
CREATE POLICY "comments_public_read_approved" ON public.threaded_comments
  FOR SELECT USING (approved = true);

-- Owner can still insert (pending approval if we set default false in future UI).
-- Admin/service can update approved + delete via server (requireAdmin).

COMMENT ON TABLE public.threaded_comments IS 'Threaded comments on stories/episodes/live/etc. Member-gated write; admin moderation via approved flag + /admin.';

-- 4. Basic members lookup helper view/index (for admin members tab; RLS keeps it safe).
CREATE INDEX IF NOT EXISTS members_role_status_idx ON public.members (role, is_member, status);

-- Note: full admin CMS uses supabaseAdmin() (service role) for all writes + privileged reads.
-- Public RLS remains for site surfaces.