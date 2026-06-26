import type { Metadata } from "next";
import InnerPageShell from "../_components/InnerPageShell";
import ContributorCard from "../_components/ContributorCard";
import FollowButton from "../_components/FollowButton"; // Basic follow UI (reuses WatchlistButton patterns) for contributors
import Link from "next/link";
import { getContributorsByTier, getContributorsLeaderboard } from "@/lib/contributors"; // Reuse + new leaderboard/stats helpers
import { contributorTierLabel } from "@/lib/contributor-tiers";
import type { TierId } from "@/lib/contributor-tiers";

export const metadata: Metadata = {
  title: "Contributors",
  description: "The Colony OK masthead — headliners, featured voices, and contributors across Oklahoma reporting.",
  alternates: { canonical: "/contributors" },
};

export const revalidate = 300;

const TIER_SECTIONS: TierId[] = ["headliner", "featured", "contributor"];

export default async function ContributorsPage() {
  const [byTier, leaderboard] = await Promise.all([
    Promise.all(
      TIER_SECTIONS.map(async (tier) => ({
        tier,
        contributors: await getContributorsByTier(tier).catch(() => { return []; }),
      })),
    ),
    getContributorsLeaderboard(5, "stories").catch(() => []), // most by count/stories; "most read" via views proxy
  ]);

  return (
    <InnerPageShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Contributors" }]}
      eyebrow="▼ THE MASTHEAD · TIERED DIRECTORY"
      title="Contributors"
      lede={
        <>
          Headliners get hero placement. Featured voices get priority rails. Contributors file under a named byline.
          Want in?{" "}
          <Link href="/contributors/join" className="accent-link">
            Join the masthead
          </Link>
          .
        </>
      }
      section={false}
      tone="paper"
    >
      {/* Leaderboard (most stories / by count or views proxy) — reuses getContributors + stats helper; visible breadth on /contributors */}
      {leaderboard.length > 0 && (
        <section className="section section--tight" style={{ background: "var(--color-paper)", border: "var(--rule-hairline) solid var(--color-border)", padding: "var(--space-4)" }}>
          <h2 className="section-title" style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-2)" }}>▼ LEADERBOARD — TOP BY STORIES (PROXY READS)</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)" }}>
            {leaderboard.map((c, i) => (
              <div key={c.id} style={{ minWidth: 180, padding: "var(--space-2)", border: "1px solid var(--color-border)" }}>
                <span className="mono-eyebrow">#{i + 1}</span>{" "}
                <Link href={`/contributors/${c.slug}`}>{c.name}</Link>
                <div className="fine-print">{c.storyCount} stories · ~{c.viewEstimate} reads</div>
                <FollowButton contributorId={c.id} compact className="btn btn--sm btn--outline" />
              </div>
            ))}
          </div>
          <p className="fine-print" style={{ marginTop: 8 }}>Stats from real article counts (getContributorArticles) + view proxy. Follow persists via 0028 table once applied.</p>
        </section>
      )}

      {byTier.map(({ tier, contributors }) =>
        contributors.length > 0 ? (
          <section
            className={`contrib-directory__tier section${
              tier === "headliner" || tier === "contributor" ? " section--ink" : ""
            }`}
            key={tier}
          >
            <h2 className="contrib-directory__tier-title">▼ {contributorTierLabel(tier).toUpperCase()}</h2>
            <div className="contrib-directory__grid">
              {contributors.map((c) => (
                <div key={c.id}>
                  <ContributorCard
                    c={c}
                    variant={tier === "headliner" ? "hero" : tier === "featured" ? "featured" : "compact"}
                  />
                  {/* Follow button for breadth on directory cards (in addition to leaderboard + profile) */}
                  <div style={{ marginTop: 4 }}>
                    <FollowButton contributorId={c.id} compact />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null,
      )}

      <section className="section section--alarm section--tight" style={{ textAlign: "center" }}>
        <Link className="btn btn--ink btn--lg" href="/contributors/join">
          Join the Masthead — from $14.99/mo
        </Link>
      </section>
    </InnerPageShell>
  );
}