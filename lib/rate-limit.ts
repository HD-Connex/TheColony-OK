// Sliding-window rate limiter. Uses Upstash Redis when configured
// (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN); otherwise an in-process
// Map. The Map fallback is per-instance — fine for dev and low-traffic Fluid
// Compute instances, set up Upstash for real multi-instance enforcement.

interface RateLimitOptions {
  /** Max requests allowed per window. */
  limit: number;
  /** Window length in seconds. */
  windowSec: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  /** Seconds until the window resets (for Retry-After). */
  retryAfterSec: number;
}

// ── In-memory fallback ──
const buckets = new Map<string, { count: number; resetAt: number }>();

function memoryLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowSec * 1000 });
    return { ok: true, remaining: opts.limit - 1, retryAfterSec: opts.windowSec };
  }
  bucket.count += 1;
  const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  if (bucket.count > opts.limit) {
    return { ok: false, remaining: 0, retryAfterSec };
  }
  return { ok: true, remaining: opts.limit - bucket.count, retryAfterSec };
}

// Periodic cleanup so the Map doesn't grow unbounded.
let lastSweep = 0;
function sweep() {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, v] of buckets) {
    if (v.resetAt <= now) buckets.delete(k);
  }
}

// ── Upstash REST (no SDK dependency — two pipelined commands) ──
async function upstashLimit(key: string, opts: RateLimitOptions): Promise<RateLimitResult | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", `rl:${key}`],
        ["EXPIRE", `rl:${key}`, String(opts.windowSec), "NX"],
        ["TTL", `rl:${key}`],
      ]),
      // Don't let a slow Redis stall the request path.
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return null;
    const out = (await res.json()) as Array<{ result: number }>;
    const count = out[0]?.result ?? 0;
    const ttl = out[2]?.result ?? opts.windowSec;
    const retryAfterSec = ttl > 0 ? ttl : opts.windowSec;
    if (count > opts.limit) return { ok: false, remaining: 0, retryAfterSec };
    return { ok: true, remaining: Math.max(0, opts.limit - count), retryAfterSec };
  } catch {
    return null; // fall back to memory on any Redis failure
  }
}

/** Check and consume one request against `key`. */
export async function rateLimit(key: string, opts: RateLimitOptions): Promise<RateLimitResult> {
  sweep();
  const redis = await upstashLimit(key, opts);
  if (redis) return redis;
  return memoryLimit(key, opts);
}

/** Derive a limiter key from a request: IP + route segment. */
export function keyFromRequest(req: Request, scope: string): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return `${scope}:${ip}`;
}

/** Standard 429 response. */
export function tooManyRequests(result: RateLimitResult): Response {
  return new Response(JSON.stringify({ error: "Too many requests" }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(result.retryAfterSec),
    },
  });
}
