-- 0029_content_rls.sql
-- Phase 3 RLS parity for content tables + member insert on threaded_comments.
-- Episodes (podcast): enable + public read (all current eps are public/published per model; no status col unlike video_episodes).
-- Series + video_episodes: idempotent re-assertion of existing policies (from 0007) for parity.
-- Threaded_comments: add strict member-only INSERT (using members.is_member pattern from 0022); retain owner for mods, public approved select (0018).
-- Defense-in-depth: API routes (e.g. /api/comments) use supabaseAdmin (bypasses RLS) after app-level isActiveMember check; RLS catches direct client inserts or future changes.
-- No writes for regular members on catalog tables (series etc); service role only (admin/ingest).

-- 1. Podcast episodes (public reads; writes service-only)
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "episodes_public_read" ON public.episodes;
CREATE POLICY "episodes_public_read" ON public.episodes
  FOR SELECT USING (true);

-- 2. Video catalog parity (idempotent; published only for public)
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_episodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "series_public_read" ON public.series;
CREATE POLICY "series_public_read" ON public.series
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "video_episodes_public_read" ON public.video_episodes;
CREATE POLICY "video_episodes_public_read" ON public.video_episodes
  FOR SELECT USING (status = 'published');

-- 3. Threaded comments: member-gated inserts
-- Drop broad owner-all (which previously allowed any authed user to insert as self) and split for clarity.
-- Insert now requires active member.
DROP POLICY IF EXISTS "comments_owner_all" ON public.threaded_comments;
DROP POLICY IF EXISTS "comments_member_insert" ON public.threaded_comments;

CREATE POLICY "comments_owner_update" ON public.threaded_comments
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_owner_delete" ON public.threaded_comments
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "comments_member_insert" ON public.threaded_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.members
      WHERE user_id = auth.uid() AND is_member = true
    )
  );

-- Public select approved remains from 0018 ("comments_public_read_approved").
-- Owner reads covered by public approved (or could add explicit but unnecessary).

COMMENT ON TABLE public.episodes IS 'Podcast episodes (ingested). RLS public SELECT parity (Phase 3); writes via service role only (rss-ingest, admin).';
COMMENT ON TABLE public.series IS 'Video series catalog. RLS public SELECT published (idempotent parity).';
COMMENT ON TABLE public.video_episodes IS 'Video episodes. RLS public SELECT published (idempotent parity).';
COMMENT ON TABLE public.threaded_comments IS 'Threaded comments. Member INSERT only (RLS + app check); owner mod; public approved reads.';

-- Apply via scripts/apply-migrations.mjs or supabase migration up after prior (0028).
