import { NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { sendNewsletterDigest } from "@/lib/email";
import { log } from "@/lib/log"; // Phase 2 AI briefing

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
  const [{ data: arts }, { data: eps }, { data: topClips }] = await Promise.all([
    sb.from("articles").select("slug,title,dek,published_at,county").eq("status", "published").gte("published_at", since).order("published_at", { ascending: false }).limit(5),
    sb.from("episodes").select("id,title,description,published_at").gte("published_at", since).order("published_at", { ascending: false }).limit(3),
    // Phase 3: top clips for Citizen Dispatch UGC in digest (high upvotes, recent approved). Pre-cleared moments + member clips.
    sb.from("clips").select("id, transcript, source_phrase, upvotes, dispatch_type, created_at").eq("approved", true).gte("created_at", since).order("upvotes", { ascending: false }).limit(3),
  ]);

  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://thecolonyok.com";
  const itemsBase = [
    ...(eps || []).map((e: any) => ({ title: e.title, url: `${site}/podcasts/${e.id}`, dek: e.description })),
    // Top clips (Rumble-style dispatch feed highlights) — surfaced for subscribers/members
    ...(topClips || []).map((c: any) => {
      const t = c.transcript || c.source_phrase || 'Member Dispatch';
      const typ = c.dispatch_type === 'citizen_dispatch' ? 'Citizen Dispatch' : 'Member Clip';
      return {
        title: `Top ${typ}: ${t}`.slice(0, 90),
        url: `${site}/clips`,
        dek: `${c.upvotes || 0} upvotes • ${typ} • ${new Date(c.created_at).toLocaleDateString()}`,
      };
    }),
  ];

  // Phase 2 AI Briefing: personalized Claude summary for subscriber counties/topics (via Vercel-compatible direct Anthropic; degrades if no ANTHROPIC_API_KEY)
  async function generatePersonalizedBriefing(userCounties: string[] | null, sampleTitles: string[]): Promise<string | undefined> {
    const key = process.env.ANTHROPIC_API_KEY?.trim();
    if (!key || sampleTitles.length === 0) return undefined;
    const countiesStr = (userCounties && userCounties.length) ? userCounties.join(", ") : "Oklahoma statewide";
    const prompt = `You are the editor of The Colony OK, a brutalist independent Oklahoma newsroom. Write a tight 2-3 sentence personalized weekly briefing intro (under 180 chars total) for a subscriber whose counties are: ${countiesStr}. Focus on relevance to their local interests. Use only these real recent story/episode titles (no fabrication, no urls): ${sampleTitles.slice(0, 8).join(" | ")}. End with a local call to action. Style: direct, rural, no hype.`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 220,
          messages: [{ role: "user", content: prompt }],
        }),
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) return undefined;
      const json: any = await res.json();
      const text = json?.content?.[0]?.text?.trim();
      return text ? text.slice(0, 220) : undefined;
    } catch (e) {
      log.warn("[weekly-digest] Claude briefing failed (degrade)", e);
      return undefined;
    }
  }

  const { data: subs } = await sb
    .from("newsletter_subscribers")
    .select("email, token, counties")
    .is("confirmed_at", "not.null")
    .is("unsubscribed_at", "null")
    .limit(5000);
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
    // AI personalized intro (real titles only, gated)
    const sampleTitles = [...userArts.map((a: any) => a.title), ...(eps || []).map((e: any) => e.title)];
    const intro = await generatePersonalizedBriefing(userCounties, sampleTitles);
    try {
      await sendNewsletterDigest(sub.email, {
        subject: "The Briefing — This Week in Oklahoma",
        items: userItems,
        unsubscribeUrl: unsub,
        intro,
      });
      sent++;
    } catch (err) {
      log.warn("[weekly-digest] send failed", err);
    }
  }

  return NextResponse.json({ ok: true, sent, recipients: (subs || []).length });
}
