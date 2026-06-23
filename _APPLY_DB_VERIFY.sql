-- The Colony OK — post-apply verification (run in Supabase SQL editor after _APPLY_DB.sql)
-- Expected (per PHASE5_LAUNCH_READINESS seed): series 5, episodes 11, video_episodes 8,
-- articles 11, contributors 5, live_events 3, counties 6.

select 'series'        as table, count(*) from public.series
union all select 'episodes',        count(*) from public.episodes
union all select 'video_episodes',  count(*) from public.video_episodes
union all select 'articles',        count(*) from public.articles
union all select 'contributors',    count(*) from public.contributors
union all select 'live_events',     count(*) from public.live_events
union all select 'counties',        count(*) from public.counties
order by 1;

-- Spot-check: the video-first episode used by /podcasts/colony-report/real-video-ep
select slug, (mux_playback_id is not null or video_url is not null) as has_video
from public.video_episodes
where slug = 'real-video-ep';

-- Spot-check: the two stories that previously RSC-500'd now exist with hero images
select slug, (hero_url is not null) as has_hero, status
from public.articles
where slug in ('oklahoma-budget-crisis','lobbyist-network-silence');

-- Sanity: extensions present (pgvector for 0011_ai_search, pgcrypto)
select extname from pg_extension where extname in ('vector','pgcrypto') order by 1;
