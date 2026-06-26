// Single source of truth for access tiers. The platform runs a two-rung ladder:
// `free` (open) and `member` (paid). Any non-free tier_required value coming from
// the DB (legacy "premium", etc.) normalizes to `member`, so gating stays binary
// and consistent across articles, podcasts, video, and live.

export type Tier = "free" | "member";

export const TIER_RANK: Record<Tier, number> = { free: 0, member: 1 };

export function normalizeTier(t: string | null | undefined): Tier {
  return t && t !== "free" ? "member" : "free";
}

/** True when the content requires more than free access. */
export function tierLocked(t: string | null | undefined): boolean {
  return normalizeTier(t) !== "free";
}

export function tierLabel(t: string | null | undefined): string {
  return normalizeTier(t) === "free" ? "Free" : "Members";
}

/** Whether a viewer (member or not) may access content at `required`. */
export function isEntitled(required: string | null | undefined, isMember: boolean): boolean {
  return TIER_RANK[normalizeTier(required)] <= (isMember ? TIER_RANK.member : TIER_RANK.free);
}

/** Stripe price env keys for paid plans (any match grants `member` access). */
export type StripePriceEnvKey =
  | "STRIPE_PRICE_MEMBER"
  | "STRIPE_PRICE_SETTLER"
  | "STRIPE_PRICE_PATRIOT"
  | "STRIPE_PRICE_FOUNDER";

/** Marketing plans shown on /pricing. */
export interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  blurb: string;
  highlight?: boolean;
  perks: string[];
  stripePriceEnv?: StripePriceEnvKey;
}

/** Resolve Stripe price id for a marketing plan id (falls back through all known env keys). */
export function priceIdForPlan(planId: string): string | null {
  if (planId === "member") {
    // Flexible fallback: any configured price env key grants member access.
    const keys: StripePriceEnvKey[] = [
      "STRIPE_PRICE_SETTLER",
      "STRIPE_PRICE_MEMBER",
      "STRIPE_PRICE_PATRIOT",
      "STRIPE_PRICE_FOUNDER",
    ];
    for (const k of keys) {
      const v = process.env[k];
      if (v) return v;
    }
    return null;
  }
  const plan = MEMBERSHIP_PLANS.find((p) => p.id === planId);
  if (!plan?.stripePriceEnv) return null;
  return process.env[plan.stripePriceEnv] ?? null;
}

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: "free",
    name: "Neighbor",
    price: 0,
    blurb: "Sample the colony. Free previews, daily news, and select Oklahoma podcasts.",
    perks: [
      "Daily news & headlines",
      "Free podcast episodes",
      "First 3 minutes of every show",
      "Live event previews",
    ],
  },
  {
    id: "member",
    name: "Settler",
    price: 4.99,
    highlight: true,
    stripePriceEnv: "STRIPE_PRICE_SETTLER",
    blurb: "The founding price. Full library, ad-free, the way Colony OK members started.",
    perks: [
      "Everything in Neighbor",
      "Full ad-free show & podcast library",
      "Accurate resume across devices",
      "Offline downloads (mobile)",
      "AI transcripts & faith-aligned summaries",
    ],
  },
];
