import { createClient, SupabaseClient, type WebSocketLikeConstructor } from "@supabase/supabase-js";
import ws from "ws";

const wsTransport = ws as unknown as WebSocketLikeConstructor;

let admin: SupabaseClient | null = null;
let pub: SupabaseClient | null = null;

/**
 * P5 FIX NOTE (browser client singleton to stop GoTrueClient warnings):
 * The browser (client-component) singleton is now centralized in utils/supabase/client.ts
 * using identical cached pattern to supabasePublic/supabaseAdmin here:
 *   let client = null; if (client) return client; client = ...; return client;
 * - supabaseBrowser() in lib/auth-client.ts now reuses it (thin wrapper).
 * - Direct imports of createClient() from utils/supabase/client in browser pages/components
 *   (my-counties, backroom, ContinueRail, my-feed, newsletter prefs, clips, etc) now also share it.
 * - This eliminates the root cause of "Multiple GoTrueClient instances" (one from auth-client's old direct createClient + one from @supabase/ssr createBrowserClient + ad-hoc calls).
 * - Server-only paths (supabasePublic/Admin, utils/supabase/server createClient per-req, middleware/proxy, api routes) untouched and correct.
 * - LiveChat (and Live* components) now guaranteed singleton via supabaseBrowser -> shared.
 * - See also: utils/supabase/client.ts header for full audit/fix plan + self-verif checklist.
 * (Added per Phase 8 side-quest instructions; no behavior change for pub/admin.)
 */

/**
 * Admin (service role) client — bypasses RLS for writes, crons, admin APIs, seed.
 * Throws if credentials missing (callers should only use in privileged contexts).
 * Cached singleton.
 *
 * Service-role key rotation (Phase 3 security hardening — minimal doc colocated at usage):
 * - Rotate SUPABASE_SERVICE_ROLE_KEY every 90 days (or on incident/team change) via Supabase Dashboard > Project Settings > API > service_role key (generate new, copy).
 * - Immediately update the key in all envs (Vercel, local .env, CI) — never commit to git.
 * - Revoke the old key in the Supabase dashboard right after rotation (old JWTs cease to work instantly).
 * - Only used here (supabaseAdmin) and in guarded paths: admin routes (after requireAdmin), webhooks/stripe, crons, rss-ingest, seeds, transcripts jobs.
 * - Service role bypasses *all* RLS (incl. the new 0029 policies) — treat as root; log/audit its calls.
 * - On rotation: also rotate any backup DIRECT_URL if used; test a write path post-deploy.
 */
export function supabaseAdmin(): SupabaseClient {
  if (admin) return admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  admin = createClient(url, key, { auth: { persistSession: false }, realtime: { transport: wsTransport } });
  return admin;
}

/**
 * Public (anon / publishable) client — respects RLS for public reads.
 * Supports both NEXT_PUBLIC_SUPABASE_ANON_KEY (legacy/compat) and
 * NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (modern Supabase project naming).
 * In prod: throws on missing (loud failure for misconfig).
 * In dev: warns + returns a no-op placeholder client so the app can still boot for local work.
 * Cached singleton. Matches usage across lib/* (articles, podcasts, series, search, etc).
 */
export function supabasePublic(): SupabaseClient {
  if (pub) return pub;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (or PUBLISHABLE_KEY) missing for public client."
      );
    }
    console.warn(
      "[supabase] Public client env missing (NEXT_PUBLIC_SUPABASE_URL + ANON or PUBLISHABLE key) — using placeholder (dev degraded mode)."
    );
    // Safe placeholder so pages/components using supabasePublic() don't explode before hydration or in partial envs.
    pub = createClient("https://placeholder.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.placeholder", {
      auth: { persistSession: false },
      realtime: { transport: wsTransport },
    });
    return pub;
  }
  pub = createClient(url, key, { auth: { persistSession: false }, realtime: { transport: wsTransport } });
  return pub;
}

/** True when the public Supabase client can be created (URL + anon/publishable key present). */
export function supabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return Boolean(url && key);
}

/**
 * Tolerant singleton for legacy / docs compatibility ("export const supabase = supabasePublic()").
 * Returns null at module evaluation time if env vars are missing (build-safe).
 * Prefer explicit supabasePublic() or supabaseAdmin() calls for clarity.
 */
export const supabase: SupabaseClient | null = supabaseConfigured() ? supabasePublic() : null;
