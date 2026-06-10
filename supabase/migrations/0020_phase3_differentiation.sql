-- Phase 3 differentiation foundations (minimal, non-breaking adds).
-- Gift redemptions, clip moments (transcript-derived auto-clips), clip community signals (upvotes/views), article county polish.

-- Gift codes for redeemGift completion (small win #5).
CREATE TABLE IF NOT EXISTS public.gift_codes (
  code TEXT PRIMARY KEY,
  tier TEXT NOT NULL DEFAULT 'member' CHECK (tier IN ('member', 'founder')),
  max_uses INTEGER NOT NULL DEFAULT 1,
  uses INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gift_codes ENABLE ROW LEVEL SECURITY;
-- Service role only for management; no public policies.

COMMENT ON TABLE public.gift_codes IS 'One-time or limited gift codes that grant membership on redeem (see lib/stripe.ts redeemGift).';

-- Enhance clips for transcript-derived "moment clips" + community (reuses existing table).
ALTER TABLE public.clips
  ADD COLUMN IF NOT EXISTS start_s INTEGER,
  ADD COLUMN IF NOT EXISTS end_s INTEGER,
  ADD COLUMN IF NOT EXISTS source_phrase TEXT,
  ADD COLUMN IF NOT EXISTS upvotes INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS clips_time_range_idx ON public.clips(ep_id, start_s) WHERE start_s IS NOT NULL;
CREATE INDEX IF NOT EXISTS clips_upvotes_idx ON public.clips(upvotes DESC) WHERE approved = true;

COMMENT ON COLUMN public.clips.start_s IS 'For auto-clips from transcript search: start time in parent episode seconds.';
COMMENT ON COLUMN public.clips.source_phrase IS 'The spoken phrase that generated this clip (for search + share).';

-- Article county support (data model hint existed; ensure for local moat #2).
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS county TEXT;

CREATE INDEX IF NOT EXISTS articles_county_idx ON public.articles(county) WHERE county IS NOT NULL;

-- Optional: simple clip_votes for proper upvoting (or use usage_events; this is denormalized count for speed).
-- For full, could add clip_votes table, but upvotes int + increment in API is fine for MVP.

-- Note: transcripts table segments already support timed json; Phase 3 just populates them better from Whisper verbose_json.