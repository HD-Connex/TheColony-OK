import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Open Stripe customer billing portal (Bearer Supabase session). */
export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = supabaseAdmin();
  const { data: member } = await sb
    .from("members")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member?.stripe_customer_id) {
    return NextResponse.json({ error: "No billing account found." }, { status: 404 });
  }

  const session = await stripe().billingPortal.sessions.create({
    customer: member.stripe_customer_id,
    return_url: `${SITE_URL}/membership/account`,
  });

  return NextResponse.json({ url: session.url });
}