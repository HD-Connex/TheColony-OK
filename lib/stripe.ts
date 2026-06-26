import "server-only";
import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function stripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY missing. See .env.example.");
  _stripe = new Stripe(key, {
    typescript: true,
    apiVersion: "2026-05-27.dahlia",
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

/**
 * Handle billing edge cases for membership grants (Phase 3 hardening).
 * - cancel_at_period_end: keep access until current_period_end (Stripe transitions status later).
 * - past_due / unpaid / incomplete / incomplete_expired / canceled: no grant (strict; no auto grace beyond period).
 * - Used by webhook sync + can be used by membership flows/entitlements for recompute.
 * Reuses isActiveSubscriptionStatus; callers pass sub fields from event.
 */
export function computeMemberFromSubscription(
  status: Stripe.Subscription.Status,
  paidTier: "member" | null,
  cancelAtPeriodEnd = false,
  currentPeriodEndSec?: number | null,
): boolean {
  if (!isActiveSubscriptionStatus(status)) {
    return false;
  }
  if (cancelAtPeriodEnd && currentPeriodEndSec) {
    const nowSec = Math.floor(Date.now() / 1000);
    if (nowSec >= currentPeriodEndSec) {
      return false;
    }
  }
  return paidTier === "member";
}

/** Price IDs (env-configured in the Stripe dashboard). */
export const PRICING = {
  BASIC_MONTHLY: process.env.STRIPE_PRICE_SETTLER || process.env.STRIPE_PRICE_MEMBER || null,
  PREMIUM_OK_ANNUAL: process.env.STRIPE_PRICE_PATRIOT || null,
  LIFETIME: process.env.STRIPE_PRICE_FOUNDER || null,
  GIFT_BUNDLE: process.env.STRIPE_PRICE_GIFT || null,
} as const;

/**
 * Phase 3: Gift redemption using gift_codes table (created in 0020).
 * Marks code used (atomic-ish), grants member status via members upsert (same as Stripe webhook).
 * Supports one-time or limited-use codes.
 */
export async function redeemGift(code: string, userId: string): Promise<{ ok: boolean; error?: string }> {
  if (!code || !userId) return { ok: false, error: "invalid" };

  const sb = (await import("./supabase")).supabaseAdmin();
  const upper = code.trim().toUpperCase();

  // Find valid unused (or under max) code
  const { data: gift, error: gErr } = await sb
    .from("gift_codes")
    .select("code, tier, max_uses, uses, expires_at")
    .eq("code", upper)
    .maybeSingle();

  if (gErr || !gift) return { ok: false, error: "invalid_code" };
  if (gift.expires_at && new Date(gift.expires_at) < new Date()) return { ok: false, error: "expired" };
  if (gift.uses >= gift.max_uses) return { ok: false, error: "redeemed" };

  // Increment uses (simple; for high contention add RPC)
  const { error: incErr } = await sb
    .from("gift_codes")
    .update({ uses: gift.uses + 1 })
    .eq("code", upper)
    .eq("uses", gift.uses); // optimistic

  if (incErr) return { ok: false, error: "redeem_failed" };

  // Grant membership (mirror Stripe webhook behavior)
  const tier = gift.tier === "founder" ? "founder" : "member";
  await sb.from("members").upsert(
    {
      user_id: userId,
      is_member: true,
      status: "active",
      tier,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  return { ok: true };
}

/**
 * Perk / paywall access — delegates to the membership source of truth
 * (members table, synced by the Stripe webhook). Perk granularity beyond
 * member/non-member can layer on later via a perk_grants table.
 */
export async function hasPerkAccess(
  userId: string | null,
  perk: string,
  context?: { county?: string; episodeId?: string },
): Promise<boolean> {
  void perk; void context;
  if (!userId) return false;
  const { isActiveMember } = await import("./entitlements");
  return isActiveMember(userId);
}

/** Log a usage event for analytics / limits (usage_events table, migration 0016). */
export async function logUsage(
  userId: string | null,
  type: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  if (!userId) return;
  try {
    const { supabaseAdmin } = await import("./supabase");
    await supabaseAdmin().from("usage_events").insert({
      user_id: userId,
      event_type: type,
      metadata: metadata ?? {},
    });
  } catch {
    // Analytics must never break the request path.
  }
}