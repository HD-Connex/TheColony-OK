import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth-server";
import { getMembership } from "@/lib/entitlements";
import { rateLimit, keyFromRequest, tooManyRequests } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase";
import { sanitizeHtml } from "@/lib/sanitize";
import { put } from "@vercel/blob"; // Phase 2 clip auto: one-click moment -> Blob + auto-caption srt snippet (gated by BLOB token)

/**
 * Phase 3: Create a shareable "moment clip" from transcript search / player.
 * Member-only, pre-cleared (auto approved for platform-native clips), stores time range + phrase.
 * Returns a deep link (episode + ?t= + optional clip id).
 * For real Mux sub-clip + vertical export: can extend later with Mux clipping API + compose.
 */
export async function POST(req: Request) {
  const rl = await rateLimit(keyFromRequest(req, "clip-moment"), { limit: 20, windowSec: 3600 });
  if (!rl.ok) return tooManyRequests(rl);

  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await getMembership(user.id);
  if (!membership.isMember) {
    return NextResponse.json({ error: "Member only for clip creation" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { ep_id, start_s, end_s, phrase, title, aiSuggested } = body;

  if (!ep_id || typeof start_s !== "number" || !phrase) {
    return NextResponse.json({ error: "ep_id, start_s, phrase required" }, { status: 400 });
  }

  const safePhrase = sanitizeHtml(phrase).slice(0, 300);
  const clipTitle = (title || safePhrase).slice(0, 120);

  const sb = supabaseAdmin();
  const { data: clip, error } = await sb
    .from("clips")
    .insert({
      user_id: user.id,
      ep_id,
      start_s: Math.max(0, Math.floor(start_s)),
      end_s: end_s ? Math.floor(end_s) : null,
      source_phrase: safePhrase,
      transcript: clipTitle, // short title in transcript for now
      approved: true, // platform-native auto-clip, pre-cleared
      ai_score: aiSuggested ? 88 : 95, // Phase 2: AI quote detect lowers slightly vs user selected
      dispatch_type: 'citizen_dispatch', // Phase 3: marks as Citizen Dispatch UGC (pre-cleared transcript moment for Rumble-style feed)
      // auto-caption note: caption derived from source_phrase; for full Blob video subclip + srt would use Mux compose + @vercel/blob upload of composed (future)
    })
    .select("id, start_s")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create clip moment" }, { status: 500 });
  }

  // Phase 2 auto: upload auto-generated caption (SRT snippet from phrase) to Blob for the moment clip. Non-fatal if no token.
  let captionUrl: string | null = null;
  try {
    const duration = Math.max(1, Math.min(30, Math.floor(((end_s && end_s > start_s ? end_s : start_s + 12) - start_s)) || 12));
    const srt = `1\n00:00:00,000 --> 00:00:${String(duration).padStart(2, '0')},000\n${safePhrase}\n`;
    const blob = await put(`captions/moment-${clip.id}.srt`, srt, { access: "public", contentType: "text/plain" });
    captionUrl = blob.url;
  } catch (e) {
    // graceful: no BLOB_READ_WRITE_TOKEN or network — clip still created
  }

  // Deep link: the episode page with time + clip context
  // Client can append &clip=ID or just use t=
  return NextResponse.json({
    ok: true,
    clip_id: clip.id,
    start_s: clip.start_s,
    share_href: `/podcasts/${ep_id}?t=${clip.start_s}&clip=${clip.id}`,
    caption_url: captionUrl, // auto-caption via Blob for reuse in embeds/players
  });
}
