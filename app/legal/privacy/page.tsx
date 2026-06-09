import type { Metadata } from "next";
import InnerPageShell from "../../_components/InnerPageShell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How The Colony OK handles your data — reader-funded press, private by design.",
  alternates: { canonical: "/legal/privacy" },
};

export default function PrivacyPage() {
  return (
    <InnerPageShell
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Legal", href: "/legal/terms" },
        { label: "Privacy" },
      ]}
      eyebrow="▼ LEGAL · PRIVACY"
      title="Privacy Policy"
      lede="Effective June 2026. The Colony OK is private by design — no behavioral ad tracking, no selling your information."
      section={false}
    >
      <article className="prose-block" style={{ margin: "0 auto", paddingBlock: "var(--space-12)" }}>
        <h2>What We Collect</h2>
        <p>
          When you create a membership, we store your email address and Stripe customer ID for billing and sign-in. When
          you browse the site, we collect anonymized page-view analytics via Plausible — no cookies, no cross-site
          tracking.
        </p>

        <h2>What We Do Not Do</h2>
        <p>
          We do not sell personal data. We do not run behavioral ad networks. We do not share member emails with
          sponsors without explicit opt-in.
        </p>

        <h2>Your Rights</h2>
        <p>
          Members may request account deletion or a data export by emailing privacy@thecolonyok.com. We respond within 30
          days.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this policy: <a href="mailto:privacy@thecolonyok.com">privacy@thecolonyok.com</a>
        </p>
      </article>
    </InnerPageShell>
  );
}