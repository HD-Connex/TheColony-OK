import { NextResponse } from "next/server";
import { ingestPodcastFeeds } from "@/lib/rss-ingest";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Podcast RSS auto-ingest. Polls every active show with an `rss_url`, parses new
 * items, and inserts them as episodes — so Colony OK shows stay in sync with
 * their hosting platform automatically (Vercel Cron).
 *
 * Schedule: see vercel.json (`/api/cron/poll-feeds` alias). Auth: Vercel sends
 * `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const result = await ingestPodcastFeeds();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ingest failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}