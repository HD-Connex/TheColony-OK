import { NextResponse } from "next/server";
import { mux } from "@/lib/mux";
import { supabaseAdmin } from "@/lib/supabase";
import { log } from "@/lib/log";

export const runtime = "nodejs";

/**
 * Live-stream state webhook → keeps live_events.status accurate for /live.
 *
 * Handles the encoder-lifecycle events (connected/disconnected/idle), which are
 * complementary to the asset/active events covered by /api/webhooks/mux. Register
 * this endpoint in the Mux dashboard if you want connected → "live" the moment the
 * encoder attaches (vs. waiting for video.live_stream.active).
 *
 * Shares MUX_WEBHOOK_SECRET with the asset webhook. Signature is enforced in
 * production; dev without a secret is allowed (with a warning) so local testing works.
 */
export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("mux-signature");
  const secret = process.env.MUX_WEBHOOK_SECRET;

  if (process.env.NODE_ENV === "production" && !secret) {
    log.error("[mux-live] MUX_WEBHOOK_SECRET not set in production — rejecting webhook");
    return new NextResponse("Webhook secret not configured", { status: 500 });
  }
  if (secret) {
    if (!sig) return new NextResponse("Missing signature", { status: 400 });
    try {
      mux().webhooks.verifySignature(body, { "mux-signature": sig }, secret);
    } catch {
      return new NextResponse("Invalid signature", { status: 400 });
    }
  } else {
    log.warn("[mux-live] no MUX_WEBHOOK_SECRET set — skipping signature verification (dev only)");
  }

  const event = JSON.parse(body) as {
    type: string;
    data: { id: string; status?: string; playback_ids?: { id: string; policy: string }[] };
  };

  const relevant =
    event.type === "video.live_stream.connected" ||
    event.type === "video.live_stream.disconnected" ||
    event.type === "video.live_stream.idle";

  if (!relevant) return NextResponse.json({ ok: true });

  const sb = supabaseAdmin();
  const liveStreamId = event.data.id;
  const now = new Date().toISOString();

  try {
    const { data: liveEvent } = await sb
      .from("live_events")
      .select("id")
      .eq("mux_live_stream_id", liveStreamId)
      .maybeSingle();

    if (!liveEvent) {
      log.warn(`[mux-live] no live_event matched Mux stream ${liveStreamId} — skipping`);
      return NextResponse.json({ ok: true });
    }

    if (event.type === "video.live_stream.connected") {
      const pb = event.data.playback_ids?.[0];
      await sb
        .from("live_events")
        .update({ status: "live", actual_start: now, mux_playback_id: pb?.id ?? null, updated_at: now })
        .eq("id", liveEvent.id);
    } else if (event.type === "video.live_stream.disconnected") {
      await sb
        .from("live_events")
        .update({ status: "ended", ended_at: now, updated_at: now })
        .eq("id", liveEvent.id);
    } else if (event.type === "video.live_stream.idle") {
      await sb.from("live_events").update({ status: "idle", updated_at: now }).eq("id", liveEvent.id);
    }
  } catch (e) {
    log.error("[mux-live] handler error", e);
    // Still ack so Mux doesn't retry forever.
  }

  return NextResponse.json({ ok: true });
}
