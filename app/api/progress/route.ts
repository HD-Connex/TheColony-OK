import { NextResponse } from "next/server";
import { getUserFromRequest, isUuid } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { log } from "@/lib/log";

export const runtime = "nodejs";

interface ProgressPayload {
  episodeId: string;
  positionSeconds: number;
  durationSeconds?: number;
}

function parseProgressBody(body: unknown): ProgressPayload | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;

  if (typeof o.episodeId !== "string" || !isUuid(o.episodeId)) return null;
  if (typeof o.positionSeconds !== "number" || o.positionSeconds < 0 || !Number.isFinite(o.positionSeconds)) {
    return null;
  }
  if (
    o.durationSeconds != null &&
    (typeof o.durationSeconds !== "number" || o.durationSeconds < 0 || !Number.isFinite(o.durationSeconds))
  ) {
    return null;
  }

  return {
    episodeId: o.episodeId,
    positionSeconds: o.positionSeconds,
    durationSeconds: typeof o.durationSeconds === "number" ? o.durationSeconds : undefined,
  };
}

/** Save / upsert resume position for the signed-in viewer (player heartbeat). */
export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(`progress:${user.id}`, { limit: 60, windowSec: 60 });
  if (!rl.ok) return tooManyRequests(rl);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const parsed = parseProgressBody(body);
  if (!parsed) return NextResponse.json({ error: "Invalid payload" }, { status: 422 });

  const completed =
    parsed.durationSeconds != null && parsed.positionSeconds >= parsed.durationSeconds * 0.95;

  const { error } = await supabaseAdmin().from("watch_progress").upsert(
    {
      user_id: user.id,
      episode_id: parsed.episodeId,
      position_seconds: Math.floor(parsed.positionSeconds),
      duration_seconds: parsed.durationSeconds ?? null,
      completed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,episode_id" },
  );

  if (error) {
    log.error("[progress] upsert failed", error);
    return NextResponse.json({ error: "Could not save progress" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}