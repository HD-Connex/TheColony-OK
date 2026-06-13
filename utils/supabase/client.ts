import { createBrowserClient } from "@supabase/ssr";

let browserClient: any = null;

/**
 * P5 FIX (Multiple GoTrueClient warning) + P2 LiveChat alignment:
 * Browser singleton for createBrowserClient (from @supabase/ssr).
 * Exactly mirrors the cached singleton pattern in lib/supabase.ts (let pub = null; if (pub) return pub; ... assign then return).
 * - Caches the FIRST instance forever (module scope, survives re-imports in client bundles).
 * - All browser createClient() calls (from pages/components like my-counties, backroom, ContinueRail, my-feed, newsletter/preferences, clips, LiveChat via auth alias etc) now return the *same* instance.
 * - Eliminates duplicate GoTrueClient (auth internals) that triggered warnings when code mixed:
 *     import { createClient } from "@/utils/supabase/client"
 *     import { supabaseBrowser } from "@/lib/auth-client"
 *   (plus top-of-render `const ssr = createClient()` calls).
 * - Supports full auth config (persist/autoRefresh/detectSessionInUrl) for magic links/OTP used by useAuth etc.
 * - Dev placeholder is also cached (prevents repeated warns/instances).
 * - Server createClient (utils/supabase/server.ts) remains per-request (cookieStore arg) — not affected, correct for RSC/SSR.
 * - No top-level eager instantiation: lazy on first call (use lazy like supabasePublic).
 * - After this, LiveChat (which calls supabaseBrowser()) and all other browser realtime/auth paths share ONE client.
 *
 * Self-verif notes (in comments per Phase 1 instr):
 * - Post-edit: grep for createClient|supabaseBrowser should show consolidation to shared paths.
 * - build + tsc must pass with 0 errors.
 * - No change to server-side, lib/supabase pub/admin, or admin-api paths.
 * - Reuses LiveChat fallbacks/supabaseConfigured/DS patterns indirectly (no creep).
 */
export const createClient = () => {
  if (browserClient) return browserClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    if (process.env.NODE_ENV === "production") {
      console.error("Missing NEXT_PUBLIC_SUPABASE_URL or key for browser SSR client");
      throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (or PUBLISHABLE_KEY) missing for Supabase SSR browser client.");
    }
    console.warn("[supabase-client] env missing — using placeholder (dev only).");
    // Minimal no-op for dev so components don't explode before hydration. Cached to avoid multiples.
    browserClient = { auth: { getSession: async () => ({ data: { session: null }, error: null }) } } as any;
    return browserClient;
  }

  browserClient = createBrowserClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return browserClient;
};
