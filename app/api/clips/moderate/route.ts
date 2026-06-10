// Clip moderation endpoint.
// Admin-only: real role check via lib/admin-auth (members.role), with a
// service-token path for machine callers. Every clip requires explicit
// human approval — there is no auto-approve scan path.

import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, requireServiceToken } from "@/lib/admin-auth";
import { rateLimit, keyFromRequest, tooManyRequests } from "@/lib/rate-limit";
import { log } from "@/lib/log";

export const runtime = 'nodejs';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  try {
    const rl = await rateLimit(keyFromRequest(req, 'clips-moderate'), { limit: 60, windowSec: 60 });
    if (!rl.ok) return tooManyRequests(rl);

    // Real admin auth: Supabase user with members.role in (admin, editor),
    // or a machine caller with ADMIN_SERVICE_TOKEN.
    const admin = await requireAdmin(req, 'editor');
    if (!admin && !requireServiceToken(req)) {
      return jsonError('Forbidden - admin required', 403);
    }

    const { clipId, action } = await req.json();
    if (!clipId || !['approve', 'reject'].includes(action)) {
      return jsonError('Invalid payload', 400);
    }

    const supabase = supabaseAdmin();
    const { data: clip, error: fetchErr } = await supabase
      .from('clips')
      .select('*')
      .eq('id', clipId)
      .single();

    if (fetchErr || !clip) {
      return jsonError('Clip not found', 404);
    }

    const approved = action === 'approve';
    const { data: updated, error: updateErr } = await supabase
      .from('clips')
      .update({ approved })
      .eq('id', clipId)
      .select('id, approved, ai_score')
      .single();

    if (updateErr || !updated) {
      return jsonError('Failed to update clip', 500);
    }

    return NextResponse.json(updated);
  } catch (err) {
    log.error('[clips/moderate] unexpected error', err);
    return jsonError('Internal server error', 500);
  }
}
