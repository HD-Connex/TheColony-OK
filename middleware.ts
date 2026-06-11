import { type NextRequest } from 'next/server';
import { updateSession } from './utils/supabase/middleware';

/**
 * Supabase SSR middleware for session refresh (cookies).
 * This ensures auth sessions stay fresh across server components and route handlers.
 *
 * We delegate to the async updateSession helper which:
 *  - Guards missing env vars (prevents @supabase/ssr throw and MIDDLEWARE_INVOCATION_FAILED 500 on Vercel edge)
 *  - Calls await supabase.auth.getUser() (required to actually trigger cookie refreshes via setAll)
 *
 * We also keep the existing /admin gate comment: real authorization is still enforced
 * server-side with requireAdmin() — middleware is never trusted alone.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

// Run on relevant paths (auth, admin, protected areas). Expand as needed.
// Keep /admin matcher active for the gate surface.
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
    // Explicitly include admin for the existing gate
    '/admin/:path*',
  ],
};
