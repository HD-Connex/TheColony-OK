import { z } from "zod";

// ─── Re-export Database types matching web's public schema ───
// Ported from lib/mux-247/types.ts in web platform.
// Ensures mobile reads the exact same Supabase data shapes.

export const MuxAssetSchema = z.object({
  id: z.string(),
  asset_id: z.string(),
  playback_id: z.string().nullable(),
  status: z.string(),
  duration: z.number().nullable(),
  max_stored_resolution: z.string().nullable(),
  max_stored_frame_rate: z.number().nullable(),
  aspect_ratio: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  mp4_support: z.string().nullable(),
  master_access: z.string().nullable(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  custom_thumbnail_url: z.string().nullable(),
  is_premium: z.boolean(),
  fallback_playback_id: z.string().nullable(),
  enrichment_data: z.unknown().nullable(),
});
export type MuxAsset = z.infer<typeof MuxAssetSchema>;

export const ProgramSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().nullable(),
  playback_id: z.string().min(1),
  duration_seconds: z.number().nullable(),
  thumbnail_url: z.string().nullable(),
  category: z.string(),
  is_premium: z.boolean(),
  fallback_playback_id: z.string().nullable(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  tags: z.array(z.string()),
  custom_metadata: z.record(z.unknown()),
});
export type Program = z.infer<typeof ProgramSchema>;

export const ScheduleEntrySchema = z.object({
  id: z.string().uuid(),
  program_id: z.string().uuid(),
  position: z.number().int(),
  start_time: z.string().nullable(),
  duration_override: z.number().nullable(),
  is_active: z.boolean(),
  is_loop_point: z.boolean(),
  notes: z.string().nullable(),
  created_at: z.string(),
});
export type ScheduleEntry = z.infer<typeof ScheduleEntrySchema>;

export const ScheduleWithProgramSchema = ScheduleEntrySchema.extend({
  program: ProgramSchema.nullable(),
});
export type ScheduleWithProgram = z.infer<typeof ScheduleWithProgramSchema>;

export const CurrentProgramSchema = z.object({
  schedule_id: z.string().uuid(),
  position: z.number().int(),
  start_time: z.string().nullable(),
  is_loop_point: z.boolean(),
  duration_override: z.number().nullable(),
  program_id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  playback_id: z.string(),
  duration_seconds: z.number().nullable(),
  thumbnail_url: z.string().nullable(),
  category: z.string(),
  is_premium: z.boolean(),
  fallback_playback_id: z.string().nullable(),
  effective_duration: z.number(),
  rn: z.number().int(),
});
export type CurrentProgram = z.infer<typeof CurrentProgramSchema>;

export const UpcomingQueueItemSchema = CurrentProgramSchema.extend({
  total_programs: z.number().int(),
  queue_position: z.number().int(),
});
export type UpcomingQueueItem = z.infer<typeof UpcomingQueueItemSchema>;

export const PlayerConfigSchema = z.object({
  id: z.string().uuid(),
  channel_title: z.string(),
  channel_logo_url: z.string().nullable(),
  default_thumbnail_url: z.string().nullable(),
  global_fallback_playback_id: z.string().nullable(),
  offline_slate_url: z.string().nullable(),
  loop_schedule: z.boolean(),
  crossfade_duration_ms: z.number().int(),
  signed_token_duration: z.string(),
  signing_key_id: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type PlayerConfig = z.infer<typeof PlayerConfigSchema>;

export const PlaybackSessionSchema = z.object({
  id: z.string().uuid(),
  playback_id: z.string(),
  program_id: z.string().uuid().nullable(),
  viewer_id: z.string().uuid().nullable(),
  session_start: z.string(),
  session_end: z.string().nullable(),
  watch_seconds: z.number(),
  avg_bitrate: z.number().nullable(),
  quality_switches: z.number().int(),
  error_count: z.number().int(),
  last_error_code: z.string().nullable(),
  device_type: z.string().nullable(),
  browser: z.string().nullable(),
  country: z.string().nullable(),
  is_live: z.boolean(),
  metadata: z.record(z.unknown()),
});
export type PlaybackSession = z.infer<typeof PlaybackSessionSchema>;

export const PlayerStateSchema = z.enum([
  "loading",
  "playing",
  "paused",
  "buffering",
  "error",
  "offline",
  "ended",
]);
export type PlayerState = z.infer<typeof PlayerStateSchema>;

export const PlayerCommandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("play") }),
  z.object({ type: z.literal("pause") }),
  z.object({ type: z.literal("seek"), time: z.number() }),
  z.object({ type: z.literal("next") }),
  z.object({ type: z.literal("previous") }),
  z.object({ type: z.literal("set_quality"), quality: z.string() }),
  z.object({ type: z.literal("set_volume"), volume: z.number().min(0).max(1) }),
]);
export type PlayerCommand = z.infer<typeof PlayerCommandSchema>;

export interface QueueItem {
  programId: string;
  playbackId: string;
  fallbackPlaybackId: string | null;
  title: string;
  description: string | null;
  duration: number;
  thumbnailUrl: string | null;
  isPremium: boolean;
  category: string;
}

export interface ResilienceMetrics {
  reconnectAttempts: number;
  lastError: string | null;
  lastErrorTime: number | null;
  isOnline: boolean;
  isRecovering: boolean;
}

// ─── Additional types for mobile screens ───

export interface Series {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  pillar: string;
  poster_url: string | null;
  tier_required: string | null;
  episode_count?: number;
}

export interface Episode {
  id: string;
  series_id: string;
  title: string;
  description: string | null;
  duration_seconds: number | null;
  mux_playback_id: string | null;
  video_url: string | null;
  audio_url: string | null;
  thumbnail_url: string | null;
  published_at: string | null;
  is_premium: boolean;
  series_slug?: string;
}

export interface LiveEvent {
  id: string;
  title: string;
  description: string | null;
  status: "idle" | "preview" | "live" | "ended";
  mux_playback_id: string | null;
  video_url: string | null;
  start_time: string | null;
  end_time: string | null;
  visibility: string;
  is_featured: boolean;
  thumbnail_url: string | null;
  tags: string[];
}

export interface WatchProgress {
  episode_id: string;
  position_seconds: number;
  completed: boolean;
  updated_at: string;
}

// ─── Auth ───

export interface AuthState {
  user: import("@supabase/supabase-js").User | null;
  isMember: boolean;
  isAdmin: boolean;
  loading: boolean;
  initialized: boolean;
  signInWithEmail: (email: string, options?: { redirectTo?: string }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshMembership: () => Promise<void>;
}
