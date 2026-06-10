import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

/** List live events for admin scheduler. */
export async function GET(req: Request) {
  const auth = await requireAdmin(req, "editor");
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sb = supabaseAdmin();
  const { data } = await sb.from("live_events").select("*").order("scheduled_start", { ascending: true }).limit(50);
  return NextResponse.json({ events: data ?? [] });
}
