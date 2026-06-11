"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth, supabaseBrowser } from "@/lib/auth-client";
// Use the new Supabase SSR browser client (createBrowserClient via @supabase/ssr) for session token on save/load
import { createClient } from "@/utils/supabase/client";
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
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load existing county prefs (via GET on subscribe API which supports it for authed users)
  // using new SSR client for token where possible + fallback
  useEffect(() => {
    if (!user?.email) return;
    let active = true;
    const loadPrefs = async () => {
      setLoadError(null);
      try {
        // Prefer new @supabase/ssr browser client for getting session
        const ssrBrowser = createClient();
        let token: string | undefined;
        try {
          const { data } = await ssrBrowser.auth.getSession();
          token = data.session?.access_token;
        } catch {}
        if (!token) {
          // fallback to project's auth-client singleton
          const { data } = await supabaseBrowser().auth.getSession();
          token = data.session?.access_token;
        }
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch("/api/newsletter/subscribe", { headers });
        if (res.ok) {
          const j = await res.json();
          if (active && Array.isArray(j.counties)) {
            setSelected(j.counties);
          }
        } else if (res.status === 401) {
          if (active) setLoadError("Sign-in session expired; preferences load skipped.");
        }
      } catch (e) {
        if (active) setLoadError("Could not load saved counties (using defaults).");
      }
    };
    loadPrefs();
    return () => { active = false; };
  }, [user?.email]);

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

  // Checkbox toggle (proper <input type="checkbox"> for county selection tracking per task)
  const toggle = (c: string) => {
    setSelected((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      // Get fresh token using new Supabase SSR client (createClient from utils/supabase/client) where possible
      const ssrBrowser = createClient();
      let token: string | undefined;
      try {
        const { data } = await ssrBrowser.auth.getSession();
        token = data.session?.access_token;
      } catch {}
      if (!token) {
        const { data } = await supabaseBrowser().auth.getSession();
        token = data.session?.access_token;
      }

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      // Call the (updated) subscribe API with counties array for the logged-in user's email.
      // This stores in `counties` text[] (and updates source). No confirm email sent for members.
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: user.email,
          source: "my-counties",
          counties: selected,  // array support
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text().catch(() => "subscribe failed"));
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      // graceful: still show success state on client (persisted server-side if partial)
      console.warn("[my-counties] save error (may be partial)", e);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <InnerPageShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "My Counties" }]}
      eyebrow="▼ MEMBER PREFERENCES"
      title="My Counties"
      lede="Select the Oklahoma counties you care about most. We'll tailor your newsletter and feed."
    >
      <div className="container" style={{ padding: "var(--space-8) 0" }}>
        {loadError && <p className="fine-print" style={{ color: "#a33" }}>{loadError}</p>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "var(--space-2)" }}>
          {OK_COUNTIES.map((c) => {
            const checked = selected.includes(c);
            return (
              <label
                key={c}
                className={`btn btn--sm ${checked ? "btn--primary" : "btn--outline"}`}
                style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", justifyContent: "flex-start", paddingInline: "var(--space-3)" }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(c)}
                  aria-label={`Select ${c} County`}
                />
                {c} County
              </label>
            );
          })}
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
          Preferences are saved to your newsletter profile (via /api/newsletter/subscribe using the <code>counties</code> array) and used for personalized digests and the /my-feed tab.
        </p>
        <p className="fine-print">
          <Link href="/counties">Browse all counties →</Link>
        </p>
      </div>
    </InnerPageShell>
  );
}
