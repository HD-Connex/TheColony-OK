// Video catalog queries (streaming `series` + `video_episodes`) read via the
// anon client (RLS exposes only published rows). Playback resolves to an embed
// (YouTube/Rumble/Vimeo) or HLS (Cloudflare/Mux) URL.

import { supabasePublic } from "./supabase";
import { toEmbedSrc, detectProvider } from "./video";
import { tierLocked, tierLabel, isEntitled } from "./tiers";

export interface VideoSeries {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  description: string | null;
  type: string;
  status: string;
  pillar: string | null;
  is_oklahoma: boolean;
  poster_url: string | null;
  hero_url: string | null;
  accent_color: string | null;
  tier_required: string;
  youtube_url: string | null;
  rumble_url: string | null;
  apple_url: string | null;
  spotify_url: string | null;
  sort_weight: number | null;
}

export interface VideoEpisode {
  id: string;
  series_id: string;
  slug: string;
  title: string;
  description: string | null;
  season_number: number | null;
  episode_number: number | null;
  status: string;
  tier_required: string;
  mux_playback_id: string | null;
  duration_seconds: number | null;
  thumbnail_url: string | null;
  video_url: string | null;
  badges: string[] | null;
  published_at: string | null;
}

const SERIES_COLS =
  "id,slug,title,tagline,description,type,status,pillar,is_oklahoma,poster_url,hero_url,accent_color,tier_required,youtube_url,rumble_url,apple_url,spotify_url,sort_weight";

export async function getVideoSeries(): Promise<VideoSeries[]> {
  const { data } = await supabasePublic()
    .from("series")
    .select(SERIES_COLS)
    .eq("status", "published")
    .order("sort_weight", { ascending: true })
    .order("title");
  return (data as VideoSeries[]) ?? [];
}

export async function getVideoSeriesBySlug(slug: string): Promise<VideoSeries | null> {
  const { data } = await supabasePublic()
    .from("series")
    .select(SERIES_COLS)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return (data as VideoSeries) ?? null;
}

export async function getSeriesEpisodes(seriesId: string): Promise<VideoEpisode[]> {
  const { data } = await supabasePublic()
    .from("video_episodes")
    .select("*")
    .eq("series_id", seriesId)
    .eq("status", "published")
    .order("season_number", { ascending: true })
    .order("episode_number", { ascending: true });
  return (data as VideoEpisode[]) ?? [];
}

export async function getPublishedSeriesSlugs(): Promise<string[]> {
  const { data } = await supabasePublic().from("series").select("slug").eq("status", "published");
  return (data ?? []).map((r: { slug: string }) => r.slug);
}

export async function getVideoEpisodeBySeriesAndSlug(
  seriesSlug: string,
  epSlug: string,
): Promise<{ series: VideoSeries; episode: VideoEpisode } | null> {
  const series = await getVideoSeriesBySlug(seriesSlug);
  if (!series) return null;

  const sb = supabasePublic();
  let { data } = await sb
    .from("video_episodes")
    .select("*")
    .eq("series_id", series.id)
    .eq("slug", epSlug)
    .eq("status", "published")
    .maybeSingle();

  if (!data) {
    ({ data } = await sb
      .from("video_episodes")
      .select("*")
      .eq("series_id", series.id)
      .eq("id", epSlug)
      .eq("status", "published")
      .maybeSingle());
  }

  if (!data) return null;
  return { series, episode: data as VideoEpisode };
}

/** Previous and next published episodes in series order. */
export async function getSiblingVideoEpisodes(
  seriesId: string,
  currentId: string,
): Promise<[VideoEpisode | null, VideoEpisode | null]> {
  const all = await getSeriesEpisodes(seriesId);
  const idx = all.findIndex((e) => e.id === currentId);
  if (idx < 0) return [null, null];
  return [idx > 0 ? all[idx - 1] : null, idx < all.length - 1 ? all[idx + 1] : null];
}

// ─── Playback + gating helpers ───
export interface Playback {
  kind: "embed" | "hls" | "none";
  src: string | null;
}

export function resolveVideo(ep: Pick<VideoEpisode, "video_url" | "mux_playback_id">): Playback {
  if (ep.video_url) {
    if (toEmbedSrc(ep.video_url)) return { kind: "embed", src: ep.video_url };
    const p = detectProvider(ep.video_url);
    if (p === "hls" || p === "file") return { kind: "hls", src: ep.video_url };
    return { kind: "embed", src: ep.video_url }; // VideoEmbed renders a fallback link
  }
  if (ep.mux_playback_id) return { kind: "hls", src: `https://stream.mux.com/${ep.mux_playback_id}.m3u8` };
  return { kind: "none", src: null };
}

// Gating helpers live in lib/tiers.ts (free < member); re-exported here so the
// existing `@/lib/series` import sites keep working.
export { tierLocked, tierLabel, isEntitled };
