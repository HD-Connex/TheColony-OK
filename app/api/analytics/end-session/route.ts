import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { log } from "@/lib/log";

export const runtime = "nodejs";

// Only these columns may be written by the (unauthenticated, beacon-driven)
// end-session call. Spreading the raw body into a service-role update would let
// any caller who knows a sessionId overwrite arbitrary columns. Keep in sync
// with the fields sent by lib/mux-247/usePlaybackAnalytics.ts.
const ALLOWED_FIELDS = [
  "watch_seconds",
  "session_end",
  "avg_bitrate",
  "quality_switches",
  "error_count",
  "last_error_code",
] as const;

export async function POST(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const update: Record<string, unknown> = {};
    for (const field of ALLOWED_FIELDS) {
      if (body[field] !== undefined) update[field] = body[field];
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No updatable fields" }, { status: 400 });
    }

    const { error } = await supabaseAdmin()
      .from("playback_sessions")
      .update(update)
      .eq("id", sessionId);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error("[analytics/end-session] update failed", err);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}
