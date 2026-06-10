import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware runs on the Edge. It is a *first line* only.
 * NEVER rely on it alone for authorization — always re-validate with
 * server-only requireAdmin(req) (or requireServiceToken) inside the
 * actual route handler or server component. Middleware can be bypassed
 * or have stale env; the DB role check in lib/admin-auth.ts is truth.
 */
export function middleware(request: NextRequest) {
  // Future: could add lightweight headers or redirect hints here,
  // but real gate (members.role >= admin) lives in each handler.
  return NextResponse.next();
}

// Only run middleware for /admin tree. This activates the gate surface.
export const config = {
  matcher: ['/admin/:path*'],
};
