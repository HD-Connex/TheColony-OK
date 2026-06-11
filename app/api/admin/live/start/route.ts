import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createLiveStream, addSimulcastTargets } from "@/lib/mux";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Admin "Go Live": creates real Mux live stream, stores id + stream_key on a new or latest idle live_event.
 * Stream key is never returned to non-admins in normal flows.
 */
export async function POST(req: Request) {
  const auth = await requireAdmin(req, "editor");
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let simulcastTargets: Array<{ url: string; stream_key: string }> = [];
  try {
    const body = await req.json();
    if (Array.isArray(body?.simulcast_targets)) {
      simulcastTargets = body.simulcast_targets
        .filter((t: any) => t && typeof t.url === 'string' && typeof t.stream_key === 'string')
        .map((t: any) => ({ url: t.url.trim(), stream_key: t.stream_key.trim() }));
    }
  } catch {
    // no body or invalid — proceed without simulcast
  }

  try {
    const stream = await createLiveStream();
    const sb = supabaseAdmin();

    if (simulcastTargets.length > 0) {
      await addSimulcastTargets(stream.id, simulcastTargets);
    }

    // Find an idle/preview event or create a generic one
    const { data: existing } = await sb
      .from("live_events")
      .select("id")
      .in("status", ["idle", "preview"])
      .order("scheduled_start", { ascending: true })
      .limit(1)
      .maybeSingle();

    const playback = stream.playback_ids?.[0];
    const patch = {
      mux_live_stream_id: stream.id,
      stream_key: (stream as any).stream_key || null,
      mux_playback_id: playback?.id || null,
      actual_start: null,
      updated_at: new Date().toISOString(),
    } as const;

    if (existing) {
      await sb.from("live_events").update(patch).eq("id", existing.id);
    } else {
      await sb.from("live_events").insert({
        title: "Live Broadcast",
        status: "preview",
        ...patch,
      });
    }

    // Return minimal — stream key only for the admin who just clicked (never log or expose broadly)
    return NextResponse.json({
      ok: true,
      live_stream_id: stream.id,
      playback_id: playback?.id,
      simulcast_attached: simulcastTargets.length,
      // stream_key intentionally omitted from normal JSON response for safety; it's in DB for ingest
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Mux live create failed" }, { status: 500 });
  }
}
