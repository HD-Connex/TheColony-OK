// Supabase clients. Two separate clients so we never accidentally use the
// service-role key in a public-facing context.
//
// - `supabaseAdmin()` — server-side, service-role, bypasses RLS. Used by cron.
// - `supabasePublic()` — server-side, anon key, respects RLS. Used by public reads.

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let admin: SupabaseClient | null = null;
let pub: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (admin) return admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SERVICE_ROLE_KEY");
  admin = createClient(url, key, { auth: { persistSession: false } });
  return admin;
}

export function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function supabasePublic(): SupabaseClient {
  if (pub) return pub;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";
  pub = createClient(url, key, { auth: { persistSession: false } });
  return pub;
}

// Single shared public client (anon key) — created once via the cached supabasePublic() factory.
// (export const supabase = createClient... singleton per P5 requirement; delegates to avoid top-level env crashes on import during build)
export const supabase = supabasePublic();

// ─── Domain types ───

export interface Show {
  id: string;
  slug: string;
  title: string;
  host: string;
  description: string | null;
  cover_url: string | null;
  rss_url: string;
  active: boolean;
  last_polled: string | null;
  last_status: string | null;
  fail_count: number;
  created_at: string;
}

export interface Episode {
  id: string;
  show_id: string;
  show_slug: string;
  guid: string;
  title: string;
  description: string | null;
  audio_url: string | null;
  duration_s: number | null;
  pub_date: string;
  episode_no: number | null;
  cover_url: string | null;
  slug: string;
  host_name?: string | null;
  published_at?: string | null;
  created_at: string;
  // Podcast video support (Phase 6 / priority 1): optional video "version" of episode
  // (like Spotify video podcasts). Ingested via RSS (video mime enclosure or itunes:video),
  // admin, or seed. chapters as jsonb array for seekable markers.
  video_url?: string | null;
  mux_playback_id?: string | null;
  thumbnail_url?: string | null;
  chapters?: Array<{ t: number; label: string }> | null;
}

export type EpisodeInsert = Omit<Episode, "id" | "created_at">;
