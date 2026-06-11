import { type NextRequest } from 'next/server';
import { createClient } from './utils/supabase/middleware';

/**
 * Supabase SSR middleware for session refresh (cookies).
 * This ensures auth sessions stay fresh across server components and route handlers.
 *
 * We also keep the existing /admin gate comment: real authorization is still enforced
 * server-side with requireAdmin() — middleware is never trusted alone.
 */
export async function middleware(request: NextRequest) {
  // Run Supabase session/cookie handler (returns response with refreshed cookies if needed)
  const supabaseResponse = createClient(request);

  // Existing logic / matcher still applies for /admin paths.
  // Additional protected paths can be added here in the future if desired.
  return supabaseResponse;
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
