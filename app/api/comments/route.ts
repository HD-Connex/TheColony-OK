import { NextResponse } from "next/server";
import { rateLimit, keyFromRequest, tooManyRequests } from "@/lib/rate-limit";
import { sanitizeHtml } from "@/lib/sanitize";
import { supabaseAdmin } from "@/lib/supabase";
import { isActiveMember } from "@/lib/entitlements";
import { getUserFromRequest } from "@/lib/auth-server";

/**
 * Member-only threaded comments.
 * POST { target_type, target_id, content, parent_id? }
 * Rate limited + requires active member (via entitlements on user from session).
 */
export async function POST(req: Request) {
  const rl = await rateLimit(keyFromRequest(req, "comments"), { limit: 10, windowSec: 3600 });
  if (!rl.ok) return tooManyRequests(rl);

  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user_id = user.id;

  const active = await isActiveMember(user_id);
  if (!active) return NextResponse.json({ error: "Member only" }, { status: 403 });

  const { target_type, target_id, content, parent_id } = await req.json().catch(() => ({}));

  if (!target_type || !target_id || !content) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const safe = sanitizeHtml(content).slice(0, 2000);

  const { data, error } = await supabaseAdmin().from("threaded_comments").insert({
    parent_id: parent_id || null,
    user_id,
    target_type,
    target_id,
    content: safe,
    approved: false,
  }).select().single();

  if (error) return NextResponse.json({ error: "Failed to post" }, { status: 500 });

  return NextResponse.json({ comment: data }, { status: 201 });
}

/** Public list for a target (approved only). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const target_type = url.searchParams.get("target_type");
  const target_id = url.searchParams.get("target_id");
  if (!target_type || !target_id) return NextResponse.json({ comments: [] });

  const { data } = await supabaseAdmin()
    .from("threaded_comments")
    .select("id, parent_id, user_id, content, created_at")
    .eq("target_type", target_type)
    .eq("target_id", target_id)
    .eq("approved", true)
    .order("created_at", { ascending: true });

  return NextResponse.json({ comments: data ?? [] });
}
