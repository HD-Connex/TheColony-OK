-- 0028: Phase 1 breadth - newsletter multiple lists + contributor follow feature.
-- Adds `lists` text[] (parallel to counties) for daily / county / alerts etc.
-- Creates contributor_follows (per-user follows on contributors; RLS own-only like watchlist).
-- Idempotent patterns (IF NOT EXISTS, DROP POLICY IF EXISTS).
-- Reuse existing subscribe API + watchlist/auth patterns for /api/contributors/follow.
-- Seed functional: UI buttons + stats + prefs visible with existing contributors/newsletter rows.

-- 1) Newsletter lists (expand beyond single county to named lists: daily, county, alerts, etc.)
ALTER TABLE public.newsletter_subscribers ADD COLUMN IF NOT EXISTS lists text[];

CREATE INDEX IF NOT EXISTS newsletter_subscribers_lists_gin ON public.newsletter_subscribers USING GIN (lists);

COMMENT ON COLUMN public.newsletter_subscribers.lists IS 'Phase 1: multiple subscription lists (e.g. ["daily","county","alerts"]). Persisted via /api/newsletter/subscribe + /newsletter/preferences.';

-- 2) Contributor follows (basic follow for masthead / discovery breadth)
CREATE TABLE IF NOT EXISTS public.contributor_follows (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contributor_id UUID NOT NULL REFERENCES public.contributors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, contributor_id)
);

CREATE INDEX IF NOT EXISTS idx_contributor_follows_user ON public.contributor_follows(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contributor_follows_contrib ON public.contributor_follows(contributor_id);

ALTER TABLE public.contributor_follows ENABLE ROW LEVEL SECURITY;

-- Drop for idempotency on re-apply
DROP POLICY IF EXISTS "contributor_follows_select_own" ON public.contributor_follows;
DROP POLICY IF EXISTS "contributor_follows_insert_own" ON public.contributor_follows;
DROP POLICY IF EXISTS "contributor_follows_delete_own" ON public.contributor_follows;

DROP POLICY IF EXISTS "contributor_follows_select_own" ON public.contributor_follows;
CREATE POLICY "contributor_follows_select_own" ON public.contributor_follows
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "contributor_follows_insert_own" ON public.contributor_follows;
CREATE POLICY "contributor_follows_insert_own" ON public.contributor_follows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "contributor_follows_delete_own" ON public.contributor_follows;
CREATE POLICY "contributor_follows_delete_own" ON public.contributor_follows
  FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE public.contributor_follows IS
  'Per-user follows on contributors (masthead). Toggled via /api/contributors/follow + FollowButton. Mirrors watchlist 0015. UI + basic stats/leaderboard in /contributors. Full member feed integration later.';

-- Note: after apply (via scripts/apply-migrations or supabase), existing contributors are followable (id uuid FK).
-- Newsletter lists column allows array storage; GET/POST /api/newsletter/subscribe extended for lists + counties.
