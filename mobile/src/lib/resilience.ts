/**
 * Resilience utilities for the mobile 24/7 player.
 *
 * Ported from web's lib/mux-247/resilience.ts.
 * Strategy for error recovery:
 * 1. On player error, classify severity (transient/fatal/offline).
 * 2. If recoverable, exponential backoff with jitter.
 * 3. If maxRetries exceeded, switch to fallback playback ID.
 * 4. If fallback also fails, show branded offline slate.
 */

export function backoffDelay(
  attempt: number,
  baseMs: number = 1000,
  maxMs: number = 30000
): number {
  const cap = Math.min(baseMs * Math.pow(2, attempt), maxMs);
  return Math.random() * cap;
}

export const MAX_RECONNECT_ATTEMPTS = 5;

export type ErrorSeverity = "transient" | "fatal" | "offline";

export function classifyPlayerError(error: any): ErrorSeverity {
  if (!error) return "transient";
  const msg = (error.message ?? error.toString?.() ?? "").toLowerCase();
  const code = error.code ?? error.detail ?? "";

  if (msg.includes("network") || msg.includes("offline") || code === "NETWORK_ERROR") {
    return "offline";
  }

  if (
    msg.includes("source") ||
    msg.includes("buffer") ||
    msg.includes("stalled") ||
    msg.includes("waiting") ||
    msg.includes("timeout") ||
    code === "SOURCE_ERROR" ||
    code === "BUFFER_ERROR"
  ) {
    return "transient";
  }

  if (
    msg.includes("not found") ||
    msg.includes("forbidden") ||
    msg.includes("cors") ||
    msg.includes("drm") ||
    msg.includes("license") ||
    code === "MEDIA_ERROR" ||
    code === "DRM_ERROR"
  ) {
    return "fatal";
  }

  return "fatal";
}

export interface RetryState {
  attempt: number;
  lastError: string | null;
  isRecovering: boolean;
}

export function createRetryState(): RetryState {
  return { attempt: 0, lastError: null, isRecovering: false };
}

export function nextRetryDelay(state: RetryState): number {
  return backoffDelay(state.attempt);
}

export async function checkSupabaseHealth(): Promise<boolean> {
  try {
    const { supabase } = await import("./supabase");
    const { error } = await supabase
      .from("player_configs")
      .select("id")
      .limit(1)
      .maybeSingle();
    return !error;
  } catch {
    return false;
  }
}