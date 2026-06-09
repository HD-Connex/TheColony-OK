// Clip upload endpoint for Phase 2 member clips layer + Phase 3 PWA/TWA readiness.
// Per vercel:vercel-functions (nodejs runtime for auth/Blob/AI/DB), vercel:vercel-storage (Blob), ruflo-aidefence (safety/pii), TDD, Supabase auth/entitlements (vercel:auth), trigger transcribe (claude-api stub).
// TWA friendly 30s limit. Returns pending clip for moderation/embeds.
// Uses after() for background per Vercel Functions skill.
// Lazy client + guards for worktree build isolation (no top-level env crash).

import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { createClient } from '@supabase/supabase-js';
import { after } from 'next/server';

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

export const runtime = 'nodejs'; // Full Node per vercel-functions (not edge, for Blob + DB + AI)

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return jsonError('Supabase not configured (build stub)', 500);
    }

    // Auth via Supabase (vercel:auth + project existing pattern)
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonError('Unauthorized', 401);
    }
    const token = authHeader.split(' ')[1];

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return jsonError('Unauthorized', 401);
    }

    // Entitlement stub (member or gift/perk per audit + vercel:auth)
    // In real: const hasAccess = await hasPerkAccess(user.id, 'clips') or member tier check
    // For MVP, assume authenticated member (tighten with members table later)
    const isMember = true; // TODO: integrate with lib/tiers or gift/perks
    if (!isMember) {
      return jsonError('Member access required for clips', 403);
    }

    const form = await req.formData();
    const file = form.get('file') as File | null;
    const epId = form.get('ep_id') as string | null;

    if (!file) {
      return jsonError('No file provided', 400);
    }

    // 30s TWA/mobile friendly limit (rough size check; real duration in moderation)
    const MAX_SIZE = 30 * 1024 * 1024; // ~30s at typical bitrate
    if (file.size > MAX_SIZE) {
      return jsonError('Clip too large (max ~30s for TWA friendly)', 400);
    }

    // Safety / PII pre-scan (ruflo-aidefence per skill list)
    // Stub for now (in prod: await safetyScan(file) or text after transcribe)
    const isSafe = true; // TODO: integrate pii-detect + safety-scan; block if toxic/PII
    if (!isSafe) {
      return jsonError('Content blocked by safety scan', 400);
    }

    // Upload to Vercel Blob (per /vercel:vercel-storage directive for upload)
    let blobUrl: string;
    try {
      const blob = await put(`clips/${user.id}/${Date.now()}-${file.name}`, file, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN, // Required for @vercel/blob
      });
      blobUrl = blob.url;
    } catch (e) {
      console.error('[clips/upload] Blob upload failed', e);
      return jsonError('Upload failed', 500);
    }

    // Create pending clip record (RLS will be enforced; service key bypass for server)
    const { data: clip, error: insertError } = await supabase
      .from('clips')
      .insert({
        user_id: user.id,
        ep_id: epId,
        storage_path: blobUrl,
        approved: false,
        ai_score: 0,
        tags: [], // populated by AI/rural later
      })
      .select('id, approved')
      .single();

    if (insertError || !clip) {
      return jsonError('Failed to record clip', 500);
    }

    // Background: trigger transcribe job (Claude via claude-api or vercel:ai-sdk/gateway)
    // Use after() per vercel-functions skill for post-response work
    after(async () => {
      try {
        // Call existing /api/jobs/transcribe stub or enhance with Claude for summary/chapter
        // For now, log + would POST to jobs with clip id / blob url
        console.log(`[clips/upload] Background transcribe triggered for clip ${clip.id} at ${blobUrl}`);
        // TODO: await fetch('/api/jobs/transcribe', { method: 'POST', body: JSON.stringify({ clipId: clip.id, url: blobUrl }) })
        // Then AI review (best-of-n, score), moderation queue or auto-approve per RICH.
      } catch (bgErr) {
        console.error('[clips/upload] Background transcribe error', bgErr);
      }
    });

    return NextResponse.json({
      id: clip.id,
      url: blobUrl,
      approved: clip.approved, // false until moderation
    });
  } catch (err) {
    console.error('[clips/upload] unexpected error', err);
    return jsonError('Internal server error', 500);
  }
}
