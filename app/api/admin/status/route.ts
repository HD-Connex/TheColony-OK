import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * Lightweight status for client-side isAdmin flag (used by useAuth).
 * Protected by server-side requireAdmin — middleware matcher is *not* trusted.
 * Returns 200 { admin: true } for admin+ roles, otherwise { admin: false } (200 to avoid noisy 401s in UI).
 */
export async function GET(req: Request) {
  const auth = await requireAdmin(req, "admin");
  return NextResponse.json({ admin: !!auth });
}
