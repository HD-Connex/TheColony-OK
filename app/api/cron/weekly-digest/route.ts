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
    sb.from("articles").select("slug,title,dek,published_at,county").eq("status", "published").gte("published_at", since).order("published_at", { ascending: false }).limit(5),
    sb.from("episodes").select("id,title,description,published_at").gte("published_at", since).order("published_at", { ascending: false }).limit(3),
  ]);

  const itemsBase = [
    ...(eps || []).map((e: any) => ({ title: e.title, url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://thecolonyok.com"}/podcasts/${e.id}`, dek: e.description })),
  ];

  const { data: subs } = await sb
    .from("newsletter_subscribers")
    .select("email, token, counties")
    .is("confirmed_at", "not.null")
    .is("unsubscribed_at", "null")
    .limit(5000);

  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://thecolonyok.com";
  let sent = 0;

  for (const sub of subs || []) {
    const userCounties = (sub as any).counties as string[] | null;
    let userArts = arts || [];
    if (userCounties && userCounties.length > 0) {
      userArts = userArts.filter((a: any) => a.county && userCounties.includes(a.county));
    }
    const userItems = [
      ...userArts.map((a: any) => ({ title: a.title, url: `${site}/stories/${a.slug}`, dek: a.dek })),
      ...itemsBase,
    ].slice(0, 7);

    if (userItems.length === 0) continue;

    const unsub = `${site}/newsletter/unsubscribe?token=${sub.token}`;
    try {
      await sendNewsletterDigest(sub.email, {
        subject: "The Briefing — This Week in Oklahoma",
        items: userItems,
        unsubscribeUrl: unsub,
      });
      sent++;
    } catch {}
  }

  return NextResponse.json({ ok: true, sent, recipients: (subs || []).length });
}
