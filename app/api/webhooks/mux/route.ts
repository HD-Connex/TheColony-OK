import { NextResponse } from "next/server";
import { mux, muxThumbnail, enableGeneratedSubtitles } from "@/lib/mux";
import { supabaseAdmin } from "@/lib/supabase";
import { log } from "@/lib/log";

export const runtime = "nodejs";

interface MuxEvent {
  type: string;
  data: {
    id: string;
    passthrough?: string;
    duration?: number;
    playback_ids?: { id: string; policy: string }[];
    live_stream_id?: string;
    status?: string;
  };
}

/**
 * Phase 2 Mux webhook: asset ready (episodes + VOD from live) + live_stream active/idle.
 * - passthrough or metadata can carry episode_id or live_event id.
 * - On live_stream.active → flip live_events.status = 'live', set actual_start.
 * - On live_stream.idle/ended + asset → create/link video_episodes row + set live ended.
 * - Triggers generated subtitles (auto-captions) for transcripts pipeline.
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

  const event = JSON.parse(body) as MuxEvent;
  const sb = supabaseAdmin();
  const now = new Date().toISOString();

  try {
    if (event.type === "video.asset.ready") {
      const episodeId = event.data.passthrough;
      const pb = event.data.playback_ids?.[0];

      if (episodeId) {
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

      // If this asset came from a live stream recording, try to link to live_event + create VOD episode row
      const liveStreamId = event.data.live_stream_id;
      if (liveStreamId) {
        const { data: liveEv } = await sb
          .from("live_events")
          .select("id, title, description, tier_required")
          .eq("mux_live_stream_id", liveStreamId)
          .maybeSingle();

        if (liveEv) {
          // Mark live ended + store asset
          await sb
            .from("live_events")
            .update({
              status: "ended",
              ended_at: now,
              mux_asset_id: event.data.id,
              video_url: pb?.id ? `https://stream.mux.com/${pb.id}.m3u8` : null,
              mux_playback_id: pb?.id ?? null,
              updated_at: now,
            })
            .eq("id", liveEv.id);

          // Auto-create a video_episodes VOD entry from the live recording so it appears in catalog/replays
          const existing = await sb
            .from("video_episodes")
            .select("id")
            .eq("mux_asset_id", event.data.id)
            .maybeSingle();

          if (!existing.data) {
            await sb.from("video_episodes").insert({
              title: `${liveEv.title} (Replay)`,
              description: liveEv.description,
              mux_asset_id: event.data.id,
              mux_playback_id: pb?.id ?? null,
              mux_playback_policy: pb?.policy ?? "public",
              duration_seconds: event.data.duration ? Math.round(event.data.duration) : null,
              thumbnail_url: pb?.id ? muxThumbnail(pb.id) : null,
              published_at: now,
              tier_required: liveEv.tier_required || "free",
            });
          }
        }
      }

      // Kick off auto-captions for transcript pipeline (non-blocking)
      if (event.data.id) {
        void enableGeneratedSubtitles(event.data.id);
      }
    }

    if (event.type === "video.live_stream.active") {
      const liveStreamId = event.data.id;
      await sb
        .from("live_events")
        .update({
          status: "live",
          actual_start: now,
          mux_live_stream_id: liveStreamId,
          updated_at: now,
        })
        .eq("mux_live_stream_id", liveStreamId)
        .or(`mux_live_stream_id.is.null`); // fallback if just created
    }

    if (event.type === "video.live_stream.idle" || event.type === "video.live_stream.ended") {
      const liveStreamId = event.data.id;
      await sb
        .from("live_events")
        .update({
          status: "ended",
          ended_at: now,
          updated_at: now,
        })
        .eq("mux_live_stream_id", liveStreamId);
    }
  } catch (e) {
    log.error("[mux webhook] handler error", e);
    // Still ack to Mux so it doesn't retry forever
  }

  return NextResponse.json({ ok: true });
}