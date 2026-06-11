import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

/** Simple unapproved clips list for admin queue. */
export async function GET(req: Request) {
  const auth = await requireAdmin(req, "editor");
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const approved = url.searchParams.get("approved") === "true";

  const sb = supabaseAdmin();
  const { data } = await sb
    .from("clips")
    .select("id, user_id, ep_id, duration_s, approved, created_at, storage_path, dispatch_type, transcript, source_phrase, upvotes, county, start_s")
    .eq("approved", approved)
    .order("created_at", { ascending: false })
    .limit(30);

  return NextResponse.json({ clips: data ?? [] });
}
