// Clip moderation endpoint for Phase 2 layer.
// Per ruflo-aidefence (safety-scan / pii-detect), vercel:vercel-functions (admin check, DB update), TDD.
// Admin-only for now (later integrate with contributor approval or role).
// Calls safety on clip (stub or metadata), updates approved + score.

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Stub for ruflo-aidefence safety (in real: import and call with clip metadata or re-scan)
async function runSafetyScan(clip: any): Promise<{ safe: boolean; score: number; reason?: string }> {
  // Simulate: if clip has 'toxic' in tags or low score, block. Real impl would use the skill/MCP or @ruflo/aidefence
  if (clip.tags?.includes('toxic') || (clip.ai_score || 0) < 0) {
    return { safe: false, score: 0, reason: 'Toxic or PII detected by safety-scan' };
  }
  const score = clip.ai_score || 85; // from prior AI
  return { safe: true, score };
}

// Lazy supabase client factory (avoids top-level env issues in build; per vercel best practices + worktree isolation)
// Guard for missing env (common in isolated worktree builds without .env)
const getSupabase = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null as any; // dummy for build collection
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

export const runtime = 'nodejs';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return jsonError('Supabase not configured (build stub)', 500);
    }

    // Simple admin check (vercel:auth + project patterns; enhance with real roles later)
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.includes('admin')) { // placeholder for real admin token/role
      return jsonError('Forbidden - admin required', 403);
    }

    const { clipId, action } = await req.json();
    if (!clipId || !['approve', 'reject'].includes(action)) {
      return jsonError('Invalid payload', 400);
    }

    // Fetch clip
    const { data: clip, error: fetchErr } = await supabase
      .from('clips')
      .select('*')
      .eq('id', clipId)
      .single();

    if (fetchErr || !clip) {
      return jsonError('Clip not found', 404);
    }

    if (action === 'reject') {
      await supabase.from('clips').update({ approved: false }).eq('id', clipId);
      return NextResponse.json({ id: clipId, approved: false });
    }

    // Approve path: run safety (ruflo-aidefence)
    const scan = await runSafetyScan(clip);
    if (!scan.safe) {
      await supabase.from('clips').update({ approved: false }).eq('id', clipId);
      return jsonError(scan.reason || 'Blocked by safety-scan / pii-detect', 400);
    }

    // Update approved + score
    const { data: updated } = await supabase
      .from('clips')
      .update({ approved: true, ai_score: scan.score })
      .eq('id', clipId)
      .select('id, approved, ai_score')
      .single();

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[clips/moderate] unexpected error', err);
    return jsonError('Internal server error', 500);
  }
}
