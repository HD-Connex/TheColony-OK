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
