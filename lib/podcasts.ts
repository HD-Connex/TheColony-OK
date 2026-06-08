// Podcast read helpers for surfaces that need show + episode-count rollups
// (e.g. the homepage network preview). Anon client, RLS-limited to active shows.
import { supabasePublic } from "./supabase";

export interface ShowWithCount {
  slug: string;
  title: string;
  host: string;
  cover_url: string | null;
  episodes: number;
}

export interface PodcastRollup {
  shows: ShowWithCount[];
  totalShows: number;
  totalEpisodes: number;
}

export async function getShowsWithEpisodeCounts(limit = 8): Promise<PodcastRollup> {
  const sb = supabasePublic();
  const [{ data: shows }, { data: eps }] = await Promise.all([
    sb.from("shows").select("slug,title,host,cover_url").eq("active", true).order("created_at").limit(limit),
    sb.from("episodes").select("show_slug"),
  ]);

  const counts = new Map<string, number>();
  for (const e of (eps ?? []) as { show_slug: string }[]) {
    counts.set(e.show_slug, (counts.get(e.show_slug) ?? 0) + 1);
  }

  const list: ShowWithCount[] = ((shows ?? []) as Omit<ShowWithCount, "episodes">[]).map((s) => ({
    ...s,
    episodes: counts.get(s.slug) ?? 0,
  }));

  return {
    shows: list,
    totalShows: list.length,
    totalEpisodes: (eps ?? []).length,
  };
}

// --- Added for per-ep pages and EpisodePlayer data-driven (minimal impl for deploy/test) ---
import type { Episode } from "./supabase";

export interface PlayableEpisode {
  id: string;
  title: string;
  episode_no: number | null;
  pub_date: string;
  duration_s: number | null;
  audio_url: string | null;
  video_url?: string | null;
  mux_playback_id?: string | null;
  thumbnail_url?: string | null;
  chapters?: Array<{ t: number; label: string }> | null;
}

export async function getEpisodesByShowSlug(slug: string): Promise<Episode[]> {
  const sb = supabasePublic();
  const { data } = await sb.from("episodes").select("*").eq("show_slug", slug).order("pub_date", { ascending: false });
  return (data ?? []) as Episode[];
}

export async function getEpisodeByShowAndEp(slug: string, ep: string): Promise<Episode | null> {
  const sb = supabasePublic();
  let { data } = await sb.from("episodes").select("*").eq("show_slug", slug).eq("slug", ep).maybeSingle();
  if (!data) {
    ({ data } = await sb.from("episodes").select("*").eq("show_slug", slug).eq("id", ep).maybeSingle());
  }
  return (data as Episode) ?? null;
}

export async function getSiblingEpisodes(slug: string, currentId: string): Promise<Episode[]> {
  return getEpisodesByShowSlug(slug);
}

export function episodeToPlayable(ep: Episode): PlayableEpisode {
  return {
    id: ep.id,
    title: ep.title,
    episode_no: ep.episode_no,
    pub_date: ep.pub_date,
    duration_s: ep.duration_s,
    audio_url: ep.audio_url,
    video_url: ep.video_url,
    mux_playback_id: ep.mux_playback_id,
    thumbnail_url: ep.thumbnail_url,
    chapters: ep.chapters,
  };
}
