import type { Metadata } from "next";
import Breadcrumbs from "../_components/Breadcrumbs";
import PageHeader from "../_components/PageHeader";
import MembershipSignIn from "../_components/MembershipSignIn";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to The Colony with your email. No password required — we send a magic link.",
};

export default function MembershipPage() {
  return (
    <main id="main">
      <div className="container">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Membership" }]} />
        <PageHeader
          eyebrow="▼ MEMBERSHIP"
          title="Sign in"
          lede="Enter your email and we'll send a magic link. Private by design — no passwords to remember."
        />
        <MembershipSignIn />
      </div>
    </main>
  );
}