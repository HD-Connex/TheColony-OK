// Admin and service authentication for API routes and /admin pages.
//
// Two paths:
//  - requireAdmin(req): human path. Resolves the Supabase user from the
//    Authorization bearer token, then checks members.role.
//  - requireServiceToken(req): machine path. Constant-time compare against
//    ADMIN_SERVICE_TOKEN (cron, internal jobs).

import "server-only";
import type { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "./supabase";
import { getUserFromRequest } from "./auth-server";

// Pure helper extracted so it unit-tests cleanly (no server-only / supabase at import time in vitest).
// Import for use inside this file's require* fns; re-export the binding (not "export from") to avoid duplicate export decl.
import { safeCompare } from "./safe-compare";
export { safeCompare };

export type Role = "admin" | "editor" | "contributor" | "member";

const ROLE_RANK: Record<Role, number> = {
  admin: 3,
  editor: 2,
  contributor: 1,
  member: 0,
};

/** Look up a user's role from the members table. Defaults to "member". */
export async function getUserRole(userId: string): Promise<Role> {
  const { data } = await supabaseAdmin()
    .from("members")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  const role = data?.role as Role | undefined;
  return role && role in ROLE_RANK ? role : "member";
}

export function roleAtLeast(role: Role, required: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[required];
}

export interface AdminAuthResult {
  user: User;
  role: Role;
}

/**
 * Resolve and authorize an admin (or higher-than-`minRole`) user from a request.
 * Returns null when unauthenticated or under-privileged — caller returns 401/403.
 */
export async function requireAdmin(
  req: Request,
  minRole: Role = "admin",
): Promise<AdminAuthResult | null> {
  const user = await getUserFromRequest(req);
  if (!user) return null;
  const role = await getUserRole(user.id);
  if (!roleAtLeast(role, minRole)) return null;
  return { user, role };
}

/** Validate `Authorization: Bearer <ADMIN_SERVICE_TOKEN>` for machine callers. */
export function requireServiceToken(req: Request): boolean {
  const expected = process.env.ADMIN_SERVICE_TOKEN;
  if (!expected) return false;
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;
  return safeCompare(header.slice(7).trim(), expected);
}

/** Validate Vercel Cron's `Authorization: Bearer <CRON_SECRET>` header. */
export function requireCronSecret(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  // No secret configured: allow in dev, deny in production.
  if (!secret) return process.env.NODE_ENV !== "production";
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;
  return safeCompare(header.slice(7).trim(), secret);
}
