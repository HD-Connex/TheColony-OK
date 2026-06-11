"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-client";
import InnerPageShell from "../_components/InnerPageShell";

const OK_COUNTIES = [
  "Oklahoma", "Tulsa", "Cleveland", "Comanche", "Canadian", "Rogers", "Payne", "Washington", "Grady", "Cherokee",
  // Add more as needed for the platform
];

export default function MyCountiesPage() {
  const { user, isMember, loading } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (loading) return <div className="container" style={{ padding: "var(--space-16) 0" }}>Loading…</div>;

  if (!user || !isMember) {
    return (
      <InnerPageShell
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "My Counties" }]}
        eyebrow="▼ MEMBER PREFERENCES"
        title="My Counties"
        lede="Member-only feature."
      >
        <div className="container" style={{ padding: "var(--space-8) 0" }}>
          <p>This feature is for active members. <Link href="/pricing">Join now</Link> or <Link href="/membership">sign in</Link>.</p>
        </div>
      </InnerPageShell>
    );
  }

  const toggle = (c: string) => {
    setSelected((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  };

  const save = async () => {
    setSaving(true);
    // In real: POST to /api/newsletter/preferences or update via supabase client with user id
    // For now, simulate + could call existing subscribe with counties
    await new Promise((r) => setTimeout(r, 600));
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <InnerPageShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "My Counties" }]}
      eyebrow="▼ MEMBER PREFERENCES"
      title="My Counties"
      lede="Select the Oklahoma counties you care about most. We'll tailor your newsletter and feed."
    >
      <div className="container" style={{ padding: "var(--space-8) 0" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
          {OK_COUNTIES.map((c) => (
            <button
              key={c}
              onClick={() => toggle(c)}
              className={`btn btn--sm ${selected.includes(c) ? "btn--primary" : "btn--outline"}`}
            >
              {c}
            </button>
          ))}
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="btn btn--primary"
          style={{ marginTop: "var(--space-6)" }}
        >
          {saving ? "Saving…" : saved ? "Saved!" : "Save Preferences"}
        </button>

        <p className="fine-print" style={{ marginTop: "var(--space-4)" }}>
          Preferences are saved to your newsletter profile and used for personalized digests and the /my-feed tab.
        </p>
      </div>
    </InnerPageShell>
  );
}
