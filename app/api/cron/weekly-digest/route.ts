import { NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { sendNewsletterDigest } from "@/lib/email";

/**
 * Weekly digest cron (Vercel Cron or manual with CRON_SECRET).
 * - Collects recent published articles + episodes.
 * - Sends to every confirmed, non-unsubscribed subscriber.
 * - Uses the digest email template.
 */
export async function GET(req: Request) {
  if (!requireCronSecret(req)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const sb = supabaseAdmin();
  const since = new Date(Date.now() - 1000 * 3600 * 24 * 8).toISOString(); // last ~8 days

  // Top content
  const [{ data: arts }, { data: eps }] = await Promise.all([
    sb.from("articles").select("slug,title,dek,published_at").eq("status", "published").gte("published_at", since).order("published_at", { ascending: false }).limit(5),
    sb.from("episodes").select("id,title,description,published_at").gte("published_at", since).order("published_at", { ascending: false }).limit(3),
  ]);

  const items = [
    ...(arts || []).map((a: any) => ({ title: a.title, url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://thecolonyok.com"}/stories/${a.slug}`, dek: a.dek })),
    ...(eps || []).map((e: any) => ({ title: e.title, url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://thecolonyok.com"}/podcasts/${e.id}`, dek: e.description })),
  ].slice(0, 7);

  if (items.length === 0) {
    return NextResponse.json({ ok: true, skipped: "no new content" });
  }

  const { data: subs } = await sb
    .from("newsletter_subscribers")
    .select("email, token")
    .is("confirmed_at", "not.null")
    .is("unsubscribed_at", "null")
    .limit(5000);

  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://thecolonyok.com";
  let sent = 0;

  for (const sub of subs || []) {
    const unsub = `${site}/newsletter/unsubscribe?token=${sub.token}`;
    try {
      await sendNewsletterDigest(sub.email, {
        subject: "The Briefing — This Week in Oklahoma",
        items,
        unsubscribeUrl: unsub,
      });
      sent++;
    } catch {}
  }

  return NextResponse.json({ ok: true, sent, recipients: (subs || []).length });
}
