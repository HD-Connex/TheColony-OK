import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function updateSession(request: NextRequest) {
  // Guard against missing env (prevents @supabase/ssr throw and MIDDLEWARE_INVOCATION_FAILED 500)
  if (!supabaseUrl || !supabaseKey) {
    if (process.env.NODE_ENV === "production") {
      console.error("Missing NEXT_PUBLIC_SUPABASE_URL or key for middleware SSR client");
      // Safe fallback: continue without Supabase (auth will fail downstream if needed)
      return NextResponse.next({ request: { headers: request.headers } });
    }
    console.warn("[supabase-middleware] env missing — using placeholder (dev only).");
    return NextResponse.next({ request: { headers: request.headers } });
  }

  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    },
  );

  // IMPORTANT: This is required for session refresh and to trigger cookie updates via setAll
  // (per @supabase/ssr patterns). Without it, no refresh happens despite the cookie adapter.
  await supabase.auth.getUser();

  return supabaseResponse;
}

// Legacy alias for existing middleware.ts call (kept for minimal diff; prefer updateSession)
export const createClient = (request: NextRequest) => {
  // Note: this is sync wrapper; for full functionality use the async updateSession in root middleware
  // (the guard + getUser are in the async version above).
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    },
  );

  return supabaseResponse;
};
