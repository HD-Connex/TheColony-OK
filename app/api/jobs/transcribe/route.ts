import { NextResponse } from "next/server";
import { isUuid } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Transcript generation job (admin/cron). Secret-guarded stub.
 *
 * Full pipeline (Whisper → summary → embeddings) is not yet ported — TheColony
 * used Drizzle `transcripts` + `content_embeddings` tables that are not in
 * thecolony-app migrations. This route validates the episode and returns a
 * structured stub so cron wiring can be tested.
 *
 * Trigger:  POST /api/jobs/transcribe
 *   header  Authorization: Bearer $CRON_SECRET
 *   body    { "episodeId": "<uuid>" }
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new NextResponse("Bad JSON", { status: 400 });
  }

  const episodeId =
    body && typeof body === "object" && typeof (body as Record<string, unknown>).episodeId === "string"
      ? (body as Record<string, string>).episodeId
      : null;

  if (!episodeId || !isUuid(episodeId)) {
    return new NextResponse("Invalid payload", { status: 422 });
  }

  const sb = supabaseAdmin();

  const { data: videoEp } = await sb
    .from("video_episodes")
    .select("id,title,video_url,mux_playback_id")
    .eq("id", episodeId)
    .maybeSingle();

  let ep = videoEp;
  if (!ep) {
    const { data: podcastEp } = await sb
      .from("episodes")
      .select("id,title,audio_url,video_url,mux_playback_id")
      .eq("id", episodeId)
      .maybeSingle();
    ep = podcastEp;
  }
  if (!ep) return new NextResponse("Episode not found", { status: 404 });

  const audioUrl = "audio_url" in ep ? ep.audio_url : null;
  const source =
    audioUrl ??
    ep.video_url ??
    (ep.mux_playback_id ? `https://stream.mux.com/${ep.mux_playback_id}/high.mp4` : null);

  if (!source) return new NextResponse("No audio/video source for episode", { status: 422 });

  return NextResponse.json({
    ok: false,
    stub: true,
    episodeId: ep.id,
    title: ep.title,
    source,
    message:
      "Transcription pipeline not yet ported. Add transcripts table + lib/transcribe.ts to enable Whisper jobs.",
  });
}