// Podcast data access stubs for per-ep pages and lists (full impl uses supabase + rss).
import { supabasePublic, type Episode } from './supabase';

export interface PlayableEpisode { id: string; title: string; episode_no: number | null; pub_date: string; duration_s: number | null; audio_url: string | null; video_url?: string | null; mux_playback_id?: string | null; thumbnail_url?: string | null; chapters?: Array<{t:number; label:string}> | null; }
export function episodeToPlayable(ep: any): PlayableEpisode {
  return {
    id: ep.id, title: ep.title, episode_no: ep.episode_no, pub_date: ep.pub_date || ep.published_at,
    duration_s: ep.duration_s || ep.duration, audio_url: ep.audio_url,
    video_url: ep.video_url, mux_playback_id: ep.mux_playback_id, thumbnail_url: ep.thumbnail_url || ep.cover_url,
    chapters: ep.chapters || null,
  };
}
export async function getEpisodeByShowAndEp(slug: string, ep: string) {
  const sb = supabasePublic();
  const { data } = await sb.from('episodes').select('*').eq('show_slug', slug).or(`slug.eq.${ep},id.eq.${ep}`).maybeSingle();
  return data;
}
export async function getSiblingEpisodes(slug: string, currentId: string) {
  const sb = supabasePublic();
  const { data } = await sb.from('episodes').select('*').eq('show_slug', slug).neq('id', currentId).order('pub_date', { ascending: false }).limit(5);
  return data || [];
}
export async function getEpisodesByShowSlug(slug: string) { return []; }
export async function getShowsWithEpisodeCounts() { return { shows: [], totalShows: 0, totalEpisodes: 0 }; }