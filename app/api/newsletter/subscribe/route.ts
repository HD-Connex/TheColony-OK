import { NextResponse } from "next/server";
import { rateLimit, keyFromRequest, tooManyRequests } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase";
import { sendNewsletterConfirmEmail } from "@/lib/email";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://thecolonyok.com";

/** Rate-limited double opt-in signup. Inserts pending row + sends confirm email with token. */
export async function POST(req: Request) {
  const rl = await rateLimit(keyFromRequest(req, "newsletter"), { limit: 5, windowSec: 3600 });
  if (!rl.ok) return tooManyRequests(rl);

  const { email, source, county } = await req.json().catch(() => ({}));
  if (!email || typeof email !== "string") return NextResponse.json({ error: "Email required" }, { status: 400 });

  const clean = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const sb = supabaseAdmin();
  const token = crypto.randomUUID();

  const finalSource = [source || "web", county ? `county:${county}` : ""].filter(Boolean).join("|");
  const { error } = await sb.from("newsletter_subscribers").upsert(
    {
      email: clean,
      token,
      source: finalSource,
      confirmed_at: null,
      unsubscribed_at: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email" },
  );

  if (error) {
    console.error("[newsletter] upsert", error);
    return NextResponse.json({ error: "Could not subscribe" }, { status: 503 });
  }

  const confirmUrl = `${SITE}/newsletter/confirm?token=${token}`;
  const unsubUrl = `${SITE}/newsletter/unsubscribe?token=${token}`;

  await sendNewsletterConfirmEmail(clean, { confirmUrl, unsubscribeUrl: unsubUrl });

  return NextResponse.json({ ok: true, pending: true });
}
