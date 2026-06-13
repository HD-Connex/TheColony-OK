import { NextResponse } from "next/server";
import { getUserFromRequest, isUuid } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Check whether current user follows the contributor (by id uuid). Reuses auth + rate + watchlist patterns exactly. */
export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const contributorId = url.searchParams.get("contributorId");
  if (!contributorId || !isUuid(contributorId)) {
    return NextResponse.json({ error: "Invalid contributorId" }, { status: 422 });
  }

  const { data, error } = await supabaseAdmin()
    .from("contributor_follows")
    .select("contributor_id")
    .eq("user_id", user.id)
    .eq("contributor_id", contributorId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ following: Boolean(data) });
}

/** Toggle follow on/off for signed-in viewer. POST body { contributorId }. Mirrors /api/watchlist exactly for reuse. */
export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(`contributor-follow:${user.id}`, { limit: 30, windowSec: 60 });
  if (!rl.ok) return tooManyRequests(rl);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const contributorId =
    body && typeof body === "object" && typeof (body as Record<string, unknown>).contributorId === "string"
      ? (body as Record<string, string>).contributorId
      : null;

  if (!contributorId || !isUuid(contributorId)) {
    return NextResponse.json({ error: "Invalid contributorId" }, { status: 422 });
  }

  const sb = supabaseAdmin();

  const { data: existing, error: lookupError } = await sb
    .from("contributor_follows")
    .select("contributor_id")
    .eq("user_id", user.id)
    .eq("contributor_id", contributorId)
    .maybeSingle();

  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });

  if (existing) {
    const { error } = await sb
      .from("contributor_follows")
      .delete()
      .eq("user_id", user.id)
      .eq("contributor_id", contributorId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ following: false });
  }

  const { error } = await sb.from("contributor_follows").insert({
    user_id: user.id,
    contributor_id: contributorId,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ following: true });
}
