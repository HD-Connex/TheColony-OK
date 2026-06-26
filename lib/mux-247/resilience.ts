/**
 * Resilience utilities for the 24/7 player.
 *
 * Strategy for error recovery:
 * 1. On MuxPlayer error, check if the error is recoverable (network blip, transient).
 * 2. If recoverable, use exponential backoff with jitter (up to maxRetries).
 * 3. If maxRetries exceeded, switch to fallback playback ID (per-program or global).
 * 4. If fallback also fails, show branded offline slate.
 *
 * Network awareness:
 * - Listen for browser online/offline events.
 * - Periodically ping Supabase to verify backend connectivity.
 * - On reconnect, resume from last known position.
 */

// Exponential backoff with full jitter: random range [0, cap]
export function backoffDelay(attempt: number, baseMs: number = 1000, maxMs: number = 30000): number {
  const cap = Math.min(baseMs * Math.pow(2, attempt), maxMs);
  return Math.random() * cap;
}

// Max reconnect attempts before switching to fallback
export const MAX_RECONNECT_ATTEMPTS = 5;

// Types of player errors and their recoverability
export type ErrorSeverity = "transient" | "fatal" | "offline";

export function classifyMuxError(error: any): ErrorSeverity {
  if (!error) return "transient";
  const msg = (error.message ?? error.toString?.() ?? "").toLowerCase();
  const code = error.code ?? error.detail ?? "";

  // Network/offline — recoverable when connectivity returns
  if (msg.includes("network") || msg.includes("offline") || code === "NETWORK_ERROR") {
    return "offline";
  }

  // Transient playback issues — retry with backoff
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

  // Fatal: invalid playback ID, DRM, CORS, etc. — switch to fallback immediately
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

  // Default: assume fatal to be safe
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

// Supabase health check: lightweight query to verify backend is reachable
export async function checkSupabaseHealth(supabase: any): Promise<boolean> {
  try {
    const { error } = await supabase.from("player_configs").select("id").limit(1).maybeSingle();
    return !error;
  } catch {
    return false;
  }
}

// Browser connectivity: uses navigator.onLine with event listener support
export function createConnectivityMonitor(onChange: (online: boolean) => void) {
  const handler = () => onChange(navigator.onLine);
  window.addEventListener("online", handler);
  window.addEventListener("offline", handler);
  return () => {
    window.removeEventListener("online", handler);
    window.removeEventListener("offline", handler);
  };
}
