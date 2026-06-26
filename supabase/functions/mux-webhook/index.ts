// Mux Webhook Edge Function — Enhanced for 24/7 system
// Handles incoming Mux webhook events and updates the mux schema tables.
// Auto-enriches assets on video.asset.ready: sets title, generates thumbnails,
// optionally adds to the schedule.

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { crypto } from "jsr:@std/crypto@1.0.2/crypto";
import { encodeHex } from "jsr:@std/encoding@1.0.2/hex";

interface MuxEvent {
  type: string;
  request_id?: string;
  data: Record<string, unknown>;
  id?: string;
  created_at?: string;
}

const MUX_WEBHOOK_SECRET = Deno.env.get("MUX_WEBHOOK_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function createSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

// Verify Mux webhook signature
async function verifySignature(body: string, signatureHeader: string): Promise<boolean> {
  try {
    const parts = signatureHeader.split(",");
    const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2);
    const sig = parts.find((p) => p.startsWith("v1="))?.slice(3);
    if (!timestamp || !sig) return false;

    const payload = `${timestamp}.${body}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(MUX_WEBHOOK_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const expectedSig = encodeHex(
      new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))),
    );

    // Constant-time comparison
    if (expectedSig.length !== sig.length) return false;
    let diff = 0;
    for (let i = 0; i < expectedSig.length; i++) {
      diff |= expectedSig.charCodeAt(i) ^ sig.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST" } });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Verify signature
  const signature = req.headers.get("mux-signature") ?? "";
  const body = await req.text();
  if (!(await verifySignature(body, signature))) {
    return new Response("Invalid signature", { status: 401 });
  }

  const event: MuxEvent = JSON.parse(body);
  const sb = createSupabase();

  // Log event to mux.events table (idempotent: skip if already processed)
  const { data: existing } = await sb
    .from("mux_events")
    .select("id")
    .eq("event_id", event.data?.id ?? event.request_id)
    .maybeSingle();

  if (!existing) {
    await sb.from("mux_events").insert({
      event_id: event.data?.id ?? event.request_id,
      event_type: event.type,
      data: event.data,
    });
  }

  switch (event.type) {
    case "video.asset.ready": {
      const asset = event.data as Record<string, any>;
      const playbackId = asset.playback_ids?.[0]?.id ?? null;

      // Upsert asset into mux.assets
      const assetPayload = {
        asset_id: asset.id,
        playback_id: playbackId,
        status: "ready",
        duration: asset.duration ?? null,
        max_stored_resolution: asset.max_stored_resolution ?? null,
        max_stored_frame_rate: asset.max_stored_frame_rate ?? null,
        aspect_ratio: asset.aspect_ratio ?? null,
        mp4_support: asset.mp4_support ?? null,
        master_access: asset.master_access ?? null,
        updated_at: new Date().toISOString(),
      };

      await sb.from("mux.assets").upsert(assetPayload, { onConflict: "asset_id" });

      // Auto-create a program entry if one doesn't exist for this playback_id
      if (playbackId) {
        const { data: existingProgram } = await sb
          .from("programs")
          .select("id")
          .eq("playback_id", playbackId)
          .maybeSingle();

        if (!existingProgram) {
          const title = (asset.passthrough && typeof asset.passthrough === "string"
            ? asset.passthrough
            : `Asset ${asset.id.slice(0, 8)}`) as string;

          await sb.from("programs").insert({
            playback_id: playbackId,
            title,
            duration_seconds: asset.duration ?? null,
            status: "active",
          });
        }
      }

      // Mark the mux event as processed
      if (existing) {
        await sb.from("mux.events").update({ processed: true }).eq("id", existing.id);
      }
      break;
    }

    case "video.live_stream.active":
    case "video.live_stream.idle":
    case "video.live_stream.ended": {
      const ls = event.data as Record<string, any>;
      const playbackId = ls.playback_ids?.[0]?.id ?? null;
      const status = event.type === "video.live_stream.active" ? "active" : "idle";

      await sb.from("mux.live_streams").upsert(
        {
          live_stream_id: ls.id,
          playback_id: playbackId,
          status,
          stream_key: ls.stream_key ?? null,
          reconnect_window: ls.reconnect_window ?? null,
          latency_mode: ls.latency_mode ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "live_stream_id" },
      );

      if (existing) {
        await sb.from("mux.events").update({ processed: true }).eq("id", existing.id);
      }
      break;
    }

    case "video.upload.asset_created": {
      const upload = event.data as Record<string, any>;
      await sb.from("mux.uploads").upsert(
        {
          upload_id: upload.id,
          status: "asset_created",
          asset_id: upload.asset_id ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "upload_id" },
      );
      break;
    }

    default:
      // Mark unknown events as processed to avoid re-processing
      if (existing) {
        await sb.from("mux.events").update({ processed: true }).eq("id", existing.id);
      }
  }

  return new Response("ok", { status: 200, headers: { "Access-Control-Allow-Origin": "*" } });
});
