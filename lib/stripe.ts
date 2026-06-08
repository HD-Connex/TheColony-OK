import "server-only";
import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function stripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY missing. See .env.example.");
  _stripe = new Stripe(key, {
    typescript: true,
    appInfo: { name: "The Colony OK", version: "0.1.0" },
  });
  return _stripe;
}

/** Paid Stripe price IDs that grant `member` access (binary tier ladder). */
const MEMBER_PRICE_ENV_KEYS = [
  "STRIPE_PRICE_MEMBER",
  "STRIPE_PRICE_SETTLER",
  "STRIPE_PRICE_PATRIOT",
  "STRIPE_PRICE_FOUNDER",
] as const;

/** Map a Stripe price id back to our internal tier (`member` or null). */
export function tierForPriceId(priceId: string): "member" | null {
  for (const key of MEMBER_PRICE_ENV_KEYS) {
    if (priceId === process.env[key]) return "member";
  }
  return null;
}

export function isActiveSubscriptionStatus(status: Stripe.Subscription.Status): boolean {
  return status === "active" || status === "trialing";
}