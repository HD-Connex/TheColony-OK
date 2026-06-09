export type TierId = 'headliner' | 'featured' | 'contributor';
export const TIERS: TierId[] = ['headliner', 'featured', 'contributor'];

const TIER_LABELS: Record<TierId, string> = {
  headliner: 'Headliner',
  featured: 'Featured',
  contributor: 'Contributor',
};

const TIER_BADGE_CLASSES: Record<TierId, string> = {
  headliner: 'tier-badge tier-badge--headliner',
  featured: 'tier-badge tier-badge--featured',
  contributor: 'tier-badge tier-badge--contributor',
};

export function tierLabel(tier: string): string {
  return TIER_LABELS[tier as TierId] ?? 'Contributor';
}

export function tierBadgeClass(tier: string): string {
  return TIER_BADGE_CLASSES[tier as TierId] ?? TIER_BADGE_CLASSES.contributor;
}

export function tierFromPlanId(planId: string): TierId | null {
  if (planId === "headliner" || planId === "featured" || planId === "contributor") {
    return planId;
  }
  return null;
}
