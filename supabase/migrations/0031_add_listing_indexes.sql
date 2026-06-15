-- 0031_add_listing_indexes.sql
-- P2-12 (elite-platform): Add missing listing indexes from audit to speed common list/filter+order queries (kill seq scans on hot paths).
-- Idempotent via CREATE INDEX IF NOT EXISTS (safe re-apply; matches pattern in 0003/0007/0008/0009/etc).
-- Considered list queries in lib/* (from recon):
--   - lib/podcasts.ts: getEpisodesByShowSlug (eq show_slug + order pub_date desc), getRecentEpisodes (order pub_date), getShowsWithEpisodeCounts (select show_slug)
--   - lib/articles.ts: getArticles (eq status + order published_at desc), getRelatedArticles, adminList, getCounties...
--   - lib/series.ts: getSeriesEpisodes (eq status + series), getVideo... (status, order published_at in contribs)
--   - lib/contributors.ts: getContributorEpisodes (order pub_date), getContributorVideos (eq status + order published_at)
--   - lib/live-events.ts + ContinueRail.tsx: watch_progress queries (eq user_id + order updated_at)
--   - Also search.ts, rss etc. Composites help filter+sort without full table scan.
-- Note: watch already has idx_watch_progress_user_recent (user_id, updated_at DESC) in 0008; this adds explicit or redundant-safe name.
-- Apply after 0030 via scripts or supabase migration.

CREATE INDEX IF NOT EXISTS idx_episodes_show_slug_pub_date ON public.episodes(show_slug, pub_date DESC);

CREATE INDEX IF NOT EXISTS idx_video_episodes_status_published ON public.video_episodes(status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_status_published ON public.articles(status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_watch_progress_user_updated ON public.watch_progress(user_id, updated_at DESC);

-- Optional: analyze after for planner (not in migration, run manually: ANALYZE public.episodes; etc)
