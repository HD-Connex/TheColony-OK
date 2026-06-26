import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

/**
 * Lightweight status for client-side isAdmin flag (used by useAuth).
 * Supports both:
 *   1. Authorization: Bearer <access_token> (programmatic / authedFetch callers)
 *   2. Session cookies (browser callers like useAuth's fetch("/api/admin/status"))
 * Returns 200 { admin: true } for admin+ roles, otherwise { admin: false } (200 to avoid noisy 401s in UI).
 */
export async function GET(req: Request) {
  // Path 1: Bearer token auth
  const bearerAuth = await requireAdmin(req, "admin");
  if (bearerAuth) return NextResponse.json({ admin: true });

  // Path 2: Cookie-based SSR auth (browser callers without explicit Bearer header)
  try {
    const cookieStore = await cookies();
    const supabaseSsr = createClient(cookieStore);
    const { data: { user } } = await supabaseSsr.auth.getUser();
    if (user) {
      const { getUserRole, roleAtLeast } = await import("@/lib/admin-auth");
      const role = await getUserRole(user.id);
      const admin = roleAtLeast(role as any, "admin");
      return NextResponse.json({ admin });
    }
  } catch {
    // Non-fatal; fall through to { admin: false }
  }

  return NextResponse.json({ admin: false });
}
