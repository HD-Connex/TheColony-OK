// Member clip upload. Auth via Supabase bearer token, real membership check
// via lib/entitlements, MIME + magic-byte validation, rate limited. Clips land
// unapproved and wait in the moderation queue (/api/clips/moderate).

import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { supabaseAdmin } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth-server";
import { getMembership } from "@/lib/entitlements";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { log } from "@/lib/log";

export const runtime = 'nodejs';

const MAX_SIZE = 30 * 1024 * 1024; // ~30s mobile clip at typical bitrate

const ALLOWED_MIME = new Set(['video/mp4', 'video/quicktime', 'video/webm']);

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Validate container magic bytes: MP4/MOV `ftyp` box or WebM EBML header. */
function hasVideoMagicBytes(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false;
  // MP4 / QuickTime: bytes 4-7 are "ftyp"
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    return true;
  }
  // WebM / Matroska: EBML header 1A 45 DF A3
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return true;
  }
  return false;
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonError('Unauthorized', 401);

    const rl = await rateLimit(`clips-upload:${user.id}`, { limit: 5, windowSec: 3600 });
    if (!rl.ok) return tooManyRequests(rl);

    const membership = await getMembership(user.id);
    if (!membership.isMember) {
      return jsonError('Member access required for clips', 403);
    }

    const form = await req.formData();
    const file = form.get('file') as File | null;
    const epId = form.get('ep_id') as string | null;
    const title = (form.get('title') as string | null)?.trim() || null;

    if (!file) return jsonError('No file provided', 400);
    if (!file.name) return jsonError('File name is required', 400);
    if (file.size > MAX_SIZE) {
      return jsonError('Clip too large (max ~30s)', 400);
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return jsonError('Unsupported file type — upload mp4, mov, or webm', 415);
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    if (!hasVideoMagicBytes(buffer)) {
      return jsonError('File does not look like a supported video container', 415);
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return jsonError('Clip uploads are temporarily unavailable', 503);
    }

    let blobUrl: string;
    try {
      const safeName = file.name.replace(/[^\w.\-]/g, '_').slice(-80);
      // Buffer accepted by @vercel/blob PutBody; cast keeps the Uint8Array bytes we already validated.
      const blob = await put(`clips/${user.id}/${Date.now()}-${safeName}`, Buffer.from(buffer), {
        access: 'public',
        contentType: file.type,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      blobUrl = blob.url;
    } catch (e) {
      log.error('[clips/upload] Blob upload failed', e);
      return jsonError('Upload failed', 500);
    }

    const { data: clip, error: insertError } = await supabaseAdmin()
      .from('clips')
      .insert({
        user_id: user.id,
        ep_id: epId,
        storage_path: blobUrl,
        approved: false, // waits in moderation queue — no auto-approve
        ai_score: 0,
        tags: [],
        source_phrase: title, // store upload title for display in /clips feed
        transcript: title,
        dispatch_type: 'upload', // Phase 3: member UGC (not pre-cleared Citizen Dispatch); requires mod before appearing in /clips feed
      })
      .select('id, approved')
      .single();

    if (insertError || !clip) {
      return jsonError('Failed to record clip', 500);
    }

    return NextResponse.json({
      id: clip.id,
      url: blobUrl,
      approved: clip.approved,
    });
  } catch (err) {
    log.error('[clips/upload] unexpected error', err);
    return jsonError('Internal server error', 500);
  }
}
