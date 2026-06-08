// Stub for live events data (integrates with supabase live_events table + 24/7 fallback).
// Used by /live page and LiveStage.
import { supabasePublic } from './supabase';

export interface LiveEvent {
  id: string;
  title: string;
  status: 'live' | 'upcoming' | 'ended';
  scheduled_start?: string | null;
  actual_start?: string | null;
  ended_at?: string | null;
  mux_playback_id?: string | null;
  description?: string | null;
  tier_required?: string;
}

export async function getLiveEvents() {
  // In real: query supabase
  // For stub / deploy: return empty so LiveStage falls to 24/7
  return { live: [] as LiveEvent[], upcoming: [] as LiveEvent[], replays: [] as LiveEvent[] };
}

export function playbackFor(e: LiveEvent) {
  return { kind: e.mux_playback_id ? 'hls' : 'embed' as const, src: e.mux_playback_id ? `https://stream.mux.com/${e.mux_playback_id}.m3u8` : null };
}
export function tierLocked(tier?: string) { return tier === 'member'; }
export function tierLabel(tier?: string) { return tier || ''; }

export async function getLiveEventsClient() {
  // client version stub
  return { live: [], replays: [] };
}