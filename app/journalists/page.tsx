import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import InnerPageShell from "../_components/InnerPageShell";
import SectionBlock from "../_components/SectionBlock";
import ContributorCard from "../_components/ContributorCard";
import AuthorityBadge from "../_components/AuthorityBadge";
import { CONTRIBUTOR_PLANS } from "@/lib/contributor-plans";
import { getContributors, getContributorsByTier } from "@/lib/contributors";
import type { TierId } from "@/lib/contributor-tiers";
import { hostPhoto } from "@/lib/media-map";

export const metadata: Metadata = {
  title: "Our Journalists",
  description:
    "The reporters, hosts, and editors behind The Colony OK. Named bylines. Verified work. Public contact.",
  alternates: { canonical: "/journalists" },
};

export const revalidate = 300;

function contactLine(c: { email: string | null; x_handle: string | null }) {
  const parts: string[] = [];
  if (c.email) parts.push(c.email);
  if (c.x_handle) parts.push(c.x_handle.startsWith("@") ? c.x_handle : `@${c.x_handle}`);
  return parts.join(" · ") || "Contact via tip line";
}

const TIER_EXAMPLES: TierId[] = ["headliner", "featured", "contributor"];

export default async function JournalistsPage() {
  const [contributors, ...tierLists] = await Promise.all([
    getContributors().catch(() => []),
    ...TIER_EXAMPLES.map((tier) => getContributorsByTier(tier).catch(() => [])),
  ]);
  const tierExamples = TIER_EXAMPLES.map((tier, i) => ({
    tier,
    example: tierLists[i][0] ?? null,
  }));
  const hasExamples = tierExamples.some((t) => t.example !== null);
  const count = contributors.length || 4;

  return (
    <InnerPageShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Journalists" }]}
      eyebrow={`▼ THE MASTHEAD · ${count} ON STAFF`}
      title="Our Journalists"
      lede={
        <>
          Every story is filed by a named journalist. Reach out by email or social — addresses below. Tips can be sent
          securely via the{" "}
          <Link href="/submit-a-tip" style={{ color: "var(--color-alarm)", borderBottom: "1px solid" }}>
            tip line
          </Link>
          .
        </>
      }
      section={false}
    >
      <section className="section section--paper section--tight">
        <div className="journalist-grid">
          {contributors.length > 0 ? (
            contributors.map((c) => (
              <article className="journalist-card" key={c.id}>
                <div className="journalist-card__inner">
                  <Image
                    className="journalist-card__photo"
                    src={hostPhoto(c.slug, c.headshot_url, c.name)}
                    alt={`${c.name} — The Colony OK journalist`}
                    width={80}
                    height={80}
                  />
                  <div>
                    {c.role && <p className="journalist-card__role">▼ {c.role}</p>}
                    <h2 className="journalist-card__name">
                      <Link href={`/contributors/${c.slug}`}>{c.name}</Link>
                    </h2>
                    <AuthorityBadge verified />
                    {c.bio && <p className="journalist-card__bio">{c.bio}</p>}
                    <p className="journalist-card__contact">{contactLine(c)}</p>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="empty-state">No journalists listed yet.</p>
          )}
        </div>

        {hasExamples && (
          <div className="tier-examples">
            <p className="page-header__eyebrow" style={{ marginBottom: "var(--space-4)" }}>
              ▼ TIER PLACEMENT EXAMPLES (SEE DEDICATED MASTHEAD)
            </p>
            <div className="contrib-directory__grid">
              {tierExamples.map(
                ({ tier, example }) =>
                  example && (
                    <ContributorCard
                      key={example.id}
                      c={example}
                      variant={tier === "headliner" ? "hero" : tier === "featured" ? "featured" : "compact"}
                    />
                  ),
              )}
            </div>
            <p className="text-center text-sm mt-4">
              Full tiers, exposure details, and application on the dedicated <Link href="/contributors/join">Masthead Join</Link> page.
            </p>
          </div>
        )}
      </section>

      {/* Dedicated masthead apply lives on /contributors/join and /contributors (per hub model — journalists page focuses on authority & bylines, not repeated full plans grid). */}
      <section className="section section--paper section--tight">
        <div className="text-center">
          <p className="mono-eyebrow">▼ NAMED JOURNALISM • VERIFIED WORK</p>
          <Link className="btn btn--primary btn--lg" href="/contributors/join">
            Join the Masthead — from $14.99/mo
          </Link>
          <p className="text-sm mt-3 text-muted">Directory + bios here. Full application and tiers on the Masthead page.</p>
        </div>
      </section>
    </InnerPageShell>
  );
}