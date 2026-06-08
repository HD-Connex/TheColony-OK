"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-client";
import { MEMBERSHIP_PLANS } from "@/lib/tiers";
import BillingPortalButton from "./BillingPortalButton";

export default function MembershipAccount() {
  const { user, isMember, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="account-card">
        <p className="membership-panel__status">Loading account…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="account-card">
        <h2>Sign in required</h2>
        <p>Sign in with your email to manage membership and account settings.</p>
        <Link className="btn btn--primary" href="/membership">
          Sign in with email
        </Link>
      </div>
    );
  }

  const plan = isMember ? MEMBERSHIP_PLANS.find((p) => p.id === "member") : MEMBERSHIP_PLANS[0];

  return (
    <>
      <div className="account-card">
        <h2>Profile</h2>
        <p>Signed in as <strong>{user.email}</strong></p>
        <button className="btn btn--outline" type="button" onClick={() => signOut()}>
          Sign out
        </button>
      </div>

      <div className="account-card">
        <h2>Membership</h2>
        <p>Manage billing, change tier, or cancel anytime.</p>
        <div className="account-tier">
          <div>
            <p style={{ fontWeight: 600, margin: 0 }}>{plan?.name ?? "Neighbor"}</p>
            <p style={{ fontSize: ".875rem", color: "var(--color-text-secondary)", margin: ".25rem 0 0" }}>
              {plan && plan.price > 0 ? `$${plan.price}/mo` : "Free tier"}
            </p>
          </div>
          <span className={`badge${isMember ? "" : ""}`}>{isMember ? "Active" : "Free"}</span>
        </div>
        {isMember ? (
          <BillingPortalButton className="btn btn--outline btn--full" />
        ) : (
          <Link className="btn btn--primary btn--full" href="/pricing">
            Upgrade membership
          </Link>
        )}
      </div>

      <div className="account-card">
        <h2>Privacy</h2>
        <p>
          The Colony never sells your data and uses no behavioral ad tracking.
          Request a full data export or deletion anytime at privacy@thecolonyok.com.
        </p>
      </div>
    </>
  );
}