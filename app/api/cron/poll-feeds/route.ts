import { NextResponse } from "next/server";
import { ingestPodcastFeeds } from "@/lib/rss-ingest";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Vercel Cron entry point (see vercel.json). Same handler as ingest-rss.
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