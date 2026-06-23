import { NextResponse } from "next/server";
import { tierFromPlanId } from "@/lib/contributor-tiers";
import { isContributorPlanId } from "@/lib/contributor-plans";
import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit, keyFromRequest, tooManyRequests } from "@/lib/rate-limit";
import { isEmail } from "@/lib/validate";

export const runtime = "nodejs";

interface ApplyBody {
  planId?: string;
  name?: string;
  email?: string;
  slug?: string;
  role?: string;
  bio?: string;
  website?: string;
  xHandle?: string;
  headshotUrl?: string;
  clips?: string[];
}

export async function POST(req: Request) {
  const rl = await rateLimit(keyFromRequest(req, "contrib-apply"), { limit: 3, windowSec: 86400 });
  if (!rl.ok) return tooManyRequests(rl);

  let body: ApplyBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const planId = body.planId ?? "";
  if (!isContributorPlanId(planId)) {
    return NextResponse.json({ error: "Select a valid exposure tier." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!isEmail(email)) {
    return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
  }

  const clips = (body.clips ?? []).map((c) => c.trim()).filter(Boolean);
  if (clips.length < 3) {
    return NextResponse.json({ error: "Three published clip URLs are required." }, { status: 400 });
  }

  const tier = tierFromPlanId(planId);
  if (!tier) {
    return NextResponse.json({ error: "Invalid tier." }, { status: 400 });
  }

  const { error } = await supabaseAdmin().from("contributor_applications").insert({
    plan_id: planId,
    tier,
    name,
    email,
    slug: body.slug?.trim() || null,
    role: body.role?.trim() || null,
    bio: body.bio?.trim() || null,
    website: body.website?.trim() || null,
    x_handle: body.xHandle?.trim() || null,
    headshot_url: body.headshotUrl?.trim() || null,
    clips,
    status: "pending",
  });

  if (error) {
    console.error("contributor_applications insert:", error.message);
    return NextResponse.json(
      { error: "Could not save application. Confirm migrations are applied." },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}