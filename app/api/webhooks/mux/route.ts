import { NextResponse } from "next/server";
import { mux, muxThumbnail } from "@/lib/mux";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

interface MuxAssetEvent {
  type: string;
  data: {
    id: string;
    passthrough?: string;
    duration?: number;
    playback_ids?: { id: string; policy: string }[];
  };
}

/**
 * Updates an episode when its Mux asset is ready (duration, playback id).
 * Asset is matched via passthrough metadata = episode id (video_episodes or podcast episodes).
 * Verifies the Mux webhook signature when MUX_WEBHOOK_SECRET is set.
 */
export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("mux-signature");
  const secret = process.env.MUX_WEBHOOK_SECRET;

  if (sig && secret) {
    try {
      mux().webhooks.verifySignature(body, { "mux-signature": sig }, secret);
    } catch {
      return new NextResponse("Invalid signature", { status: 400 });
    }
  }

  const event = JSON.parse(body) as MuxAssetEvent;

  if (event.type === "video.asset.ready") {
    const episodeId = event.data.passthrough;
    if (episodeId) {
      const pb = event.data.playback_ids?.[0];
      const now = new Date().toISOString();
      const sb = supabaseAdmin();

      const videoPatch = {
        mux_asset_id: event.data.id,
        mux_playback_id: pb?.id ?? null,
        mux_playback_policy: pb?.policy ?? "public",
        duration_seconds: event.data.duration ? Math.round(event.data.duration) : null,
        thumbnail_url: pb?.id ? muxThumbnail(pb.id) : null,
        updated_at: now,
      };

      const { data: videoEp } = await sb
        .from("video_episodes")
        .select("id")
        .eq("id", episodeId)
        .maybeSingle();

      if (videoEp) {
        await sb.from("video_episodes").update(videoPatch).eq("id", episodeId);
      } else {
        await sb
          .from("episodes")
          .update({
            mux_playback_id: pb?.id ?? null,
            thumbnail_url: pb?.id ? muxThumbnail(pb.id) : null,
            duration_s: event.data.duration ? Math.round(event.data.duration) : null,
          })
          .eq("id", episodeId);
      }
    }
  }

  return NextResponse.json({ ok: true });
}