import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from './utils/supabase/middleware';

/**
 * NEXT.JS PROXY (REPLACES DEPRECATED middleware.ts / middleware() CONVENTION).
 *
 * As of Next.js 15.5+/16:
 * - `middleware.ts` + `export function middleware(...)` is deprecated.
 * - Use `proxy.ts` + `export async function proxy(request: NextRequest)` instead.
 * - Run `npx middleware-to-proxy .` for the official codemod (it renames file + function).
 *
 * This file is the canonical entrypoint for the Supabase auth session refresh proxy.
 *
 * Why this exists (and why it must never throw):
 * - Supabase SSR requires a Proxy (or old middleware) to refresh expiring auth tokens via cookies
 *   before they reach Server Components / Route Handlers (which cannot reliably write cookies themselves).
 * - On Vercel, an uncaught exception in this file produces the user-visible MIDDLEWARE_INVOCATION_FAILED 500
 *   (even for otherwise healthy requests). See Vercel error docs.
 * - The heavy lifting + all guards / try/catch live in updateSession (see utils/supabase/middleware.ts).
 *
 * Every line below is intentionally minimal / delegating. Do not add logic here that can throw.
 */
export async function proxy(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch (err) {
    // Never let the proxy throw — this is the root of MIDDLEWARE_INVOCATION_FAILED 500s on Vercel.
    // Log for diagnostics (Sentry edge will pick up if configured).
    console.error("[proxy] Supabase session refresh failed (non-fatal; continuing without refresh):", err);
    // Safe passthrough — downstream code (requireAdmin, server components) will handle missing/invalid session gracefully.
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
}

// Proxy matcher (same semantics as the old middleware config).
// Broad coverage ensures auth cookies are refreshed for any page/component that may read the session.
// Static assets + images are excluded for perf (they never need auth state).
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    // Explicitly include admin for the existing gate (real authorization still enforced server-side with requireAdmin() — proxy is never trusted alone).
    '/admin/:path*',
  ],
};
