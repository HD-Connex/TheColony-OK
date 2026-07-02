/**
 * 24/7 "Colony Live" channel — persistent fallback when no scheduled
 * live_event is active. Stream source resolves from env config only.
 *
 * Featured YouTube video as the permanent 24/7 fallback until real Mux ingest.
 * Default source is COLONY_247_YOUTUBE_URL, which VideoEmbed + toEmbedSrc turn
 * into an embeddable continuous YouTube player (muted autoplay; click to unmute).
 *
 * Source priority:
 *   1. NEXT_PUBLIC_247_HLS_URL          — direct HLS manifest (real 24/7)
 *   2. NEXT_PUBLIC_MUX_247_PLAYBACK_ID  — Mux playback id (built to HLS URL; real 24/7)
 *   3. NEXT_PUBLIC_247_YOUTUBE_URL      — YouTube embed override
 *   4. NEXT_PUBLIC_247_MP4_URL          — direct MP4 loop (legacy)
 *   DEFAULT (no env): COLONY_247_YOUTUBE_URL — featured YouTube video (permanent)
 *
 * When no source the channel reports streamUrl: null and player shows honest "Off Air".
 * isLive remains true for the 24/7 channel state.
 */

import { getLiveEvents } from "./live-events";
import { STOCK } from "./media-map";

/**
 * Featured 24/7 source — a muted-autoplay YouTube video. This is the default
 * "Colony Live" stream shown on the homepage featured band, the /live page, and
 * anywhere the 24/7 channel plays. VideoEmbed + toEmbedSrc turn it into a
 * continuous youtube-nocookie embed (autoplay=1&mute=1; viewers click to unmute).
 * Override with NEXT_PUBLIC_247_YOUTUBE_URL, or a real HLS/Mux source higher in
 * the priority chain below.
 */
export const COLONY_247_YOUTUBE_URL = "https://youtu.be/5ddYtEMU2NQ";

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
  // Featured YouTube video as the permanent 24/7 fallback until real Mux ingest.
  // Embed-friendly; resolves to a continuous YT iframe via VideoEmbed (muted autoplay).
  // Guarantees the live TV player (LiveStage -> VideoEmbed for YT) always runs the featured stream.
  // Set NEXT_PUBLIC_247_YOUTUBE_URL to override with a specific watch?v= or /live URL.
  return COLONY_247_YOUTUBE_URL;
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
