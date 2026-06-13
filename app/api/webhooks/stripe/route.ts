import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { computeMemberFromSubscription, stripe, tierForPriceId } from "@/lib/stripe";
import { sendReceiptEmail, sendCancelEmail, sendWelcomeEmail } from "@/lib/email";

export const runtime = "nodejs";

/**
 * Source of truth for membership entitlement. On every subscription change we
 * upsert the `members` row (is_member, status, stripe_* fields). lib/auth-client.ts
 * reads is_member && status === 'active'.
 */
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return new NextResponse("Missing signature", { status: 400 });

  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(payload, sig, secret);
  } catch {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await linkCheckoutSession(session);
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await syncSubscription(sub);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

async function linkCheckoutSession(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id ?? session.client_reference_id;
  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id;
  if (!userId || !customerId) return;

  const email = session.customer_email ?? session.customer_details?.email ?? null;

  const sb = supabaseAdmin();
  await sb.from("members").upsert(
    {
      user_id: userId,
      email,
      stripe_customer_id: customerId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  // Fire receipt + welcome (best-effort; do not block webhook ack)
  if (email) {
    const amount = session.amount_total ? `$${(session.amount_total / 100).toFixed(2)}` : null;
    await sendReceiptEmail(email, { amount, tier: "member" });
    await sendWelcomeEmail(email, { tier: "member" });
  }
}

async function syncSubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const sb = supabaseAdmin();

  let { data: member } = await sb
    .from("members")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (!member) {
    const customer = await stripe().customers.retrieve(customerId);
    if (!customer.deleted && customer.metadata?.supabase_user_id) {
      await sb.from("members").upsert(
        {
          user_id: customer.metadata.supabase_user_id,
          email: customer.email,
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      ({ data: member } = await sb
        .from("members")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle());
    }
  }

  if (!member) return;

  const priceId = sub.items.data[0]?.price.id ?? "";
  const paidTier = tierForPriceId(priceId);
  const periodEnd =
    (sub.items.data[0] as { current_period_end?: number } | undefined)?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end;

  // Use edge-aware helper (handles cancel_at_period_end grace, past_due etc) for billing parity.
  const isMember = computeMemberFromSubscription(
    sub.status,
    paidTier,
    sub.cancel_at_period_end,
    periodEnd ?? null,
  );

  // Try to get a usable email for notifications
  let notifyEmail: string | null = (member as any)?.email || null;
  if (!notifyEmail) {
    try {
      const cust = await stripe().customers.retrieve(customerId);
      if (!cust.deleted) notifyEmail = (cust as any).email ?? null;
    } catch {}
  }

  await sb
    .from("members")
    .update({
      is_member: isMember,
      status: sub.status,
      tier: isMember ? "member" : "free",
      stripe_subscription_id: sub.id,
      stripe_price_id: priceId || null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: sub.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", member.user_id);

  // Email side-effects (non-blocking). Never block the 200 to Stripe.
  const isActiveSub = sub.status === "active" || sub.status === "trialing";
  if (notifyEmail) {
    if (sub.status === "canceled" || !isActiveSub) {
      await sendCancelEmail(notifyEmail, { tier: paidTier || undefined, endedAt: periodEnd ? new Date(periodEnd * 1000).toISOString() : undefined });
    } else if (isActiveSub && isMember) {
      const amount = null;
      await sendReceiptEmail(notifyEmail, { amount, tier: "member", periodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : undefined });
    }
  }
}