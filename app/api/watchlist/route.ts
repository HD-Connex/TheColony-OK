import { NextResponse } from "next/server";
import { getUserFromRequest, isUuid } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Check whether a series is on the signed-in viewer's watchlist. */
export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const seriesId = new URL(req.url).searchParams.get("seriesId");
  if (!seriesId || !isUuid(seriesId)) {
    return NextResponse.json({ error: "Invalid seriesId" }, { status: 422 });
  }

  const { data, error } = await supabaseAdmin()
    .from("watchlist")
    .select("series_id")
    .eq("user_id", user.id)
    .eq("series_id", seriesId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ inWatchlist: Boolean(data) });
}

/** Toggle a series on/off the signed-in viewer's watchlist. */
export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(`watchlist:${user.id}`, { limit: 30, windowSec: 60 });
  if (!rl.ok) return tooManyRequests(rl);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const seriesId =
    body && typeof body === "object" && typeof (body as Record<string, unknown>).seriesId === "string"
      ? (body as Record<string, string>).seriesId
      : null;

  if (!seriesId || !isUuid(seriesId)) {
    return NextResponse.json({ error: "Invalid seriesId" }, { status: 422 });
  }

  const sb = supabaseAdmin();

  const { data: existing, error: lookupError } = await sb
    .from("watchlist")
    .select("series_id")
    .eq("user_id", user.id)
    .eq("series_id", seriesId)
    .maybeSingle();

  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });

  if (existing) {
    const { error } = await sb
      .from("watchlist")
      .delete()
      .eq("user_id", user.id)
      .eq("series_id", seriesId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ inWatchlist: false });
  }

  const { error } = await sb.from("watchlist").insert({
    user_id: user.id,
    series_id: seriesId,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ inWatchlist: true });
}