import type { Metadata } from "next";
import Breadcrumbs from "../../_components/Breadcrumbs";
import PageHeader from "../../_components/PageHeader";
import MembershipAccount from "../../_components/MembershipAccount";

export const metadata: Metadata = {
  title: "Account",
  description: "Manage your Colony membership and account settings.",
  robots: { index: false, follow: false },
};

export default function MembershipAccountPage() {
  return (
    <main id="main">
      <div className="container">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Join", href: "/pricing" },
            { label: "Account" },
          ]}
        />
        <PageHeader
          eyebrow="▼ ACCOUNT"
          title="Your account"
          lede="Membership status, billing, and privacy settings."
        />
        <div className="account-layout">
          <MembershipAccount />
        </div>
      </div>
    </main>
  );
}