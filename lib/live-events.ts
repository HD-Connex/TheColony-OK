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
  visibility: 'public' | 'members'; // Phase 2 Off the Record: 'members' = gated live
}

const COLS =
  "id,series_id,title,description,status,scheduled_start,actual_start,ended_at,mux_playback_id,video_url,tier_required,visibility";

export interface LiveBundle {
  live: LiveEvent[];
  upcoming: LiveEvent[];
  replays: LiveEvent[];
}

export async function getLiveEvents(): Promise<LiveBundle> {
  const { data } = await supabasePublic().from("live_events").select(COLS).order("scheduled_start", { ascending: true });
  const all = (data as LiveEvent[]) ?? [];

  const ytEvent = getJakeMerrickYoutubeEvent();

  let live = all.filter((e) => e.status === "live");
  let upcoming = all
    .filter((e) => e.status === "idle" || e.status === "preview")
    .sort((a, b) => (a.scheduled_start ?? "").localeCompare(b.scheduled_start ?? ""));
  const replays = all
    .filter((e) => e.status === "ended")
    .sort((a, b) => (b.ended_at ?? b.scheduled_start ?? "").localeCompare(a.ended_at ?? a.scheduled_start ?? ""));

  // Inject the 7pm EST YouTube stream from Jake Merrick if no real live is scheduled.
  // At 7pm EST the player will use the YouTube live embed as the active stream.
  if (ytEvent.status === "live" && live.length === 0) {
    live = [ytEvent, ...live];
  } else if (!upcoming.some((e) => e.id === ytEvent.id)) {
    upcoming = [ytEvent, ...upcoming].sort((a, b) =>
      (a.scheduled_start ?? "").localeCompare(b.scheduled_start ?? "")
    );
  }

  return { live, upcoming, replays };
}

export function playbackFor(e: LiveEvent): Playback {
  return resolveVideo({ video_url: e.video_url, mux_playback_id: e.mux_playback_id });
}

export const LIVE_COLS = COLS;

/** Pure bundler so client components can process rows from realtime or direct queries without duplicating filter/sort logic. */
export function bundleFromRows(rows: LiveEvent[] | null | undefined): LiveBundle {
  const all = rows ?? [];

  const ytEvent = getJakeMerrickYoutubeEvent();

  let live = all.filter((e) => e.status === "live");
  let upcoming = all
    .filter((e) => e.status === "idle" || e.status === "preview")
    .sort((a, b) => (a.scheduled_start ?? "").localeCompare(b.scheduled_start ?? ""));
  const replays = all
    .filter((e) => e.status === "ended")
    .sort((a, b) => (b.ended_at ?? b.scheduled_start ?? "").localeCompare(a.ended_at ?? a.scheduled_start ?? ""));

  if (ytEvent.status === "live" && live.length === 0) {
    live = [ytEvent, ...live];
  } else if (!upcoming.some((e) => e.id === ytEvent.id)) {
    upcoming = [ytEvent, ...upcoming].sort((a, b) =>
      (a.scheduled_start ?? "").localeCompare(b.scheduled_start ?? "")
    );
  }

  return { live, upcoming, replays };
}

/** Client-callable wrapper (re-uses the query; anon key is public and inlined at build for browser bundles). */
export async function getLiveEventsClient(): Promise<LiveBundle> {
  return getLiveEvents();
}

export { tierLocked, tierLabel };

/** Visibility helper for Off the Record gating (Phase 2) */
export function isMembersOnly(e: LiveEvent | { visibility?: string | null }): boolean {
  return (e as any)?.visibility === 'members';
}

// --- YouTube live stream (Jake Merrick /live src) - soft launch path kept FREE ---
// Per Phase 5 ops: the jake merrick src YT path (jakemerrick212/live) remains free (no paywall) even if date passed.
// The isSoftLaunchTonight() + window logic kept for virtual event injection/scheduling (reversible).
// Player bypass for free is now src-based in LiveStage + live/page (always free for this path).
// No site-wide paywall changes. Guarantee embed path. Defensive fields.
const JAKE_MERRICK_YT_LIVE_URL = "https://www.youtube.com/@jakemerrick212/live";
const SOFT_LAUNCH_DATE = '2026-06-12'; // original soft launch date; isSoftLaunchTonight gates scheduling only; free path kept for src regardless

function isSoftLaunchTonight(): boolean {
  const now = new Date();
  const estNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const today = estNow.toISOString().slice(0, 10);
  return today === SOFT_LAUNCH_DATE;
}

function getNext7pmEST(): string {
  const now = new Date();
  const estNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const target = new Date(estNow);
  target.setHours(19, 0, 0, 0); // 7:00 PM EST
  if (estNow.getTime() > target.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target.toISOString();
}

function isShowTimeWindow(): boolean {
  if (!isSoftLaunchTonight()) return false; // TONIGHT ONLY
  const now = new Date();
  const estNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const hour = estNow.getHours();
  const minute = estNow.getMinutes();
  // 7pm EST window for the show (generous for soft launch)
  return hour === 19 && minute < 150;
}

function getJakeMerrickYoutubeEvent(): LiveEvent {
  const scheduled = getNext7pmEST();
  const isLive = isShowTimeWindow();
  return {
    id: "yt-jake-merrick-7pm-est",
    series_id: null,
    title: "The Colony Report — Live with Jake Merrick",
    description: "Live at 7pm EST on YouTube. Streamed to the platform via embed. FREE soft launch tonight - no paywall.",
    status: isLive ? "live" : "idle",
    scheduled_start: scheduled,
    actual_start: isLive ? scheduled : null,
    ended_at: null,
    mux_playback_id: null,
    video_url: JAKE_MERRICK_YT_LIVE_URL,
    tier_required: "free",
    visibility: "public",
  };
}

// Export for player bypass (tonight only, no site wide)
export { JAKE_MERRICK_YT_LIVE_URL, isSoftLaunchTonight };

/** Map server LiveEvent rows to StageItem props for LiveStage (shared by /live + home). */
export function eventsToStageItems(
  events: LiveEvent[],
  whenLabel: (e: LiveEvent) => string,
): Array<{
  id: string;
  title: string;
  kind: string;
  src: string | null;
  isLive: boolean;
  when: string;
  locked: boolean;
  tierLabel: string;
  visibility?: 'public' | 'members'; // Phase 2: Off the Record gating
}> {
  return events.map((e) => {
    const pb = playbackFor(e);
    return {
      id: e.id,
      title: e.title,
      kind: pb.kind,
      src: pb.src,
      isLive: e.status === "live",
      when: whenLabel(e),
      locked: tierLocked(e.tier_required),
      tierLabel: tierLabel(e.tier_required),
      visibility: e.visibility,
    };
  });
}

/** Client refresh: fetch + bundle + map to StageItems for realtime updates in LiveStage. */
export async function refreshStageItems(
  whenLabel: (e: LiveEvent) => string,
): Promise<ReturnType<typeof eventsToStageItems>> {
  const bundle = await getLiveEventsClient();
  return eventsToStageItems([...bundle.live, ...bundle.replays], whenLabel);
}
