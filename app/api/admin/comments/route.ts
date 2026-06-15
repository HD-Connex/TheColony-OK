import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Minimal admin comments moderation API (P1).
 * GET: list pending (approved=false). Editor+.
 * PATCH: { commentId, action: "approve" | "reject" } -> set approved flag.
 * Reuses requireAdmin + supabaseAdmin pattern from /api/admin/clips and /articles.
 * Non-breaking for public /api/comments (only approved shown).
 */
export async function GET(req: Request) {
  const auth = await requireAdmin(req, "editor");
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sb = supabaseAdmin();
  const { data } = await sb
    .from("threaded_comments")
    .select("id, parent_id, user_id, target_type, target_id, content, created_at, approved")
    .eq("approved", false)
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ comments: data ?? [] });
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin(req, "editor");
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { commentId, action } = await req.json().catch(() => ({}));
  if (!commentId || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid payload (commentId + action)" }, { status: 400 });
  }

  const approved = action === "approve";
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("threaded_comments")
    .update({ approved })
    .eq("id", commentId)
    .select("id, approved")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  return NextResponse.json({ comment: data });
}
