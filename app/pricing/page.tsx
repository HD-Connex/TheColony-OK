import Link from "next/link";
import type { Metadata } from "next";
import Breadcrumbs from "../_components/Breadcrumbs";
import PageHeader from "../_components/PageHeader";
import CheckoutButton from "../_components/CheckoutButton";
import { MEMBERSHIP_PLANS } from "@/lib/tiers";

export const metadata: Metadata = {
  title: "Membership",
  description:
    "Join The Colony. Ad-free, private, uncensored conservative & Christian media starting at the founding price of $4.99/mo.",
};

const FAQ = [
  {
    q: "What do I get with a membership?",
    a: "The full ad-free library of shows, documentaries, and the Oklahoma-rooted podcasts that started it all — plus live broadcasts, accurate cross-device resume, and faith-aligned summaries.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Manage or cancel your subscription from your account billing portal. No phone calls, no retention mazes.",
  },
  {
    q: "Do you sell or track my data?",
    a: "Never. The Colony is private by design — no behavioral ad tracking, no selling your information, and secure authentication.",
  },
  {
    q: "Why is it cheaper than BlazeTV?",
    a: "Because we're built lean and edge-first, and because our roots are community-first. The Settler tier honors the original $4.99 founding price of Colony OK.",
  },
];

export default function PricingPage() {
  return (
    <main id="main">
      <div className="container">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Pricing" }]} />
        <PageHeader
          eyebrow="▼ MEMBERSHIP"
          title="Join The Colony"
          lede="Uncensored, ad-free, and private — built on the Truth. Faith. Freedom. foundation. Cancel anytime."
        />

        <div className="pricing-grid">
          {MEMBERSHIP_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`pricing-card${plan.highlight ? " pricing-card--highlight" : ""}`}
            >
              {plan.highlight && <span className="pricing-card__badge">Most popular</span>}
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", margin: 0 }}>{plan.name}</h2>
              <div className="pricing-card__price">
                ${plan.price}
                {plan.price > 0 && (
                  <span style={{ fontSize: ".875rem", color: "var(--muted-foreground)", fontWeight: 400 }}>/mo</span>
                )}
              </div>
              <p style={{ fontSize: ".875rem", color: "var(--color-text-secondary)", margin: 0 }}>{plan.blurb}</p>
              <div style={{ margin: "1.25rem 0" }}>
                {plan.id === "free" ? (
                  <Link className="btn btn--outline btn--full" href="/shows">
                    Start free
                  </Link>
                ) : (
                  <CheckoutButton planId={plan.id} className="btn btn--primary btn--full">
                    Subscribe
                  </CheckoutButton>
                )}
              </div>
              <ul className="pricing-card__perks">
                {plan.perks.map((perk) => (
                  <li key={perk}>{perk}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <section className="faq-list" aria-label="Frequently asked questions">
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", textAlign: "center", marginBottom: "1.5rem" }}>
            Questions, answered
          </h2>
          {FAQ.map((item) => (
            <details key={item.q} className="faq-item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </section>
      </div>
    </main>
  );
}