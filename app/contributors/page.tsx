import type { Metadata } from "next";
import InnerPageShell from "../_components/InnerPageShell";
import ContributorCard from "../_components/ContributorCard";
import Link from "next/link";
import { getContributorsByTier } from "@/lib/contributors";
import { tierLabel } from "@/lib/contributor-tiers";
import type { TierId } from "@/lib/contributor-tiers";

export const metadata: Metadata = {
  title: "Contributors",
  description: "The Colony OK masthead — headliners, featured voices, and contributors across Oklahoma reporting.",
  alternates: { canonical: "/contributors" },
};

export const revalidate = 300;

const TIER_SECTIONS: TierId[] = ["headliner", "featured", "contributor"];

export default async function ContributorsPage() {
  const byTier = await Promise.all(
    TIER_SECTIONS.map(async (tier) => ({
      tier,
      contributors: await getContributorsByTier(tier).catch((e) => { console.error(e); return []; }),
    })),
  );

  return (
    <InnerPageShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Contributors" }]}
      eyebrow="▼ THE MASTHEAD · TIERED DIRECTORY"
      title="Contributors"
      lede={
        <>
          Headliners get hero placement. Featured voices get priority rails. Contributors file under a named byline.
          Want in?{" "}
          <Link href="/contributors/join" style={{ color: "var(--color-alarm)", borderBottom: "1px solid" }}>
            Join the masthead
          </Link>
          .
        </>
      }
      section={false}
      tone="paper"
    >
      {byTier.map(({ tier, contributors }) =>
        contributors.length > 0 ? (
          <section
            className={`contrib-directory__tier section${
              tier === "headliner" || tier === "contributor" ? " section--ink" : ""
            }`}
            key={tier}
          >
            <h2 className="contrib-directory__tier-title">▼ {tierLabel(tier).toUpperCase()}</h2>
            <div className="contrib-directory__grid">
              {contributors.map((c) => (
                <ContributorCard
                  key={c.id}
                  c={c}
                  variant={tier === "headliner" ? "hero" : tier === "featured" ? "featured" : "compact"}
                />
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