-- Member features: watchlist + offline downloads (ported from TheColony watchlist / downloads).
-- watchlist.series_id → public.series; downloads.episode_id is a global UUID (video_episodes or podcast episodes).

CREATE TABLE IF NOT EXISTS public.watchlist (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, series_id)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_user ON public.watchlist(user_id, created_at DESC);

ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "watchlist_select_own" ON public.watchlist;
CREATE POLICY "watchlist_select_own" ON public.watchlist
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "watchlist_insert_own" ON public.watchlist;
CREATE POLICY "watchlist_insert_own" ON public.watchlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "watchlist_delete_own" ON public.watchlist;
CREATE POLICY "watchlist_delete_own" ON public.watchlist
  FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE public.watchlist IS
  'Per-user saved shows (series). Toggled via /api/watchlist and WatchlistButton.';

CREATE TABLE IF NOT EXISTS public.downloads (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  episode_id UUID NOT NULL,
  bytes INTEGER,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, episode_id)
);

CREATE INDEX IF NOT EXISTS idx_downloads_user ON public.downloads(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_downloads_expires ON public.downloads(expires_at)
  WHERE expires_at IS NOT NULL;

ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "downloads_select_own" ON public.downloads;
CREATE POLICY "downloads_select_own" ON public.downloads
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "downloads_insert_own" ON public.downloads;
CREATE POLICY "downloads_insert_own" ON public.downloads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "downloads_update_own" ON public.downloads;
CREATE POLICY "downloads_update_own" ON public.downloads
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "downloads_delete_own" ON public.downloads;
CREATE POLICY "downloads_delete_own" ON public.downloads
  FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE public.downloads IS
  'Per-user offline download records. episode_id may reference video_episodes.id or podcast episodes.id.';
