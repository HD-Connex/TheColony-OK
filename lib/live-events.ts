// Live TV / events queries (streaming `live_events`), read via the anon client.
import { supabasePublic } from "./supabase";
import { resolveVideo, tierLocked, tierLabel, type Playback } from "./series";

export interface LiveEvent {
  id: string;
  series_id: string | null;
  title: string;
  description: string | null;
  status: string; // idle | preview | live | ended
  scheduled_start: string | null;
  actual_start: string | null;
  ended_at: string | null;
  mux_playback_id: string | null;
  video_url: string | null;
  tier_required: string;
}

const COLS =
  "id,series_id,title,description,status,scheduled_start,actual_start,ended_at,mux_playback_id,video_url,tier_required";

export interface LiveBundle {
  live: LiveEvent[];
  upcoming: LiveEvent[];
  replays: LiveEvent[];
}

export async function getLiveEvents(): Promise<LiveBundle> {
  const { data } = await supabasePublic().from("live_events").select(COLS).order("scheduled_start", { ascending: true });
  const all = (data as LiveEvent[]) ?? [];
  return {
    live: all.filter((e) => e.status === "live"),
    upcoming: all
      .filter((e) => e.status === "idle" || e.status === "preview")
      .sort((a, b) => (a.scheduled_start ?? "").localeCompare(b.scheduled_start ?? "")),
    replays: all
      .filter((e) => e.status === "ended")
      .sort((a, b) => (b.ended_at ?? b.scheduled_start ?? "").localeCompare(a.ended_at ?? a.scheduled_start ?? "")),
  };
}

export function playbackFor(e: LiveEvent): Playback {
  return resolveVideo({ video_url: e.video_url, mux_playback_id: e.mux_playback_id });
}

export const LIVE_COLS = COLS;

/** Pure bundler so client components can process rows from realtime or direct queries without duplicating filter/sort logic. */
export function bundleFromRows(rows: LiveEvent[] | null | undefined): LiveBundle {
  const all = rows ?? [];
  return {
    live: all.filter((e) => e.status === "live"),
    upcoming: all
      .filter((e) => e.status === "idle" || e.status === "preview")
      .sort((a, b) => (a.scheduled_start ?? "").localeCompare(b.scheduled_start ?? "")),
    replays: all
      .filter((e) => e.status === "ended")
      .sort((a, b) => (b.ended_at ?? b.scheduled_start ?? "").localeCompare(a.ended_at ?? a.scheduled_start ?? "")),
  };
}

/** Client-callable wrapper (re-uses the query; anon key is public and inlined at build for browser bundles). */
export async function getLiveEventsClient(): Promise<LiveBundle> {
  return getLiveEvents();
}

export { tierLocked, tierLabel };
