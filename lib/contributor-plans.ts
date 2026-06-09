import type { TierId } from "@/lib/contributor-tiers";

export type ContributorPlanId = "contributor" | "featured" | "headliner";

export interface ContributorPlan {
  id: ContributorPlanId;
  name: string;
  price: number;
  tier: TierId;
  highlight?: boolean;
  exposureSummary: string;
  perks: string[];
}

export const CONTRIBUTOR_PLANS: ContributorPlan[] = [
  {
    id: "contributor",
    name: "Contributor",
    price: 14.99,
    tier: "contributor",
    exposureSummary: "Directory listing, compact card, byline on filed work.",
    perks: [
      "Masthead directory profile",
      "Compact card on /journalists",
      "Byline on published articles",
      "Contributor badge on profile",
      "Tip-line routing to your desk",
    ],
  },
  {
    id: "featured",
    name: "Featured",
    price: 49.99,
    tier: "featured",
    highlight: true,
    exposureSummary: "Featured layout, priority placement, story and podcast rails.",
    perks: [
      "Everything in Contributor",
      "Featured card with larger photo",
      "Priority sort on /journalists",
      "Story & podcast profile rails",
      "Quarterly newsletter spotlight",
      "Live schedule mention slot",
    ],
  },
  {
    id: "headliner",
    name: "Headliner",
    price: 99.99,
    tier: "headliner",
    exposureSummary: "Hero placement, homepage spotlight, top-of-page headliner treatment.",
    perks: [
      "Everything in Featured",
      "Hero card — largest masthead layout",
      "Homepage masthead spotlight rotation",
      "Top billing on category pages",
      "Live intro + on-air graphic",
      "Dedicated PR push per major filing",
    ],
  },
];

export const EXPOSURE_ROWS: Array<{
  label: string;
  contributor: boolean | string;
  featured: boolean | string;
  headliner: boolean | string;
}> = [
  { label: "Masthead directory", contributor: true, featured: true, headliner: true },
  { label: "Journalists page placement", contributor: "Compact", featured: "Featured card", headliner: "Hero top row" },
  { label: "Story bylines", contributor: true, featured: true, headliner: true },
  { label: "Profile content rails", contributor: "Articles", featured: "Articles + podcasts", headliner: "Full mixed-work hub" },
  { label: "Homepage spotlight", contributor: "—", featured: "Rotating", headliner: "Priority hero" },
  { label: "Live broadcast mentions", contributor: "—", featured: "Schedule slot", headliner: "On-air intro" },
];

export function planById(id: string): ContributorPlan | undefined {
  return CONTRIBUTOR_PLANS.find((p) => p.id === id);
}

export function isContributorPlanId(id: string): id is ContributorPlanId {
  return id === "contributor" || id === "featured" || id === "headliner";
}