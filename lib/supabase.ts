import { createClient, SupabaseClient } from "@supabase/supabase-js";

let admin: SupabaseClient | null = null;
let pub: SupabaseClient | null = null;

/**
 * Admin (service role) client — bypasses RLS for writes, crons, admin APIs, seed.
 * Throws if credentials missing (callers should only use in privileged contexts).
 * Cached singleton.
 */
export function supabaseAdmin(): SupabaseClient {
  if (admin) return admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  admin = createClient(url, key, { auth: { persistSession: false } });
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
    });
    return pub;
  }
  pub = createClient(url, key, { auth: { persistSession: false } });
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
 * Convenience singleton export for legacy / docs compatibility ("export const supabase = supabasePublic()").
 * Prefer explicit supabasePublic() or supabaseAdmin() calls for clarity.
 * (Created lazily on first access via the function.)
 */
export const supabase = supabasePublic();
