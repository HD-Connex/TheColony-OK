import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import InnerPageShell from "../_components/InnerPageShell";
import SectionBlock from "../_components/SectionBlock";
import ContributorCard from "../_components/ContributorCard";
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
                    alt={c.name}
                    width={80}
                    height={80}
                  />
                  <div>
                    {c.role && <p className="journalist-card__role">▼ {c.role}</p>}
                    <h2 className="journalist-card__name">
                      <Link href={`/contributors/${c.slug}`}>{c.name}</Link>
                    </h2>
                    {c.bio && <p className="journalist-card__bio">{c.bio}</p>}
                    <p className="journalist-card__contact">{contactLine(c)}</p>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <>
              {[
                {
                  name: "Sarah Mitchell",
                  role: "INVESTIGATIONS EDITOR",
                  bio: "Twelve years on the politics beat. Focus: campaign finance, public records, statehouse accountability.",
                  contact: "sarah@thecolonyok.com · @sarahm_ok",
                  slug: "sarah-mitchell",
                },
                {
                  name: "Marcus Webb",
                  role: "HOST · PATRIOT HOUR",
                  bio: "Former Marine officer. Talk radio veteran. Focus: federal/state tension, constitutional law, foreign policy.",
                  contact: "marcus@thecolonyok.com · @marcuswebb",
                  slug: "marcus-webb",
                },
                {
                  name: "Rachel Torres",
                  role: "HOST · OK UNDERGROUND",
                  bio: "Field reporter, formerly with KFOR. Rural Oklahoma, local government, and on-the-ground reporting.",
                  contact: "rachel@thecolonyok.com · @rachel_ok",
                  slug: "rachel-torres",
                },
                {
                  name: "Pastor Dan Hollis",
                  role: "HOST · FAITH & FREEDOM",
                  bio: "Pastor of First Baptist Lawton, 22 years. Focus: faith in public life, religious liberty, community institutions.",
                  contact: "dan@thecolonyok.com",
                  slug: "dan-hollis",
                },
              ].map((j) => (
                <article className="journalist-card" key={j.slug}>
                  <div className="journalist-card__inner">
                    <Image
                      className="journalist-card__photo"
                      src={hostPhoto(j.slug, null, j.name)}
                      alt={j.name}
                      width={80}
                      height={80}
                    />
                    <div>
                      <p className="journalist-card__role">▼ {j.role}</p>
                      <h2 className="journalist-card__name">
                        <Link href={`/contributors/${j.slug}`}>{j.name}</Link>
                      </h2>
                      <p className="journalist-card__bio">{j.bio}</p>
                      <p className="journalist-card__contact">{j.contact}</p>
                    </div>
                  </div>
                </article>
              ))}
            </>
          )}
        </div>

        {hasExamples && (
          <div style={{ marginTop: "var(--space-10)" }}>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-xs)",
                letterSpacing: "var(--track-wider)",
                textTransform: "uppercase",
                marginBottom: "var(--space-6)",
              }}
            >
              ▼ TIER PLACEMENT EXAMPLES
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
          </div>
        )}
      </section>

      <section className="section section--paper">
        <SectionBlock
          number="N°02"
          title="Join the Masthead"
          dateline="CONTRIBUTOR · FEATURED · HEADLINER"
          linkHref="/contributors/join"
          linkLabel="Apply Now →"
        >
          <div className="prose-block" style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-6)" }}>
            <p>
              Put your name on Oklahoma&apos;s independent press. Each tier buys more exposure — directory listing,
              featured placement, or headliner hero treatment across the network.
            </p>
          </div>

          <div className="contrib-plan-grid" aria-label="Contributor pricing tiers">
            {CONTRIBUTOR_PLANS.map((plan) => (
              <article
                key={plan.id}
                className={`contrib-plan-card${plan.highlight ? " contrib-plan-card--highlight" : ""}`}
              >
                <p className="contrib-plan-card__eyebrow">
                  {plan.highlight ? "▼ MOST POPULAR" : `▼ ${plan.tier.toUpperCase()}`}
                </p>
                <h3 className="contrib-plan-card__name">{plan.name}</h3>
                <div>
                  <span className="contrib-plan-card__price">${plan.price}</span>{" "}
                  <span className="contrib-plan-card__period">/ month</span>
                </div>
                <p className="contrib-plan-card__summary">{plan.exposureSummary}</p>
                <Link
                  className={`btn ${plan.highlight ? "btn--primary" : "btn--ink"} btn--full`}
                  href={`/contributors/join?plan=${plan.id}`}
                >
                  Apply — {plan.name}
                </Link>
              </article>
            ))}
          </div>
        </SectionBlock>
      </section>

      <section className="section section--alarm section--tight">
        <div style={{ textAlign: "center" }}>
          <Link className="btn btn--ink btn--lg" href="/contributors/join">
            Join the Masthead — from $14.99/mo
          </Link>
        </div>
      </section>
    </InnerPageShell>
  );
}