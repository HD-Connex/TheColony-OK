"use client";

/**
 * Layer 1 Perfection: Auto-transcript stub + integration points.
 * 
 * Stub for AI-generated transcripts (e.g. via Whisper/OpenAI or Mux captions later).
 * - On episode ingest/cron: call generateTranscript(episodeId, audioUrl)
 * - Store in episodes.transcript_url or transcripts table (future FK)
 * - Integrate to EpisodePlayer: show transcript tab/panel, searchable, chapter-aligned highlights.
 * - SEO: expose in per-ep JsonLd as hasPart or transcript.
 * - Perf: lazy load panel, virtualized list for long transcripts, client-side search.
 * - Errors: graceful fallback (no transcript UI hidden), retry with backoff.
 * - A11y: keyboard nav in transcript, aria for timestamps, captions sync if video.
 * 
 * Future: full table + RLS for member-only full text; AI chapters auto from transcript.
 * Competitive: Blaze has full-ep transcripts; we exceed with OK-local searchable + timestamp sync + export.
 */

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
  provider: 'stub' | 'whisper' | 'mux' | 'openai';
  confidence?: number;
}

/** Stub generator - replace with real API call in prod (e.g. /api/transcribe POST) */
export async function generateTranscriptStub(
  episodeId: string,
  audioUrl: string | null,
  options?: { language?: string }
): Promise<Transcript | null> {
  if (!audioUrl) {
    console.warn('[transcripts] No audio_url for', episodeId);
    return null;
  }

  // TODO: real impl
  // const res = await fetch('/api/admin/transcribe', { method: 'POST', body: JSON.stringify({ episodeId, audioUrl, ...options }) });
  // if (!res.ok) throw new Error(`Transcript failed: ${res.status}`);
  // return res.json();

  // Stub: return empty for now (or demo segments)
  return {
    episodeId,
    segments: [
      { start: 0, end: 12, text: "[Transcript stub: Full auto-transcript generation pending AI integration. This segment would align with chapter 1.]" },
      { start: 12, end: 45, text: "Welcome to The Colony OK — filed from the field in Oklahoma." },
    ],
    language: options?.language || 'en',
    generatedAt: new Date().toISOString(),
    provider: 'stub',
    confidence: 0.0,
  };
}

/** Fetch existing or trigger generate. Cache in future with SWR or react-query. */
export async function getOrGenerateTranscript(episodeId: string, audioUrl: string | null): Promise<Transcript | null> {
  // In real: query supabase for existing transcript by episode_id
  // if not and audio, generate + upsert
  return generateTranscriptStub(episodeId, audioUrl);
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

// TODO Layer1 extension: hook into EpisodePlayer for <TranscriptPanel transcript={t} onSeek={(t) => player.seek(t)} />
// TODO: on cron ingest, background job for new episodes with audio/video_url
// TODO: 24/7 tie-in: live captioning stub for 24/7 channel (separate service)
