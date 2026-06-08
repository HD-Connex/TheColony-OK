/**
 * 24/7 "Colony Live" channel — persistent fallback when no scheduled live_event is active.
 * Stream URL: NEXT_PUBLIC_247_HLS_URL (Mux/Cloudflare HLS ingest).
 */

import { getLiveEvents } from "./live-events";

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
  return "https://stream.mux.com/247-placeholder.m3u8";
}

export const COLONY_247: Live247Channel = {
  id: "colony-247",
  title: "The Colony 24/7",
  streamUrl: resolve247StreamUrl(),
  isLive: true,
  schedule: [
    { time: "00:00", title: "Overnight Field Reports (loop)", durationMin: 360 },
    { time: "06:00", title: "Morning Brief — OKC & Rural", durationMin: 60 },
    { time: "07:00", title: "The Colony Report Replay", durationMin: 120 },
  ],
  fallbackSlate: "/assets/images/off-air.png",
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