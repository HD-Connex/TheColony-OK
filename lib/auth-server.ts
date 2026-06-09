import "server-only";
import { type User } from "@supabase/supabase-js";
import { supabasePublic } from "./supabase";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Validate a UUID string (episode ids, user ids). */
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/**
 * Resolve the signed-in Supabase user from an API request.
 * Expects `Authorization: Bearer <access_token>` (browser session JWT).
 * Matches the localStorage-backed auth in lib/auth-client.ts.
 */
export async function getUserFromRequest(req: Request): Promise<User | null> {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice(7).trim();
  if (!token) return null;

  const sb = supabasePublic();
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}