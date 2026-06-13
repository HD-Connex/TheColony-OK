/**
 * Phase 2 Full AI Suite: Real auto-transcription (replaces stub).
 * 
 * - Uses Whisper via GROQ_API_KEY (whisper-large-v3, preferred) or OPENAI_API_KEY (whisper-1).
 * - For YouTube/audio direct media URLs: downloads + sends to Whisper (25MB cap).
 *   YT watch URLs are not direct audio; degrade gracefully (no-op). Use mux asset recordings or RSS audio.
 * - Stores timed segments + provider to `transcripts` table (content_type 'episode'; migration 0011+0016 supports).
 * - Also stores derived SRT text (computed from segments; no extra column).
 * - Chunks + embeddings delegated to semantic-search on ingest (see cron + job).
 * - Wire points: lib/rss-ingest (post-episode insert), app/api/webhooks/mux (asset.ready for episodes with audio), /api/jobs/transcribe generalized.
 * - Gated: if no AI key, returns null (no fake data, warn in logs).
 * - Reuses patterns from jobs/transcribe/route.ts (direct fetch, verbose_json for timed segments).
 */

import { supabaseAdmin, supabaseConfigured } from "./supabase";
import { log } from "./log";

export interface TranscriptSegment {
  start: number; // seconds
  end: number;
  text: string;
  speaker?: string; // for multi-host
}

export interface Transcript {
  episodeId: string;
  segments: TranscriptSegment[];
  language?: string;
  generatedAt: string;
  provider: 'whisper' | 'groq' | 'openai' | 'mux' | 'stub'; // stub only for degrade
  confidence?: number;
  srt?: string; // computed SRT for download/export
}

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

function resolveWhisperProvider(): { endpoint: string; apiKey: string; model: string; label: string } | null {
  if (process.env.GROQ_API_KEY?.trim()) {
    return {
      endpoint: 'https://api.groq.com/openai/v1/audio/transcriptions',
      apiKey: process.env.GROQ_API_KEY.trim(),
      model: 'whisper-large-v3',
      label: 'groq',
    };
  }
  if (process.env.OPENAI_API_KEY?.trim()) {
    return {
      endpoint: 'https://api.openai.com/v1/audio/transcriptions',
      apiKey: process.env.OPENAI_API_KEY.trim(),
      model: 'whisper-1',
      label: 'openai',
    };
  }
  return null;
}

function isDirectMediaUrl(url: string): boolean {
  const u = url.toLowerCase();
  if (u.includes('youtube.com') || u.includes('youtu.be') || u.includes('youtube')) return false; // needs extract; no direct
  return /\.(mp3|mp4|m4a|wav|webm|aac|ogg|m3u8?)/i.test(u) || u.includes('/audio/') || u.includes('media.');
}

function segmentsToSrt(segments: TranscriptSegment[]): string {
  return segments
    .map((seg, i) => {
      const start = formatSrtTime(seg.start);
      const end = formatSrtTime(seg.end || (seg.start + 5));
      return `${i + 1}\n${start} --> ${end}\n${seg.text.trim()}\n`;
    })
    .join('\n');
}

function formatSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

/** Core: download audio, Whisper -> timed segments. Returns null on missing keys / non-media / failure (graceful). */
async function transcribeMediaToSegments(
  url: string,
  language = 'en'
): Promise<{ segments: TranscriptSegment[]; provider: string } | null> {
  const provider = resolveWhisperProvider();
  if (!provider) {
    log.warn('[transcripts] No transcription provider (GROQ_API_KEY or OPENAI_API_KEY) — skipping');
    return null;
  }
  if (!isDirectMediaUrl(url)) {
    log.warn('[transcripts] Non-direct audio URL (likely YouTube embed page) — skipping Whisper. Provide direct media or use Mux recording asset.');
    return null;
  }

  try {
    const media = await fetch(url, { signal: AbortSignal.timeout(60_000) });
    if (!media.ok) throw new Error(`Fetch media failed ${media.status}`);
    const blob = await media.blob();
    if (blob.size > MAX_AUDIO_BYTES) {
      log.warn('[transcripts] Media too large for Whisper', blob.size);
      return null;
    }

    const form = new FormData();
    form.append('file', blob, 'media');
    form.append('model', provider.model);
    form.append('response_format', 'verbose_json');
    form.append('language', language);

    const res = await fetch(provider.endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${provider.apiKey}` },
      body: form,
      signal: AbortSignal.timeout(240_000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Whisper API ${res.status}: ${detail.slice(0, 180)}`);
    }

    const json: any = await res.json();
    const rawSegments = (json.segments || []).map((s: any) => ({
      start: Number(s.start ?? 0),
      end: Number(s.end ?? (s.start ?? 0) + 5),
      text: String(s.text ?? '').trim(),
    })).filter((s: TranscriptSegment) => s.text);

    return {
      segments: rawSegments,
      provider: provider.label,
    };
  } catch (err) {
    log.error('[transcripts] Whisper transcription failed', err);
    return null;
  }
}

/** Real generator (replaces stub). Stores to transcripts table. Returns null gracefully if no key/media. */
export async function generateTranscript(
  episodeId: string,
  audioUrl: string | null,
  options?: { language?: string; contentType?: 'episode' | 'video_episode' }
): Promise<Transcript | null> {
  const contentType = options?.contentType || 'episode';
  if (!audioUrl) return null;
  if (!supabaseConfigured()) return null;

  const result = await transcribeMediaToSegments(audioUrl, options?.language || 'en');
  if (!result || !result.segments.length) {
    return null;
  }

  const segments = result.segments;
  const srt = segmentsToSrt(segments);
  const now = new Date().toISOString();

  // Upsert to transcripts table (segments JSONB + provider). Supports episode/video/clip via prior migrations.
  const sb = supabaseAdmin();
  const { error } = await sb.from('transcripts').upsert(
    {
      content_id: episodeId,
      content_type: contentType,
      language: options?.language || 'en',
      segments,
      provider: result.provider,
      updated_at: now,
    },
    { onConflict: 'content_id,content_type,language' }
  );
  if (error) {
    log.warn('[transcripts] upsert to transcripts table failed', error.message);
  }

  // Best-effort: also embed chunks (delegates to semantic-search embed). Non-fatal.
  try {
    const { embedQuery } = await import('./semantic-search');
    for (const seg of segments.slice(0, 12)) {
      if (!seg.text) continue;
      const vec = await embedQuery(seg.text);
      if (vec) {
        // fire-and-forget; non-blocking for transcript flow
        void (sb.from('content_embeddings').insert({
          content_type: contentType,
          content_id: episodeId,
          chunk: seg.text.slice(0, 900),
          embedding: vec,
          chunk_index: Math.floor(seg.start),
        }) as any).catch(() => {});
      }
    }
  } catch {}

  return {
    episodeId,
    segments,
    language: options?.language || 'en',
    generatedAt: now,
    provider: result.provider as any,
    srt,
  };
}

/** Fetch existing from transcripts table or trigger generate + store. */
export async function getOrGenerateTranscript(
  episodeId: string,
  audioUrl: string | null,
  options?: { language?: string; contentType?: 'episode' | 'video_episode' }
): Promise<Transcript | null> {
  if (!episodeId || !supabaseConfigured()) return null;

  const sb = supabaseAdmin();
  const contentType = options?.contentType || 'episode';
  const { data: existing } = await sb
    .from('transcripts')
    .select('segments, language, provider, created_at, updated_at')
    .eq('content_id', episodeId)
    .eq('content_type', contentType)
    .maybeSingle();

  if (existing && (existing as any).segments?.length) {
    const segs: TranscriptSegment[] = (existing as any).segments;
    return {
      episodeId,
      segments: segs,
      language: (existing as any).language || 'en',
      generatedAt: (existing as any).updated_at || (existing as any).created_at,
      provider: ((existing as any).provider || 'whisper') as any,
      srt: segmentsToSrt(segs),
    };
  }

  if (!audioUrl) return null;
  return generateTranscript(episodeId, audioUrl, options);
}

/** Client helper: search segments (for EpisodePlayer transcript panel search) */
export function searchTranscript(transcript: Transcript, query: string): TranscriptSegment[] {
  if (!query.trim()) return transcript.segments;
  const q = query.toLowerCase();
  return transcript.segments.filter(seg => seg.text.toLowerCase().includes(q));
}

/** Format time for transcript UI */
export function formatTranscriptTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Export SRT string (for download buttons in player / clipper surfaces). */
export function exportSrt(transcript: Transcript | null): string {
  if (!transcript || !transcript.srt) return '';
  return transcript.srt;
}

// Note: on cron ingest (rss-ingest), post-insert for new episodes with audio_url we call generateTranscript.
// On mux webhook asset.ready we attempt for episodes that carry audio_url (Mux recordings use generated subs or separate audio).
// Chunks to embeddings happen inside generate + in transcribe job for clips.
// Surface: EpisodePlayer (panel + seek + clipper), search results use TranscriptClipper for jump.
