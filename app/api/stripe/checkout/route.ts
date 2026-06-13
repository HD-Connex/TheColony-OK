import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";
import { priceIdForPlan } from "@/lib/tiers";
import { stripe } from "@/lib/stripe";
import { rateLimit, keyFromRequest, tooManyRequests } from "@/lib/rate-limit";

export const runtime = "nodejs";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Start Stripe Checkout for a membership plan (Bearer Supabase session). */
export async function POST(req: Request) {
  // Rate limit sensitive billing entry (prod requires Upstash; returns 429 if exceeded or misconfig in prod).
  const rl = await rateLimit(keyFromRequest(req, "checkout"), { limit: 10, windowSec: 3600 });
  if (!rl.ok) return tooManyRequests(rl);

  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let planId = "member";
  try {
    const body = await req.json();
    if (body?.planId && typeof body.planId === "string") planId = body.planId;
  } catch {
    /* default plan */
  }

  const priceId = priceIdForPlan(planId);
  if (!priceId) {
    return NextResponse.json(
      { error: "Stripe price not configured for this plan." },
      { status: 503 },
    );
  }

  const sb = supabaseAdmin();
  const { data: member } = await sb
    .from("members")
    .select("stripe_customer_id, email")
    .eq("user_id", user.id)
    .maybeSingle();

  let customerId = member?.stripe_customer_id ?? null;
  const email = user.email ?? member?.email ?? undefined;

  if (!customerId) {
    const customer = await stripe().customers.create({
      email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await sb.from("members").upsert(
      {
        user_id: user.id,
        email: email ?? null,
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  }

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    client_reference_id: user.id,
    subscription_data: { metadata: { supabase_user_id: user.id, plan_id: planId } },
    success_url: `${SITE_URL}/membership/account?checkout=success`,
    cancel_url: `${SITE_URL}/pricing`,
    metadata: { supabase_user_id: user.id, plan_id: planId },
  });

  if (!session.url) {
    return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 502 });
  }

  return NextResponse.json({ url: session.url });
}