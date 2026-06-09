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
  alternates: { canonical: "/pricing" },
};

const FEATURES = [
  "All investigative articles — no paywall",
  "Full podcast library across every show",
  "Live streams + full replay archives",
  "Members-only weekday briefings",
  "Bonus podcast episodes, members-only feed",
  "Cancel anytime — no contracts",
];

const FAQ = [
  {
    q: "What's included in membership?",
    a: "Everything we publish: investigative articles, full podcast library across all shows, live broadcasts and replays, members-only weekday briefings, and bonus podcast episodes in your members-only feed.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Sign into your account and open the billing portal to cancel. No contracts, no penalties. Your access continues to the end of the current billing period.",
  },
  {
    q: "Do you offer refunds?",
    a: "Yes — full refund within the first 14 days, no questions asked. After that, you can cancel any time and avoid future billing.",
  },
  {
    q: "How do I sign in?",
    a: (
      <>
        Enter your email on the <Link href="/membership">Account page</Link>. We send a one-time login link — no
        passwords to remember.
      </>
    ),
  },
  {
    q: "Is my payment secure?",
    a: "Yes. Checkout runs on Stripe's hosted infrastructure. We never see or store your card details.",
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

const memberPlan = MEMBERSHIP_PLANS.find((p) => p.id === "member") ?? MEMBERSHIP_PLANS[1];

export default function PricingPage() {
  return (
    <main id="main">
      <div className="container">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Join" }]} />
        <PageHeader
          eyebrow="▼ SECTION N°05 · MEMBERSHIP"
          title="Join The Colony"
          lede={
            <>
              Independent journalism that answers to readers, not advertisers.{" "}
              <strong>$4.99 / month.</strong> Cancel anytime. Secure checkout via Stripe.
            </>
          }
        />

        <section className="membership-cta" id="benefits" style={{ borderTop: "none", paddingTop: "var(--space-12)" }}>
          <div className="membership-cta__inner">
            <div className="membership-cta__lead">
              <p className="membership-cta__eyebrow">▼ EVERYTHING / NO PAYWALL</p>
              <h2 className="membership-cta__title">Press that costs less than a cup of coffee.</h2>
              <p className="membership-cta__subtitle">
                Full access to every article, every podcast episode, every live broadcast — plus member-only briefings and
                bonus episodes — for less than $5 a month.
              </p>
              <ul className="membership-cta__features">
                {FEATURES.map((feature) => (
                  <li className="membership-cta__feature" key={feature}>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="membership-cta__price-card">
              <div className="membership-cta__price">
                <span className="membership-cta__amount">${memberPlan.price}</span>
                <span className="membership-cta__period">/MONTH</span>
              </div>
              <div className="membership-cta__actions">
                <CheckoutButton planId={memberPlan.id} className="btn btn--primary btn--lg btn--full">
                  Join Now — Stripe Checkout
                </CheckoutButton>
                <Link className="btn btn--outline btn--full" href="/membership">
                  Already a Member? Sign In
                </Link>
              </div>
              <p className="membership-cta__disclaimer">Secure checkout via Stripe · 100% money-back in first 14 days</p>
            </div>
          </div>
          <div className="membership-cta__footer-band">▼ 1,200+ OKLAHOMANS JOINED THIS MONTH</div>
        </section>

        <section className="section" id="faq" aria-label="Frequently asked questions">
          <header className="section-header">
            <span className="section-header__number">N°01</span>
            <div className="section-header__group">
              <h2 className="section-title">FAQ</h2>
              <span className="section-header__dateline">CANCELATION · ACCESS · BILLING</span>
            </div>
          </header>

          <div className="faq">
            {FAQ.map((item, i) => (
              <details className="faq__item" key={item.q} open={i === 0}>
                <summary className="faq__question">{item.q}</summary>
                <div className="faq__answer">{item.a}</div>
              </details>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}