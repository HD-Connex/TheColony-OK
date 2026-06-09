import type { Metadata } from "next";
import InnerPageShell from "../../_components/InnerPageShell";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service for The Colony OK membership and site use.",
  alternates: { canonical: "/legal/terms" },
};

export default function TermsPage() {
  return (
    <InnerPageShell
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Legal", href: "/legal/terms" },
        { label: "Terms" },
      ]}
      eyebrow="▼ LEGAL · TERMS"
      title="Terms of Service"
      lede="Effective June 2026. By using thecolonyok.com or becoming a member, you agree to these terms."
      section={false}
    >
      <article className="prose-block" style={{ margin: "0 auto", paddingBlock: "var(--space-12)" }}>
        <h2>Membership</h2>
        <p>
          Paid membership is billed monthly via Stripe at the price shown at checkout. You may cancel anytime through the
          billing portal; access continues through the end of the current billing period. Refunds are available within
          the first 14 days of a new subscription.
        </p>

        <h2>Content Use</h2>
        <p>
          Articles, podcasts, and live programming are for personal, non-commercial use. Republication requires written
          permission from editor@thecolonyok.com.
        </p>

        <h2>Conduct</h2>
        <p>
          Live chat and member forums must not include harassment, doxxing, or illegal content. We reserve the right to
          suspend accounts that violate community standards.
        </p>

        <h2>Disclaimer</h2>
        <p>
          Opinion pieces are labeled as such. News reporting is produced independently of advertisers and sponsors.
        </p>

        <h2>Contact</h2>
        <p>
          Legal inquiries: <a href="mailto:legal@thecolonyok.com">legal@thecolonyok.com</a>
        </p>
      </article>
    </InnerPageShell>
  );
}