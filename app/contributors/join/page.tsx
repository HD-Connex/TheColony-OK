import Link from "next/link";
import type { Metadata } from "next";
import Breadcrumbs from "../../_components/Breadcrumbs";
import PageHeader from "../../_components/PageHeader";
import ContributorApplyForm from "../../_components/ContributorApplyForm";
import { CONTRIBUTOR_PLANS, EXPOSURE_ROWS } from "@/lib/contributor-plans";

export const metadata: Metadata = {
  title: "Join the Masthead",
  description:
    "Contributor exposure tiers from $14.99/mo. More visibility, better page positioning, and bigger headliner treatment across The Colony OK.",
  alternates: { canonical: "/contributors/join" },
};

interface PageProps {
  searchParams: Promise<{ plan?: string; submitted?: string }>;
}

function cellValue(v: boolean | string): string {
  if (v === true) return "✓";
  if (v === false) return "—";
  return v;
}

export default async function ContributorJoinPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const defaultPlan = params.plan ?? "featured";

  return (
    <main id="main" className="page--inner">
      <section className="section section--paper section--flush">
        <div className="container">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Join the Masthead" }]} />
          <PageHeader
            eyebrow="▼ CONTRIBUTOR MASTHEAD · EXPOSURE TIERS"
            title="Join the Masthead"
            lede={
              <>
                Put your name on Oklahoma&apos;s independent press. Each tier buys more exposure — better page
                positioning, larger cards, and headliner treatment across the network.{" "}
                <strong>Applications reviewed within 48 hours.</strong>
              </>
            }
          />

          <div className="contrib-plan-grid" aria-label="Contributor pricing tiers">
            {CONTRIBUTOR_PLANS.map((plan) => (
              <article
                key={plan.id}
                className={`contrib-plan-card${plan.highlight ? " contrib-plan-card--highlight" : ""}`}
              >
                <p className="contrib-plan-card__eyebrow">
                  {plan.highlight ? "▼ MOST POPULAR" : `▼ ${plan.tier.toUpperCase()}`}
                </p>
                <h2 className="contrib-plan-card__name">{plan.name}</h2>
                <div>
                  <span className="contrib-plan-card__price">${plan.price}</span>{" "}
                  <span className="contrib-plan-card__period">/ month</span>
                </div>
                <p className="contrib-plan-card__summary">{plan.exposureSummary}</p>
                <ul className="contrib-plan-card__perks">
                  {plan.perks.map((perk) => (
                    <li className="contrib-plan-card__perk" key={perk}>
                      {perk}
                    </li>
                  ))}
                </ul>
                <Link className={`btn ${plan.highlight ? "btn--primary" : "btn--ink"} btn--full`} href={`#apply`}>
                  Apply — {plan.name}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--ink">
        <div className="container">
          <header className="section-header">
            <span className="section-header__number">N°01</span>
            <div className="section-header__group">
              <h2 className="section-title">Exposure Comparison</h2>
              <span className="section-header__dateline">PLACEMENT · VISIBILITY · HEADLINER SIZE</span>
            </div>
          </header>

          <table className="exposure-table">
            <thead>
              <tr>
                <th>Placement</th>
                <th>Contributor $14.99</th>
                <th>Featured $49.99</th>
                <th>Headliner $99.99</th>
              </tr>
            </thead>
            <tbody>
              {EXPOSURE_ROWS.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{cellValue(row.contributor)}</td>
                  <td>{cellValue(row.featured)}</td>
                  <td>{cellValue(row.headliner)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section section--paper">
        <div className="container">
          <ContributorApplyForm defaultPlanId={defaultPlan} />
        </div>
      </section>

      <section className="section section--alarm section--tight">
        <div className="container text-center">
          <p className="page-header__eyebrow" style={{ marginBottom: "var(--space-4)" }}>▼ ALREADY ON STAFF?</p>
          <h2 className="section-title" style={{ marginBottom: "var(--space-6)" }}>Browse the masthead</h2>
          <Link className="btn btn--ink btn--lg" href="/journalists">Our Journalists →</Link>
        </div>
      </section>
    </main>
  );
}