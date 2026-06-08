import { NextResponse } from "next/server";
import { isUuid } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Schema contract from supabase/migrations/0011_ai_search.sql */
const AI_SEARCH_SCHEMA = {
  migration: "0011_ai_search.sql",
  extensions: ["vector"],
  tables: {
    transcripts: {
      columns: [
        "content_id",
        "content_type",
        "language",
        "segments",
        "provider",
        "created_at",
      ],
      contentTypes: ["episode", "video_episode"] as const,
      segmentsShape: "{ start: number; end: number; text: string; speaker?: string }[]",
    },
    content_embeddings: {
      columns: ["content_id", "content_type", "chunk_index", "chunk", "embedding"],
      embeddingDim: 1536,
    },
  },
  rpc: "match_content_embeddings",
  pipeline: [
    "fetch audio/video source",
    "transcribe (Whisper or provider)",
    "upsert transcripts row",
    "chunk transcript text",
    "generate embeddings (1536-dim)",
    "upsert content_embeddings rows",
  ],
} as const;

type ContentType = "episode" | "video_episode";

async function transcriptsTableReady(sb: ReturnType<typeof supabaseAdmin>): Promise<boolean> {
  const { error } = await sb.from("transcripts").select("id").limit(0);
  if (!error) return true;
  return !error.message?.includes("does not exist");
}

/**
 * Transcript generation job (admin/cron). Secret-guarded.
 *
 * Validates episode + media source. When 0011_ai_search tables exist, returns
 * structured pipeline status; Whisper → embeddings wiring is still pending.
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

  let contentType: ContentType = "video_episode";
  let ep = videoEp;

  if (!ep) {
    const { data: podcastEp } = await sb
      .from("episodes")
      .select("id,title,audio_url,video_url,mux_playback_id")
      .eq("id", episodeId)
      .maybeSingle();
    ep = podcastEp;
    contentType = "episode";
  }

  if (!ep) return new NextResponse("Episode not found", { status: 404 });

  const audioUrl = "audio_url" in ep ? ep.audio_url : null;
  const source =
    audioUrl ??
    ep.video_url ??
    (ep.mux_playback_id ? `https://stream.mux.com/${ep.mux_playback_id}/high.mp4` : null);

  if (!source) return new NextResponse("No audio/video source for episode", { status: 422 });

  const schemaReady = await transcriptsTableReady(sb);

  if (!schemaReady) {
    return NextResponse.json({
      ok: false,
      status: "pending_schema",
      episodeId: ep.id,
      contentType,
      title: ep.title,
      source,
      schema: AI_SEARCH_SCHEMA,
      message:
        "Apply supabase/migrations/0011_ai_search.sql (vector extension, transcripts, content_embeddings) before running transcription jobs.",
    });
  }

  const { data: existing } = await sb
    .from("transcripts")
    .select("id,language,provider,segments,created_at")
    .eq("content_id", ep.id)
    .eq("content_type", contentType)
    .maybeSingle();

  const segmentCount = Array.isArray(existing?.segments) ? existing.segments.length : 0;

  const { count: embeddingCount } = await sb
    .from("content_embeddings")
    .select("id", { count: "exact", head: true })
    .eq("content_id", ep.id)
    .eq("content_type", contentType);

  return NextResponse.json({
    ok: false,
    status: "pending_pipeline",
    episodeId: ep.id,
    contentType,
    title: ep.title,
    source,
    schema: AI_SEARCH_SCHEMA,
    existing: {
      transcript: existing
        ? {
            id: existing.id,
            language: existing.language,
            provider: existing.provider,
            segmentCount,
            createdAt: existing.created_at,
          }
        : null,
      embeddingChunks: embeddingCount ?? 0,
    },
    nextSteps: [
      "Implement lib/transcribe.ts (Whisper or provider)",
      "Upsert transcripts row with segments JSONB",
      "Chunk + embed via future lib/embeddings.ts (1536-dim)",
      "Use lib/semantic-search.ts searchEmbeddings() for query",
    ],
    message:
      "Schema ready. Transcription and embedding generation not yet implemented — episode validated and source resolved.",
  });
}