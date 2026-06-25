-- Watch progress for continue-watching (ported from TheColony watch_progress).
-- episode_id may reference video_episodes.id or podcast episodes.id (UUIDs are global).
-- lib/viewer.ts currently uses localStorage; wire to this table via API when auth is present.

CREATE TABLE IF NOT EXISTS public.watch_progress (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  episode_id UUID NOT NULL,
  position_seconds INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER,
  completed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, episode_id)
);

CREATE INDEX IF NOT EXISTS idx_watch_progress_user_recent
  ON public.watch_progress(user_id, updated_at DESC);

ALTER TABLE public.watch_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "watch_progress_select_own" ON public.watch_progress;
CREATE POLICY "watch_progress_select_own" ON public.watch_progress
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "watch_progress_insert_own" ON public.watch_progress;
CREATE POLICY "watch_progress_insert_own" ON public.watch_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "watch_progress_update_own" ON public.watch_progress;
CREATE POLICY "watch_progress_update_own" ON public.watch_progress
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "watch_progress_delete_own" ON public.watch_progress;
CREATE POLICY "watch_progress_delete_own" ON public.watch_progress
  FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE public.watch_progress IS
  'Per-user playback position for video and podcast episodes. Throttled upserts from VideoPlayer / progress API.';
