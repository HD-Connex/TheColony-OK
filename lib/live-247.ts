/**
 * 24/7 "Colony Live" channel — persistent fallback when no scheduled
 * live_event is active. Stream source resolves from env config only:
 * no demo video, no third-party placeholder. When no source is configured
 * the channel reports streamUrl: null and the player renders an honest
 * "Off Air" state.
 *
 * Source priority:
 *   1. NEXT_PUBLIC_247_HLS_URL          — direct HLS manifest
 *   2. NEXT_PUBLIC_MUX_247_PLAYBACK_ID  — Mux playback id (built to HLS URL)
 *   3. NEXT_PUBLIC_247_MP4_URL          — direct MP4 loop
 *   4. NEXT_PUBLIC_247_YOUTUBE_URL      — YouTube embed fallback
 */

import { getLiveEvents } from "./live-events";

export interface Live247Channel {
  id: "colony-247";
  title: string;
  streamUrl: string | null;
  isLive: boolean;
  currentProgram?: {
    title: string;
    start: string;
    end: string;
    description?: string;
  };
  schedule: Array<{ time: string; title: string; durationMin: number }>;
  fallbackSlate: string;
}

function resolve247StreamUrl(): string | null {
  if (process.env.NEXT_PUBLIC_247_HLS_URL) {
    return process.env.NEXT_PUBLIC_247_HLS_URL;
  }
  if (process.env.NEXT_PUBLIC_MUX_247_PLAYBACK_ID) {
    return `https://stream.mux.com/${process.env.NEXT_PUBLIC_MUX_247_PLAYBACK_ID}.m3u8`;
  }
  if (process.env.NEXT_PUBLIC_247_MP4_URL) {
    return process.env.NEXT_PUBLIC_247_MP4_URL;
  }
  if (process.env.NEXT_PUBLIC_247_YOUTUBE_URL) {
    return process.env.NEXT_PUBLIC_247_YOUTUBE_URL;
  }
  return null;
}

export const COLONY_247: Live247Channel = {
  id: "colony-247",
  title: "Colony Live 24/7",
  streamUrl: resolve247StreamUrl(),
  isLive: resolve247StreamUrl() !== null,
  schedule: [
    { time: "00:00", title: "Overnight Field Reports (loop)", durationMin: 360 },
    { time: "06:00", title: "Morning Brief — OKC & Rural", durationMin: 60 },
    { time: "07:00", title: "The Colony Report Replay", durationMin: 120 },
  ],
  fallbackSlate: "/assets/images/slates/colony-247-slate.jpg",
};

export async function getCurrentLiveChannel(): Promise<Live247Channel> {
  const streamUrl = resolve247StreamUrl();

  try {
    const { live } = await getLiveEvents();
    if (live.length > 0) {
      return {
        ...COLONY_247,
        streamUrl,
        isLive: false,
        currentProgram: {
          title: live[0].title,
          start: live[0].actual_start ?? live[0].scheduled_start ?? "",
          end: "",
          description: live[0].description ?? undefined,
        },
      };
    }
  } catch {
    /* build / offline */
  }

  return {
    ...COLONY_247,
    streamUrl,
    isLive: streamUrl !== null,
  };
}
