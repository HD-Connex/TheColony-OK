import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

/** Admin-only members directory lookup (role, is_member, email). */
export async function GET(req: Request) {
  const auth = await requireAdmin(req, "admin"); // strict for full member list
  if (!auth) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const sb = supabaseAdmin();
  const { data } = await sb
    .from("members")
    .select("user_id, email, is_member, status, tier, role, current_period_end")
    .order("updated_at", { ascending: false })
    .limit(100);

  return NextResponse.json({ members: data ?? [] });
}
