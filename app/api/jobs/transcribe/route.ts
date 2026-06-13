// Transcription job for clips + podcast audio. Internal endpoint — requires
// ADMIN_SERVICE_TOKEN (machine callers) or an admin/editor user.
//
// Real transcription via Whisper:
//   - GROQ_API_KEY  → whisper-large-v3 (fast/cheap, preferred)
//   - OPENAI_API_KEY → whisper-1
// Without either key the job reports unavailable — it never writes fake
// transcript text to the database.

import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, requireServiceToken } from "@/lib/admin-auth";
import { withRetry } from "@/lib/jobs";
import { log } from "@/lib/log";

export const runtime = 'nodejs';
export const maxDuration = 300;

const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // Whisper API limit

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

interface WhisperProvider {
  endpoint: string;
  apiKey: string;
  model: string;
}

function resolveProvider(): WhisperProvider | null {
  if (process.env.GROQ_API_KEY) {
    return {
      endpoint: 'https://api.groq.com/openai/v1/audio/transcriptions',
      apiKey: process.env.GROQ_API_KEY,
      model: 'whisper-large-v3',
    };
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      endpoint: 'https://api.openai.com/v1/audio/transcriptions',
      apiKey: process.env.OPENAI_API_KEY,
      model: 'whisper-1',
    };
  }
  return null;
}

async function transcribeUrl(url: string, provider: WhisperProvider): Promise<string | any> {
  const media = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!media.ok) throw new Error(`Failed to fetch media (${media.status})`);
  const blob = await media.blob();
  if (blob.size > MAX_AUDIO_BYTES) {
    throw new Error(`Media too large for transcription API (${blob.size} bytes)`);
  }

  const form = new FormData();
  form.append('file', blob, 'media');
  form.append('model', provider.model);
  // Phase 3: verbose_json for timed segments (start/end) for jump-to + auto-clips
  form.append('response_format', 'verbose_json');

  const res = await fetch(provider.endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${provider.apiKey}` },
    body: form,
    signal: AbortSignal.timeout(240_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Transcription API ${res.status}: ${detail.slice(0, 200)}`);
  }
  // verbose_json returns object; plain would be text. Caller handles.
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('json')) {
    return res.json();
  }
  return (await res.text()).trim();
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req, 'editor');
    if (!admin && !requireServiceToken(req)) {
      return jsonError('Forbidden', 403);
    }

    const body = await req.json();
    const { clipId, episodeId, url, contentId, contentType } = body as { clipId?: string; episodeId?: string; url?: string; contentId?: string; contentType?: 'episode'|'video_episode'|'clip' };
    const id = clipId || episodeId || contentId;
    const cType = contentType || (clipId ? 'clip' : 'episode');
    if (!id || !url || typeof url !== 'string') {
      return jsonError('Missing id (clipId or episodeId) or url', 400);
    }

    const supabase = supabaseAdmin();
    if (clipId) {
      const { data: clip } = await supabase.from('clips').select('id').eq('id', clipId).single();
      if (!clip) return jsonError('Clip not found', 404);
    } else if (episodeId || contentId) {
      // episodes or video_episodes: existence optional for transcript (we store in transcripts table)
      const table = cType === 'video_episode' ? 'video_episodes' : 'episodes';
      const { data: ep } = await supabase.from(table).select('id').eq('id', id).maybeSingle();
      if (!ep) {
        // still allow (may be from webhook before row visible); proceed to transcripts
      }
    }

    const provider = resolveProvider();
    if (!provider) {
      return NextResponse.json(
        { clipId, status: 'unavailable', reason: 'No transcription provider configured (GROQ_API_KEY or OPENAI_API_KEY)' },
        { status: 503 },
      );
    }

    const transcriptOrVerbose = await withRetry(() => transcribeUrl(url, provider), { attempts: 2 });

    // Phase 3: support verbose_json (timed segments) for jump-to-moment + auto-clips
    let transcript: string;
    let segments: any[];
    if (typeof transcriptOrVerbose === 'string') {
      transcript = transcriptOrVerbose;
      segments = [{ start: 0, end: null, text: transcript }];
    } else {
      transcript = (transcriptOrVerbose as any).text || '';
      segments = ((transcriptOrVerbose as any).segments || []).map((s: any) => ({
        start: s.start ?? 0,
        end: s.end ?? null,
        text: s.text ?? '',
      }));
    }

    if (clipId) {
      await supabase.from('clips').update({ transcript }).eq('id', clipId);
    } // for episodes: transcript lives only in unified transcripts table (no episodes.transcript column assumed)

    // Mirror into transcripts table for unified search (rich timed segments). Supports episode + clip (Phase 2).
    const { error: trErr } = await supabase.from('transcripts').upsert(
      {
        content_id: id,
        content_type: cType,
        language: 'en',
        segments,
        provider: provider.model,
      },
      { onConflict: 'content_id,content_type,language' },
    );
    if (trErr) log.warn('[jobs/transcribe] transcripts upsert failed', trErr.message);

    // Phase 3/2: chunk + embed timed segments for semantic + time-aware search (also for episodes)
    try {
      const { embedQuery } = await import('@/lib/semantic-search');
      for (const seg of segments.slice(0, 12)) {
        if (!seg.text) continue;
        const vec = await embedQuery(seg.text);
        if (vec) {
          try {
            await supabase.from('content_embeddings').insert({
              content_type: cType,
              content_id: id,
              chunk: seg.text.slice(0, 900),
              embedding: vec,
              chunk_index: Math.floor(seg.start || 0),
            });
          } catch {}
        }
      }
    } catch {}

    // Phase 3 polish: LLM summaries + chapters from transcript (uses same Groq/OpenAI key as Whisper)
    // Stores chapters in a simple way (for episodes this would upsert to episodes.chapters jsonb + summary).
    // For clips we log / could attach to clip metadata. Real episodes path re-uses the same after RSS ingest or separate job.
    try {
      const chatKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
      if (chatKey && transcript && transcript.length > 150) {
        const isGroq = !!process.env.GROQ_API_KEY;
        const endpoint = isGroq
          ? "https://api.groq.com/openai/v1/chat/completions"
          : "https://api.openai.com/v1/chat/completions";
        const model = isGroq ? "llama-3.1-8b-instant" : "gpt-4o-mini";

        const prompt = `From this transcript, produce a short 1-2 sentence summary and 4-8 chapters as JSON array of {t: seconds, label: string}. Transcript:\n\n${transcript.slice(0, 4000)}`;

        const chatRes = await fetch(endpoint, {
          method: "POST",
          headers: { Authorization: `Bearer ${chatKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
          }),
          signal: AbortSignal.timeout(30000),
        });

        if (chatRes.ok) {
          const chatJson: any = await chatRes.json();
          const content = chatJson.choices?.[0]?.message?.content || "{}";
          let parsed: any = {};
          try { parsed = JSON.parse(content); } catch {}
          // Store summary on the clip (reuses source_phrase for visibility in feeds; for episodes use episodes.summary / chapters jsonb)
          // chapters could be stored in transcripts.segments or a dedicated chapters field
          // Note: summary is generated but not overwriting clip.source_phrase (preserves original spoken phrase for moments).
          // For future: store in episodes.summary / a metadata jsonb, or dedicated summary column.
          console.log("[transcribe] LLM summary/chapters generated for", id, { summary: parsed.summary, chapters: parsed.chapters?.length || 0 });
        }
      }
    } catch (e) {
      // non-fatal
    }

    return NextResponse.json({ id, contentType: cType, status: 'done', transcript });
  } catch (err) {
    log.error('[jobs/transcribe] unexpected error', err);
    return jsonError('Transcription failed', 500);
  }
}
