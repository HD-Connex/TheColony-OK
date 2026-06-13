import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Supabase SSR session refresher for use from the Next.js Proxy (formerly middleware).
 *
 * CRITICAL ROBUSTNESS RULES (to prevent MIDDLEWARE_INVOCATION_FAILED 500 on Vercel):
 * - NEVER throw at top level or from the exported function.
 * - Always return a valid NextResponse (use NextResponse.next() fallback on any error).
 * - Guard env at the top (public keys only; service role is never available/used here).
 * - Wrap createServerClient + getClaims/getUser in try/catch.
 * - Follow Supabase SSR rules: no code between createServerClient() and the get*() call.
 * - Updated for latest @supabase/ssr + Next.js 16 "proxy" convention:
 *   - setAll now receives (cookiesToSet, headers) per current docs.
 *   - Prefer supabase.auth.getClaims() (validates JWT signature server-side; getUser also works but getClaims is recommended in current Supabase Next.js proxy examples).
 *   - Apply any cache headers from setAll to prevent CDN/session leakage.
 *
 * This runs on the Edge (or Fluid under Vercel Next.js) for every matched request.
 * It only refreshes the auth cookies; real authz is done server-side (e.g. requireAdmin).
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  // --- Guard 1: Basic request sanity (defensive; prevents weird invocation crashes) ---
  if (!request || typeof request.cookies?.getAll !== "function") {
    // Extremely defensive; in practice Next always provides a valid NextRequest here.
    return NextResponse.next();
  }

  // --- Guard 2: Missing env (the original source of many @supabase/ssr throws + MIDDLEWARE_INVOCATION_FAILED) ---
  if (!supabaseUrl || !supabaseKey) {
    if (process.env.NODE_ENV === "production") {
      console.error("[supabase-proxy] Missing NEXT_PUBLIC_SUPABASE_URL or (ANON_KEY or PUBLISHABLE_KEY). Session refresh skipped. Downstream server clients may throw if they require the key.");
      // Safe fallback: continue the request. Auth will degrade/fail explicitly in server components/routes that need it.
      return NextResponse.next({ request: { headers: request.headers } });
    }
    console.warn("[supabase-proxy] env missing — using placeholder (dev only).");
    return NextResponse.next({ request: { headers: request.headers } });
  }

  // Initial response we may mutate via setAll during the getClaims call.
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    // --- Guard 3: create + get* MUST be adjacent per Supabase SSR contract (do not insert code) ---
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet, headers) {
            // Mutate the incoming request cookies so refreshed token is visible to downstream server code on this request.
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                (request.cookies as any).set(name, value, options);
              } catch {
                // Extremely rare; swallow to keep response flowing.
              }
            });

            // Create a fresh response clone carrying the original (now updated) request.
            supabaseResponse = NextResponse.next({
              request,
            });

            // Write cookies to the outgoing response (browser will receive refreshed session).
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                supabaseResponse.cookies.set(name, value, options);
              } catch {
                // Swallow per-pattern in server.ts
              }
            });

            // Apply any cache-busting / no-cache headers supplied by @supabase/ssr (prevents CDN leaking one user's session to another).
            if (headers && typeof headers === "object") {
              try {
                Object.entries(headers).forEach(([key, value]) => {
                  if (value != null) supabaseResponse.headers.set(key, String(value));
                });
              } catch {
                // Non-fatal.
              }
            }
          },
        },
      },
    );

    // REQUIRED: This (or getUser) triggers the actual refresh + setAll callbacks.
    // Using getClaims() per current Supabase Next.js Proxy guidance (validates signature every time; never trust getSession() in server/edge code).
    // Wrapped so a transient Supabase network/JWT error does not 500 the entire request.
    const { data, error } = await supabase.auth.getClaims();
    if (error) {
      // Non-fatal for the request: log at warn so it's visible in Vercel logs but we still serve the page.
      // User will be treated as unauthed for this request (cookie may be stale/broken).
      console.warn("[supabase-proxy] getClaims returned error (continuing):", error?.message || error);
    }
    // data?.claims may be present or null; we don't branch here — cookie side-effects already applied if any refresh occurred.
  } catch (err) {
    // --- Guard 4: Absolute no-throw contract for edge middleware/proxy ---
    // Any uncaught error here previously caused MIDDLEWARE_INVOCATION_FAILED 500 on Vercel.
    // We log (visible in function/edge logs) and return a safe pass-through response.
    console.error("[supabase-proxy] updateSession threw (non-fatal, request continues):", err);
    // Return whatever supabaseResponse we have (may be the initial or one from a partial setAll), or a pristine safe one.
    if (supabaseResponse) {
      return supabaseResponse;
    }
    return NextResponse.next({ request: { headers: request.headers } });
  }

  return supabaseResponse;
}

/**
 * Legacy sync alias (createClient) kept ONLY for backwards compat with any stray imports.
 * It is NOT used by the current root proxy/middleware (which uses the async updateSession + getClaims).
 *
 * DO NOT USE for new code. It does not call getClaims/getUser so provides no refresh.
 * It is also not wrapped in the full try/catch of updateSession.
 *
 * Safe to delete after confirming no imports reference "@/utils/supabase/middleware" createClient.
 */
export const createClient = (request: NextRequest) => {
  // Note: sync, no await, no getClaims — minimal for legacy only.
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  try {
    createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try { (request.cookies as any).set(name, value, options); } catch {}
            });
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) => {
              try { supabaseResponse.cookies.set(name, value, options); } catch {}
            });
          },
        },
      },
    );
    // Intentionally no get*() call and no await (legacy).
  } catch (err) {
    console.error("[supabase-proxy] legacy createClient threw (ignored):", err);
  }

  return supabaseResponse;
};
