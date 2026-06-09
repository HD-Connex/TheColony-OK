import type { Metadata } from "next";
import InnerPageShell from "../../_components/InnerPageShell";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Cookie and analytics policy for The Colony OK.",
  alternates: { canonical: "/legal/cookies" },
};

export default function CookiesPage() {
  return (
    <InnerPageShell
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Legal", href: "/legal/terms" },
        { label: "Cookies" },
      ]}
      eyebrow="▼ LEGAL · COOKIES"
      title="Cookie Policy"
      lede="Effective June 2026. We keep tracking minimal."
      section={false}
    >
      <article className="prose-block" style={{ margin: "0 auto", paddingBlock: "var(--space-12)" }}>
        <h2>Essential Cookies</h2>
        <p>
          Authentication sessions use secure HTTP-only cookies when you sign in as a member. These are required for
          account access and cannot be disabled while logged in.
        </p>

        <h2>Analytics</h2>
        <p>
          We use Plausible Analytics, which does not use cookies and does not track users across sites. Page views are
          counted in aggregate only.
        </p>

        <h2>Third Parties</h2>
        <p>
          Stripe checkout may set cookies during payment. Refer to Stripe&apos;s privacy policy for details. We do not
          embed third-party ad trackers.
        </p>

        <h2>Contact</h2>
        <p>
          Questions: <a href="mailto:privacy@thecolonyok.com">privacy@thecolonyok.com</a>
        </p>
      </article>
    </InnerPageShell>
  );
}