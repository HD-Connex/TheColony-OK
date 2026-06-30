import { NextResponse } from "next/server";
import { rateLimit, keyFromRequest, tooManyRequests } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase";
import { sendNewsletterConfirmEmail } from "@/lib/email";
import { getUserFromRequest } from "@/lib/auth-server";
// Use the new Supabase SSR client (utils/supabase/server) where possible for session/user resolution alongside bearer token auth.
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { log } from "@/lib/log";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://thecolonyok.com";

/** Rate-limited double opt-in signup (or county prefs update for members).
 * Accepts `county` (string) or `counties` (string[]) using the `counties` text[] column added in 0021_county_feeds.sql.
 * Uses existing county (single) or array support.
 * For authenticated callers (my-counties etc) via bearer or SSR cookies: updates prefs without resetting confirmation or re-sending email.
 * Public signups still trigger double-opt-in when new/unconfirmed.
 * Also supports GET to retrieve current counties for the logged-in user (used by /my-counties).
 */
export async function POST(req: Request) {
  const rl = await rateLimit(keyFromRequest(req, "newsletter"), { limit: 5, windowSec: 3600 });
  if (!rl.ok) return tooManyRequests(rl);

  const body = await req.json().catch(() => ({}));
  const { email: bodyEmail, source, county, counties: bodyCounties, lists: bodyLists } = body;

  // Resolve logged-in user (new SSR client + legacy bearer for this project's localStorage auth pattern)
  let authedUser = await getUserFromRequest(req);
  try {
    const cookieStore = await cookies();
    const supaSsr = createClient(cookieStore);
    const { data: { user: ssrUser } } = await supaSsr.auth.getUser();
    if (ssrUser && !authedUser) authedUser = ssrUser;
  } catch {
    // cookie-based may not be present for localStorage sessions; bearer is primary
  }

  const effectiveEmail = (authedUser?.email || bodyEmail);
  if (!effectiveEmail || typeof effectiveEmail !== "string") {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const clean = effectiveEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  // Normalize to counties array (supports single "county" string OR "counties" array from form or my-counties)
  let countiesArr: string[] = [];
  if (Array.isArray(bodyCounties)) {
    countiesArr = bodyCounties.map((c: any) => String(c).trim()).filter(Boolean);
  } else if (typeof county === "string" && county.trim()) {
    countiesArr = [county.trim()];
  }

  // Multiple lists (daily/county/alerts) from enhanced NewsletterForm + /newsletter/preferences (Phase 1)
  let listsArr: string[] = [];
  if (Array.isArray(bodyLists)) {
    listsArr = bodyLists.map((l: any) => String(l).trim().toLowerCase()).filter((l) => ["daily", "county", "alerts"].includes(l));
  }

  const sb = supabaseAdmin();

  // Fetch existing to avoid resetting confirmed status / token on prefs updates
  const { data: existing } = await sb
    .from("newsletter_subscribers")
    .select("token, confirmed_at, source, counties")
    .eq("email", clean)
    .maybeSingle();

  const token = existing?.token || crypto.randomUUID();

  const finalSource = [
    source || (existing?.source || "web"),
    countiesArr.length ? `counties:${countiesArr.join(",")}` : (county ? `county:${county}` : ""),
    listsArr.length ? `lists:${listsArr.join(",")}` : "",
  ].filter(Boolean).join("|");

  const upsertPayload: any = {
    email: clean,
    token,
    source: finalSource,
    updated_at: new Date().toISOString(),
  };

  // Only force unconfirmed + send email for true (re)signups from public forms; member prefs updates preserve state
  const isPublicSignup = !authedUser || (source && source !== "my-counties");
  if (!existing || (isPublicSignup && !existing.confirmed_at)) {
    upsertPayload.confirmed_at = null;
    upsertPayload.unsubscribed_at = null;
  }

  // Set / update the counties array column (the proper storage per 0021 migration; supports 0..N counties)
  if (countiesArr.length > 0 || bodyCounties !== undefined || county !== undefined) {
    upsertPayload.counties = countiesArr.length > 0 ? countiesArr : null;
  }

  // Set / update lists (0028 migration adds lists text[]; parallel to counties for daily/county/alerts etc)
  if (listsArr.length > 0 || bodyLists !== undefined) {
    upsertPayload.lists = listsArr.length > 0 ? listsArr : null;
  }

  const { error } = await sb.from("newsletter_subscribers").upsert(upsertPayload, { onConflict: "email" });

  if (error) {
    log.error("[newsletter] upsert", error);
    return NextResponse.json({ error: "Could not subscribe" }, { status: 503 });
  }

  // Only send double-opt-in confirm for new/unconfirmed public signups (not for member county prefs saves)
  const shouldSendConfirm = !existing || (isPublicSignup && !existing.confirmed_at);
  if (shouldSendConfirm) {
    const confirmUrl = `${SITE}/newsletter/confirm?token=${token}`;
    const unsubUrl = `${SITE}/newsletter/unsubscribe?token=${token}`;
    await sendNewsletterConfirmEmail(clean, { confirmUrl, unsubscribeUrl: unsubUrl });
  }

  return NextResponse.json({ ok: true, pending: shouldSendConfirm, counties: countiesArr, lists: listsArr });
}

/** GET current newsletter prefs (esp. counties array) for the authenticated user.
 * Used by /my-counties to pre-populate selection. Requires session (bearer or SSR cookies).
 * Does not rate-limit reads.
 */
export async function GET(req: Request) {
  // Resolve user via bearer (project convention) + new SSR client cookies where available
  let authedUser = await getUserFromRequest(req);
  try {
    const cookieStore = await cookies();
    const supaSsr = createClient(cookieStore);
    const { data: { user: ssrUser } } = await supaSsr.auth.getUser();
    if (ssrUser && !authedUser) authedUser = ssrUser;
  } catch {}

  if (!authedUser?.email) {
    return NextResponse.json({ error: "Authentication required for preferences" }, { status: 401 });
  }

  const clean = authedUser.email.trim().toLowerCase();
  const sb = supabaseAdmin();
  const { data } = await sb
    .from("newsletter_subscribers")
    .select("email, counties, confirmed_at, source, updated_at, lists")
    .eq("email", clean)
    .maybeSingle();

  return NextResponse.json({
    email: authedUser.email,
    counties: (data?.counties as string[]) || [],
    lists: (data?.lists as string[]) || [],
    confirmed: !!data?.confirmed_at,
    source: data?.source || null,
  });
}
