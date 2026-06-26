/**
 * 24/7 "Colony Live" channel — persistent fallback when no scheduled
 * live_event is active. Stream source resolves from env config only.
 *
 * Jake Merrick YouTube demo stream as permanent 24/7 fallback until real Mux ingest.
 * Primary demo uses the project's JAKE_MERRICK_CHANNEL_URL (@jakemerrick212)
 * which VideoEmbed + toEmbedSrc turns into an embeddable continuous YouTube player
 * (falls back to JAKE_MERRICK_PLACEHOLDER_VIDEO_ID yEjlzfS4k1s VOD for demo continuity).
 *
 * Source priority:
 *   1. NEXT_PUBLIC_247_HLS_URL          — direct HLS manifest (real 24/7)
 *   2. NEXT_PUBLIC_MUX_247_PLAYBACK_ID  — Mux playback id (built to HLS URL; real 24/7)
 *   3. NEXT_PUBLIC_247_YOUTUBE_URL      — YouTube embed (override for Jake Merrick or other)
 *   4. NEXT_PUBLIC_247_MP4_URL          — direct MP4 loop (legacy)
 *   DEFAULT (no env): JAKE_MERRICK_STREAMS_URL — Jake Merrick YouTube demo stream (permanent)
 *
 * When no source the channel reports streamUrl: null and player shows honest "Off Air".
 * isLive remains true for the 24/7 channel state.
 */

import { getLiveEvents } from "./live-events";
import { STOCK } from "./media-map";
import { JAKE_MERRICK_CHANNEL_URL } from "./video";

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
  if (process.env.NEXT_PUBLIC_247_YOUTUBE_URL) {
    return process.env.NEXT_PUBLIC_247_YOUTUBE_URL;
  }
  if (process.env.NEXT_PUBLIC_247_MP4_URL) {
    return process.env.NEXT_PUBLIC_247_MP4_URL;
  }
  // Jake Merrick YouTube demo stream as permanent 24/7 fallback until real Mux ingest.
  // Uses @jakemerrick212/streams (embed-friendly; resolves to continuous YT iframe via VideoEmbed).
  // Guarantees the live TV player (LiveStage -> VideoEmbed for YT) always runs the Jake Merrick stream.
  // Set NEXT_PUBLIC_247_YOUTUBE_URL to override with a specific watch?v= or /live URL.
  return JAKE_MERRICK_CHANNEL_URL;
}

export const COLONY_247: Live247Channel = {
  id: "colony-247",
  title: "Colony Live 24/7",
  streamUrl: resolve247StreamUrl(),
  isLive: true,
  schedule: [
    { time: "00:00", title: "Overnight Field Reports (loop)", durationMin: 360 },
    { time: "06:00", title: "Morning Brief — OKC & Rural", durationMin: 60 },
    { time: "07:00", title: "The Colony Report Replay (Jake Merrick YouTube demo)", durationMin: 120 },
  ],
  fallbackSlate: STOCK.slateDefault,
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
    isLive: true,
  };
}
