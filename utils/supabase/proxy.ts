import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Supabase SSR session refresher (Proxy variant).
 *
 * This is the hardened implementation intended to be imported from the root `proxy.ts`.
 * (Duplicate of the logic in middleware.ts helper for the transition period; prefer importing from here after full rename.)
 *
 * See extensive comments in utils/supabase/middleware.ts for the full line-by-line attack on:
 *   env guards, createServerClient, getClaims, cookie setAll logic, edge runtime constraints,
 *   no-top-level-throws contract, and MIDDLEWARE_INVOCATION_FAILED prevention.
 *
 * Changes from legacy middleware helper:
 * - Uses getClaims() + handles its {data, error} result (per latest Supabase Next.js docs).
 * - setAll accepts the second `headers` arg and applies cache headers.
 * - Multiple try/catch + request guards.
 * - Always returns NextResponse; never lets errors escape.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  if (!request || typeof request.cookies?.getAll !== "function") {
    return NextResponse.next();
  }

  if (!supabaseUrl || !supabaseKey) {
    if (process.env.NODE_ENV === "production") {
      console.error("[supabase-proxy] Missing NEXT_PUBLIC_SUPABASE_URL or (ANON_KEY or PUBLISHABLE_KEY). Session refresh skipped.");
      return NextResponse.next({ request: { headers: request.headers } });
    }
    console.warn("[supabase-proxy] env missing — using placeholder (dev only).");
    return NextResponse.next({ request: { headers: request.headers } });
  }

  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet, headers) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                request.cookies.set(name, value, options);
              } catch {}
            });

            supabaseResponse = NextResponse.next({ request });

            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                supabaseResponse.cookies.set(name, value, options);
              } catch {}
            });

            if (headers && typeof headers === "object") {
              try {
                Object.entries(headers).forEach(([key, value]) => {
                  if (value != null) supabaseResponse.headers.set(key, String(value));
                });
              } catch {}
            }
          },
        },
      },
    );

    // Use getClaims() (validates JWT). getUser() is acceptable fallback for some older flows.
    const { data, error } = await supabase.auth.getClaims();
    if (error) {
      console.warn("[supabase-proxy] getClaims error (non-fatal):", error?.message || error);
    }
  } catch (err) {
    console.error("[supabase-proxy] updateSession threw (request continues safely):", err);
    if (supabaseResponse) return supabaseResponse;
    return NextResponse.next({ request: { headers: request.headers } });
  }

  return supabaseResponse;
}

// Legacy alias kept in this file too for the transition. Prefer updateSession.
export const createClient = (request: NextRequest) => {
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
              try { request.cookies.set(name, value, options); } catch {}
            });
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) => {
              try { supabaseResponse.cookies.set(name, value, options); } catch {}
            });
          },
        },
      },
    );
  } catch (err) {
    console.error("[supabase-proxy] legacy createClient threw (ignored):", err);
  }

  return supabaseResponse;
};
