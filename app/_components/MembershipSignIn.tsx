"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-client";

export default function MembershipSignIn() {
  const { user, loading, signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const { error: err } = await signInWithEmail(email.trim());
    setPending(false);
    if (err) {
      setError(err);
      return;
    }
    setSent(true);
  }

  if (loading) {
    return (
      <div className="membership-panel">
        <p className="membership-panel__status">Loading…</p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="membership-panel">
        <p className="membership-panel__status">
          Signed in as <strong>{user.email}</strong>
        </p>
        <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", marginTop: "1rem" }}>
          <Link className="btn btn--primary" href="/membership/account">
            Go to account
          </Link>
          <Link className="btn btn--outline" href="/pricing">
            View plans
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="membership-panel">
      <form onSubmit={handleSubmit}>
        <label htmlFor="membership-email">Email address</label>
        <input
          id="membership-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={pending || sent}
        />
        <button className="btn btn--primary btn--full" type="submit" disabled={pending || sent}>
          {pending ? "Sending…" : sent ? "Check your email" : "Send magic link"}
        </button>
      </form>
      {sent && (
        <p className="membership-panel__status">
          We sent a sign-in link to <strong>{email}</strong>. Open it on this device to continue.
        </p>
      )}
      {error && <p className="membership-panel__error">{error}</p>}
      <p className="membership-panel__status" style={{ marginTop: "1.5rem" }}>
        New here?{" "}
        <Link href="/pricing">See membership plans</Link> — the founding price is $4.99/mo.
      </p>
    </div>
  );
}