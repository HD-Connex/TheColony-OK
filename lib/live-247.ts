/**
 * 24/7 "Colony Live" channel — persistent fallback when no scheduled live_event is active.
 * Stream URL: NEXT_PUBLIC_247_HLS_URL (Mux/Cloudflare HLS ingest).
 */

import { getLiveEvents } from "./live-events";
import { JAKE_MERRICK_STREAMS_URL } from "./video";

/** Demo replay loop until Mux 247 ingest is wired. */
export const DEMO_247_MP4 =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

export interface Live247Channel {
  id: "colony-247";
  title: string;
  streamUrl: string;
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

function resolve247StreamUrl(): string {
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
  return JAKE_MERRICK_STREAMS_URL;
}

export const COLONY_247: Live247Channel = {
  id: "colony-247",
  title: "Colony Live · Jake Merrick Streams",
  streamUrl: resolve247StreamUrl(),
  isLive: true,
  schedule: [
    { time: "00:00", title: "Overnight Field Reports (loop)", durationMin: 360 },
    { time: "06:00", title: "Morning Brief — OKC & Rural", durationMin: 60 },
    { time: "07:00", title: "The Colony Report Replay", durationMin: 120 },
  ],
  fallbackSlate: "/assets/images/slates/colony-247-slate.jpg",
};

export async function getCurrentLiveChannel(): Promise<Live247Channel> {
  try {
    const { live } = await getLiveEvents();
    if (live.length > 0) {
      return {
        ...COLONY_247,
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
    streamUrl: resolve247StreamUrl(),
    isLive: true,
  };
}