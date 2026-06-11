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

COMMENT ON TABLE public.threaded_comments IS 'Threaded comments on stories/episodes/live/etc. Member-gated write; admin moderation via approved flag + /admin.';

-- 4. Basic members lookup helper – skipped because 'role' column does not exist in public.members.
-- If needed later, adjust index to match actual columns (e.g., is_member, status).

-- 5. Tips / newsletter signups / lead submissions table (idempotent column adds).
-- Ensure table exists, then add missing columns.
CREATE TABLE IF NOT EXISTS public.tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.tips
  ADD COLUMN IF NOT EXISTS kind TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS body TEXT,
  ADD COLUMN IF NOT EXISTS contact TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- For existing rows, set a default 'tip' for kind (nullable originally, then make NOT NULL if desired)
UPDATE public.tips SET kind = 'tip' WHERE kind IS NULL;
ALTER TABLE public.tips ALTER COLUMN kind SET NOT NULL;
-- Add check constraint after column is populated
ALTER TABLE public.tips ADD CONSTRAINT tips_kind_check CHECK (kind IN ('tip', 'newsletter'));

-- Create indexes (idempotent)
CREATE INDEX IF NOT EXISTS tips_kind_created_idx ON public.tips (kind, created_at DESC);
CREATE INDEX IF NOT EXISTS tips_email_idx ON public.tips (email) WHERE email IS NOT NULL;

ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.tips IS 'Anonymous tips + newsletter signups. Body is sanitized on ingest. Ack emails sent via Resend after insert.';

-- 6. Newsletter pipeline (double opt-in + weekly digest) – idempotent.
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS token UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Ensure email is NOT NULL and unique (if added later, set NOT NULL)
ALTER TABLE public.newsletter_subscribers ALTER COLUMN email SET NOT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS newsletter_email_idx ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS newsletter_confirmed_idx ON public.newsletter_subscribers(confirmed_at) WHERE confirmed_at IS NOT NULL AND unsubscribed_at IS NULL;
CREATE INDEX IF NOT EXISTS newsletter_token_idx ON public.newsletter_subscribers(token);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.newsletter_subscribers IS 'Double opt-in newsletter subs. Weekly digest cron sends to confirmed non-unsubbed rows. Token for confirm/unsub actions.';