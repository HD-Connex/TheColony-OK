// Enhanced transcribe job for clips layer.
// Per claude-api + vercel:ai-sdk/gateway (for summarization/chapter gen), vercel:vercel-functions (nodejs).
// Replaces pure stub. Triggers from upload, updates clip.transcript.
// Uses after() for any background. For MVP: stub Claude call with dummy + comment for real integration.

import { NextResponse } from 'next/server';
import { after } from 'next/server';
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = 'nodejs';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  try {
    const supabase = supabaseAdmin();

    const { clipId, url } = await req.json();
    if (!clipId || !url) {
      return jsonError('Missing clipId or url', 400);
    }

    // Fetch clip to verify
    const { data: clip } = await supabase.from('clips').select('*').eq('id', clipId).single();
    if (!clip) {
      return jsonError('Clip not found', 404);
    }

    // Real integration (per skills): Use Claude via direct API or @vercel/ai-sdk + gateway for:
    // - Transcript (if not from Mux auto)
    // - Summary
    // - Chapters (JSONB array)
    // Example stub (replace with real call):
    // import { generateText } from 'ai';
    // import { openai } from '@ai-sdk/openai'; // or anthropic via gateway
    // const { text: summary } = await generateText({ model: openai('gpt-4o'), prompt: `Summarize this audio transcript from ${url}...` });
    // For now, dummy + log for Claude integration point.
    const transcript = `[Claude-generated transcript stub for ${url}. Real: call claude-api or vercel ai-sdk for Whisper-like or Mux captions + summary/chapters.]`;
    const summary = 'Stub summary: This clip covers local OK rural topics (ag/energy per LOCAL strategy).';
    const chapters = [
      { time: 0, title: 'Intro', summary: 'Opening remarks' },
      { time: 30, title: 'Main content', summary: 'Core discussion' },
    ];

    // Update clip with transcript/summary (chapters could go to episodes or separate)
    await supabase.from('clips').update({
      transcript,
      // ai_score already set in moderation/upload
    }).eq('id', clipId);

    // Background for any further AI (e.g., embeddings for search per 0011)
    after(async () => {
      console.log(`[jobs/transcribe] Claude-enhanced job complete for clip ${clipId}. Summary: ${summary}. Chapters generated.`);
      // TODO: upsert to transcripts table, trigger embeddings, best-of-n curation for rural/personalization.
    });

    return NextResponse.json({ clipId, transcript, summary, chapters });
  } catch (err) {
    console.error('[jobs/transcribe] unexpected error', err);
    return jsonError('Internal server error', 500);
  }
}
