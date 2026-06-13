import { getArticles, type Article } from "./articles";
import { getShowsWithEpisodeCounts } from "./podcasts";
import { getLiveEvents, eventsToStageItems, type LiveEvent } from "./live-events";
import { getContributors, type Contributor } from "./contributors";
import { getVideoSeries } from "./series"; // assume exists or stub
import { supabasePublic } from "./supabase";

// Simple trending helpers (Phase 1 discovery breadth): exported for reuse in homepage + /watch (and other discovery pages).
// Avoids new lib/trending.ts file per "prefer edit existing" + no-new-files guideline. Data-driven via clips upvotes + recency for stories.
export const getTrendingClips = async (limit = 8) => {
  try {
    const { data } = await supabasePublic()
      .from("clips")
      .select("id, dispatch_type, upvotes, created_at, transcript, source_phrase, storage_path, duration_s, start_s, ep_id, county")
      .eq("approved", true)
      .order("upvotes", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as any[];
  } catch {
    return [] as any[];
  }
};

// Basic trending stories (reuse getArticles + recency + tier weight, for homepage/watch/related reuse).
export async function getTrendingStories(limit = 6): Promise<Article[]> {
  const articles = await getArticles({ limit: Math.max(limit * 2, 12) }).catch(() => []);
  return articles
    .sort((a: any, b: any) => {
      const scoreA = (a.published_at ? new Date(a.published_at).getTime() : 0) + (a.tier_required === 'member' ? 1000 : 0);
      const scoreB = (b.published_at ? new Date(b.published_at).getTime() : 0) + (b.tier_required === 'member' ? 1000 : 0);
      return scoreB - scoreA;
    })
    .slice(0, limit);
}

export interface HomepageBundle {
  topStories: Article[];
  liveNow: any[];
  trendingClips: any[];
  latestEpisodes: any[];
  contributorSpotlight: Contributor[];
  countyPulse: Article[];
  opinionRail: Article[];
  liveItems: any[];
}

export async function getHomepageBundle(viewer?: { counties?: string[] }): Promise<HomepageBundle> {
  const [articles, podcastData, live, contributors] = await Promise.all([
    getArticles({ limit: 12 }),
    getShowsWithEpisodeCounts(6),
    getLiveEvents(),
    getContributors(),
  ]);
  const showsList = podcastData?.shows || [];

  // Top stories: weight recency + assume county or tier
  const topStories = articles
    .sort((a, b) => {
      const scoreA = (a.published_at ? new Date(a.published_at).getTime() : 0) + (a.tier_required === 'member' ? 1000 : 0);
      const scoreB = (b.published_at ? new Date(b.published_at).getTime() : 0) + (b.tier_required === 'member' ? 1000 : 0);
      return scoreB - scoreA;
    })
    .slice(0, 6);

  const liveItems = eventsToStageItems([...live.live, ...live.replays], (e: LiveEvent) => e.status === 'live' ? 'LIVE NOW' : '');

  // Data-driven clips (now real query; falls back gracefully)
  const trendingClips = (await getTrendingClips(8).catch(() => [])) || [];

  // Latest episodes from shows
  const latestEpisodes = showsList.reduce((acc: any[], s: any) => acc.concat(s.episodes || []), []).slice(0, 6);

  // Contributor spotlight
  const contributorSpotlight = contributors;

  // County pulse: filter or recent
  const countyPulse = articles.filter((a: any) => a.county).slice(0, 4);

  // Opinion: filter by kind if present, else recent opinion-like
  const opinionRail = articles.filter((a: any) => (a as any).kind === 'opinion' || a.category?.toLowerCase().includes('opinion')).slice(0, 4) || articles.slice(4, 8);

  return {
    topStories,
    liveNow: live.live,
    trendingClips,
    latestEpisodes,
    contributorSpotlight,
    countyPulse,
    opinionRail,
    liveItems,
  };
}
