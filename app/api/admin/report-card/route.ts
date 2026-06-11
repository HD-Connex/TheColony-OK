import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Phase 4 admin API for Oklahoma Report Card.
 * All writes go through here (service role) after requireAdmin gate.
 * Public reads are handled by the lib/report-card.ts + RLS (select true).
 */

export async function GET(req: Request) {
  if (!requireAdmin(req)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const sb = supabaseAdmin();
  const [{ data: officials }, { data: issues }, { data: grades }] = await Promise.all([
    sb.from("officials").select("*").order("county").order("name"),
    sb.from("scorecard_issues").select("*").order("sort_order"),
    sb.from("grades").select("*").order("updated_at", { ascending: false }),
  ]);
  return NextResponse.json({ officials: officials ?? [], issues: issues ?? [], grades: grades ?? [] });
}

export async function POST(req: Request) {
  if (!requireAdmin(req)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const sb = supabaseAdmin();

  try {
    if (body.action === "create_official" || body.action === "upsert_official") {
      const payload = body.payload || body;
      const { data, error } = await sb
        .from("officials")
        .insert({
          name: payload.name,
          office: payload.office,
          county: payload.county || null,
          party: payload.party || null,
          photo_url: payload.photo_url || null,
          bio: payload.bio || null,
          term_start: payload.term_start || null,
          term_end: payload.term_end || null,
        })
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ ok: true, official: data });
    }

    if (body.action === "upsert_grade") {
      const g = body.payload || body;
      const { data, error } = await sb
        .from("grades")
        .upsert(
          {
            official_id: g.official_id,
            issue_id: g.issue_id,
            grade: g.grade,
            notes: g.notes || null,
            evidence_url: g.evidence_url || null,
            source: g.source || null,
          },
          { onConflict: "official_id,issue_id" }
        )
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ ok: true, grade: data });
    }

    if (body.action === "delete_official") {
      const { error } = await sb.from("officials").delete().eq("id", body.id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}