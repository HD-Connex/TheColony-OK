import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit, keyFromRequest, tooManyRequests } from "@/lib/rate-limit";

/** Simple upvote for community clips (member or public). Increments denormalized count.
 * Phase 3: public view + upvote on /clips Citizen Dispatch feed (RLS approved=true allows anon select; upvote intentionally no auth gate).
 * Create/upload remain member-only (enforced in moment/upload via getMembership from lib/entitlements + getUserFromRequest).
 */
export async function POST(req: Request) {
  const rl = await rateLimit(keyFromRequest(req, "clip-upvote"), { limit: 50, windowSec: 3600 });
  if (!rl.ok) return tooManyRequests(rl);

  const { clip_id } = await req.json().catch(() => ({}));
  if (!clip_id) return NextResponse.json({ error: "clip_id required" }, { status: 400 });

  const sb = supabaseAdmin();
  // Atomic increment via RPC (migration 0032) — avoids the read-then-write race that
  // let concurrent/replayed requests clobber the count.
  const { data: newCount, error } = await sb.rpc("increment_clip_upvotes", { p_clip_id: clip_id });
  if (error) {
    return NextResponse.json({ error: "Upvote failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, upvotes: newCount ?? null });
}
