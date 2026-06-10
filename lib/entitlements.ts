// Membership entitlement — single source of truth for "is this user a paying
// member". Reads the members table (synced from Stripe by the webhook).
// Used by paywall checks, clip uploads, comments gating, and perk access.

import "server-only";
import { supabaseAdmin } from "./supabase";

export interface Membership {
  isMember: boolean;
  status: string | null;
  tier: string | null;
  role: string;
  currentPeriodEnd: string | null;
}

const NO_MEMBERSHIP: Membership = {
  isMember: false,
  status: null,
  tier: null,
  role: "member",
  currentPeriodEnd: null,
};

/** Fetch membership for a user id. Active or trialing subscription = member. */
export async function getMembership(userId: string | null | undefined): Promise<Membership> {
  if (!userId) return NO_MEMBERSHIP;
  const { data, error } = await supabaseAdmin()
    .from("members")
    .select("is_member, status, tier, role, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return NO_MEMBERSHIP;
  const active = data.status === "active" || data.status === "trialing";
  return {
    isMember: Boolean(data.is_member) && active,
    status: data.status ?? null,
    tier: data.tier ?? null,
    role: (data.role as string) ?? "member",
    currentPeriodEnd: data.current_period_end ?? null,
  };
}

/** Convenience: true when the user has an active paid membership. */
export async function isActiveMember(userId: string | null | undefined): Promise<boolean> {
  return (await getMembership(userId)).isMember;
}
