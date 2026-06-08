/**
 * Layer 1 Perfection: 24/7 "Colony Live" channel proposal + stub.
 * 
 * Goal: Persistent always-on linear channel (like Blaze 24/7) as default when no scheduled live_event.
 * - Fallback stream (Mux or self-hosted HLS loop of best-of / scheduled wheel).
 * - Scheduled programming wheel (JSON or DB table live_schedule).
 * - Auto fallback in LiveStage / home live block / global bar.
 * - Health: ping endpoint or Mux status for "LIVE" badge reliability.
 * 
 * Integration: LiveStage uses getCurrentLiveChannel() to decide between event or 24/7.
 * Home: always show "LIVE" block pointing to /live or embed 24/7 player.
 * SEO/JsonLd: LiveEvent or BroadcastEvent for the channel.
 * 
 * Perf: cache schedule, low-latency HLS config (see player perfection).
 * Errors: fallback to OFF AIR slate with CTA to schedule or VOD.
 * 
 * Competitive edge: hyper-local OK 24/7 (morning brief, field reports loop, evening analysis) + instant replays > national only.
 */

export interface Live247Channel {
  id: 'colony-247';
  title: string;
  streamUrl: string; // HLS or Mux playback for the 24/7 feed (loop or dedicated ingest)
  isLive: boolean;
  currentProgram?: {
    title: string;
    start: string;
    end: string;
    description?: string;
  };
  schedule: Array<{ time: string; title: string; durationMin: number }>; // simple wheel
  fallbackSlate: string; // url to static OFF AIR image or video loop
}

/** Stub config - move to DB/env or admin editable in prod */
export const COLONY_247: Live247Channel = {
  id: 'colony-247',
  title: 'The Colony 24/7',
  streamUrl: process.env.NEXT_PUBLIC_247_HLS_URL || 'https://stream.mux.com/247-placeholder.m3u8', // TODO: real persistent ingest or VOD wheel
  isLive: true, // assume always (monitor in real)
  schedule: [
    { time: '00:00', title: 'Overnight Field Reports (loop)', durationMin: 360 },
    { time: '06:00', title: 'Morning Brief - OKC & Rural', durationMin: 60 },
    { time: '07:00', title: 'The Colony Report Replay', durationMin: 120 },
    // ... full 24h wheel; admin UI later
  ],
  fallbackSlate: '/assets/images/off-air.png',
};

export async function getCurrentLiveChannel(): Promise<Live247Channel> {
  // In real: 
  // 1. Check active live_events (prioritize scheduled now)
  // 2. If none or ended, return 247 channel + compute currentProgram from schedule + now
  // 3. Health check stream (HEAD or Mux API) -> isLive
  // For stub: always return 247 as fallback proposal
  return COLONY_247;
}

// TODO Layer1: cron or edge function to rotate wheel, trigger Mux asset for "instant replay" clips from 247
// TODO: integrate to EpisodePlayer/LiveStage as default source when no event
// TODO: 0004+ schema: live_schedule table, live_health_checks
