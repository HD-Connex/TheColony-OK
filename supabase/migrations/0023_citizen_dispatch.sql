-- 0023_citizen_dispatch.sql
-- Phase 3 Citizen Dispatch UGC: expands member clips to Rumble-style public member feed.
-- hardened clips pipeline: clip moments via TranscriptClipper (platform-native, pre-cleared auto-approved),
-- upvotes, weekly "top clips" in digest. UGC retention at near-zero editorial cost.
-- dispatch_type distinguishes pre-cleared "citizen_dispatch" (transcript moments) vs member "upload".
-- Elite elements (foil, grain) applied in /clips feed UI.

ALTER TABLE public.clips
  ADD COLUMN IF NOT EXISTS dispatch_type TEXT DEFAULT 'upload';

COMMENT ON COLUMN public.clips.dispatch_type IS 'Dispatch classification: "citizen_dispatch" for pre-cleared transcript-derived moments (auto-approved via /api/clips/moment), "upload" for member-submitted UGC (moderation queue). Enables Rumble-style feed filtering + badges.';

-- Indexes for top clips (high-upvote recent approved for digest + feed "top clips" section).
-- Reuses/enhances existing clips_upvotes_idx from 0020.
CREATE INDEX IF NOT EXISTS clips_top_upvotes_idx ON public.clips(upvotes DESC, created_at DESC) WHERE approved = true;
CREATE INDEX IF NOT EXISTS clips_dispatch_type_idx ON public.clips(dispatch_type) WHERE dispatch_type IS NOT NULL;

-- No RLS change needed: existing "clips_public_approved_read" covers approved dispatches for public view.
-- Owner policy covers member creates. Upvote route is public-increment (no auth gate).