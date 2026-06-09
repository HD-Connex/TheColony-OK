import Link from "next/link";
import type { Metadata } from "next";
import Breadcrumbs from "../_components/Breadcrumbs";
import PageHeader from "../_components/PageHeader";
import MembershipSignIn from "../_components/MembershipSignIn";
import BillingPortalButton from "../_components/BillingPortalButton";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to The Colony with your email. No password required — we send a magic link.",
};

const UPSELL_FEATURES = [
  "All investigative reporting",
  "Full podcast library",
  "Live broadcasts + replays",
  "Members-only briefings",
];

export default function MembershipPage() {
  return (
    <main id="main">
      <div className="container">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Join", href: "/pricing" },
            { label: "Sign In" },
          ]}
        />
        <PageHeader
          eyebrow="▼ MEMBER ACCOUNT"
          title="Sign In"
          lede="Enter your email. We send a one-time login link to your inbox — no password to remember, no app to install."
        />

        <div className="membership-split">
          <section className="membership-split__login" aria-label="Member sign in">
            <h2 className="membership-split__heading">Already a Member</h2>
            <p className="membership-split__lede">
              Enter the email you joined with. We&apos;ll send you a magic link to manage your subscription, billing, and
              account.
            </p>

            <MembershipSignIn embedded />

            <div className="membership-split__portal">
              <h3 className="membership-split__portal-label">▼ MANAGE SUBSCRIPTION</h3>
              <p className="membership-split__portal-text">
                Update card, view billing history, or cancel — all in the Stripe Customer Portal.
              </p>
              <BillingPortalButton className="btn btn--outline btn--full" />
            </div>
          </section>

          <aside className="membership-split__upsell" aria-label="Membership upsell">
            <h2 className="membership-split__heading">Not a Member Yet?</h2>
            <p className="membership-split__lede">
              Join 1,200+ Oklahomans funding independent journalism. $4.99/month, cancel anytime.
            </p>
            <ul className="membership-cta__features membership-split__features">
              {UPSELL_FEATURES.map((feature) => (
                <li className="membership-cta__feature" key={feature}>
                  {feature}
                </li>
              ))}
            </ul>
            <Link className="btn btn--primary btn--lg btn--full" href="/pricing">
              Join — $4.99/month
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}