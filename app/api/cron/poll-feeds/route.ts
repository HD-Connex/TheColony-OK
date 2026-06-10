import { NextResponse } from "next/server";
import { ingestPodcastFeeds } from "@/lib/rss-ingest";
import { requireCronSecret } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Vercel Cron entry point (see vercel.json). Same handler as ingest-rss.
 */
export async function GET(req: Request) {
  if (!requireCronSecret(req)) {
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