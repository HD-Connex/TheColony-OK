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
// Local Episode shape (avoid stale export from supabase barrel)
type Episode = {
  id: string;
  show_id?: string;
  show_slug: string;
  slug?: string;
  title: string;
  description?: string | null;
  audio_url?: string | null;
  video_url?: string | null;
  mux_playback_id?: string | null;
  thumbnail_url?: string | null;
  chapters?: any;
  host_name?: string | null;
  duration_s?: number | null;
  episode_no?: number | null;
  pub_date?: string;
  guid?: string;
};

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
  chapters?: Array<{ t: number; label: string }>;
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
  const all = await getEpisodesByShowSlug(slug);
  const idx = all.findIndex((e) => e.id === currentId);
  if (idx < 0) return all;
  const siblings: Episode[] = [];
  if (idx > 0) siblings.push(all[idx - 1]);
  if (idx < all.length - 1) siblings.push(all[idx + 1]);
  return siblings;
}

export interface RecentEpisode {
  id: string;
  slug: string;
  title: string;
  show_slug: string;
  show_title: string;
  host: string;
  pub_date: string;
  duration_s: number | null;
  thumbnail_url: string | null;
  cover_url: string | null;
}

/** Latest published episodes across the podcast network (for index rails). */
export async function getRecentEpisodes(limit = 6): Promise<RecentEpisode[]> {
  const sb = supabasePublic();
  const [{ data: episodes }, { data: shows }] = await Promise.all([
    sb
      .from("episodes")
      .select("id,slug,title,show_slug,pub_date,duration_s,thumbnail_url,cover_url")
      .order("pub_date", { ascending: false })
      .limit(limit),
    sb.from("shows").select("slug,title,host").eq("active", true),
  ]);

  const showMap = new Map(
    ((shows ?? []) as { slug: string; title: string; host: string }[]).map((s) => [s.slug, s]),
  );

  return ((episodes ?? []) as Omit<RecentEpisode, "show_title" | "host">[]).map((e) => {
    const show = showMap.get(e.show_slug);
    return {
      ...e,
      show_title: show?.title ?? e.show_slug,
      host: show?.host ?? "",
    };
  });
}

export function episodeToPlayable(ep: Episode): PlayableEpisode {
  return {
    id: ep.id,
    title: ep.title,
    episode_no: (ep.episode_no ?? null) as number | null,
    pub_date: (ep.pub_date ?? '') as string,
    duration_s: (ep.duration_s ?? null) as number | null,
    audio_url: ep.audio_url ?? null,
    video_url: ep.video_url,
    mux_playback_id: ep.mux_playback_id,
    thumbnail_url: ep.thumbnail_url,
    chapters: ep.chapters ?? undefined,
  };
}
