import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { log } from "@/lib/log";

/** List pending (or all) contributor applications for admin review. Editor+. */
export async function GET(req: Request) {
  const auth = await requireAdmin(req, "editor");
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "pending";

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("contributor_applications")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    log.error("[admin/contributors/applications] query failed", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ applications: data ?? [] });
}
