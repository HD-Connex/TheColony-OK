"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-client";
import { createClient } from "@/utils/supabase/client"; // P5 singleton shared (consolidated)
import InnerPageShell from "../../_components/InnerPageShell";
import NewsletterSignup from "../../_components/NewsletterSignup";

/**
 * Minimal /newsletter/preferences stub (Phase 1 newsletter breadth).
 * Reuses existing /api/newsletter/subscribe (GET for prefs + POST with lists),
 * NewsletterSignup/NewsletterForm (now with multi-list checkboxes: daily, county, alerts),
 * my-counties auth + SSR client pattern.
 * Visible + functional for seed: select lists, save (persists to lists[] column post-0028),
 * shows current. County still handled via form too.
 * Linkable from footer/newsletter blocks.
 * No heavy UI; basic, data-driven via API.
 */

const ALL_LISTS = ["daily", "county", "alerts"] as const;

export default function NewsletterPreferencesPage() {
  const { user, isMember, loading: authLoading } = useAuth();
  const [selectedLists, setSelectedLists] = useState<string[]>(["daily", "county"]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [current, setCurrent] = useState<{ email?: string; lists?: string[]; confirmed?: boolean }>({});

  // Load current prefs (lists + counties) via the subscribe GET (supports authed)
  useEffect(() => {
    if (!user?.email) return;
    let active = true;
    const load = async () => {
      setLoadError(null);
      try {
        const ssr = createClient();
        let token: string | undefined;
        try {
          const { data } = await ssr.auth.getSession();
          token = data.session?.access_token;
        } catch {}
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch("/api/newsletter/subscribe", { headers });
        if (res.ok) {
          const j = await res.json();
          if (active) {
            const lists = Array.isArray(j?.lists) ? j.lists : ["daily", "county"];
            setSelectedLists(lists.length ? lists : ["daily", "county"]);
            setCurrent({ email: j?.email, lists: j?.lists || [], confirmed: j?.confirmed });
          }
        } else if (res.status === 401) {
          if (active) setLoadError("Sign in to manage newsletter lists.");
        }
      } catch {
        if (active) setLoadError("Could not load preferences (using defaults).");
      }
    };
    load();
    return () => { active = false; };
  }, [user?.email]);

  if (authLoading) {
    return <div className="container" style={{ padding: "var(--space-16) 0" }}>Loading…</div>;
  }

  const toggleList = (l: string) => {
    setSelectedLists((prev) => prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]);
    setSaved(false);
  };

  const saveLists = async () => {
    if (!user?.email) return;
    setSaving(true);
    setSaved(false);
    setLoadError(null);
    try {
      const ssr = createClient();
      let token: string | undefined;
      try {
        const { data } = await ssr.auth.getSession();
        token = data.session?.access_token;
      } catch {}
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers,
        body: JSON.stringify({
          // email resolved server-side from session for authed
          source: "newsletter-preferences",
          lists: selectedLists,
        }),
      });
      if (res.ok) {
        const j = await res.json();
        setSaved(true);
        setCurrent((c) => ({ ...c, lists: j?.lists || selectedLists }));
      } else {
        setLoadError("Could not save lists.");
      }
    } catch {
      setLoadError("Save failed. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <InnerPageShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Newsletter" }, { label: "Preferences" }]}
      eyebrow="▼ THE BRIEFING · PREFERENCES"
      title="Newsletter Preferences"
      lede="Choose your lists. Daily briefings, county editions, breaking alerts. Powered by the same internal subscribe API."
      section={false}
      tone="paper"
    >
      {!user ? (
        <div>
          <p>Sign in for full preferences sync (lists + counties). Public signup still available below.</p>
          <Link className="btn btn--primary" href="/membership">Sign in / Join</Link>
          <div style={{ marginTop: "var(--space-8)" }}>
            <NewsletterSignup variant="plate" source="newsletter-preferences-public" title="Subscribe with list choices" />
          </div>
        </div>
      ) : (
        <div>
          <p className="fine-print">Signed in as {user.email}. Your choices are saved server-side (lists column) and used for future digests.</p>

          {loadError && <p style={{ color: "#c44" }}>{loadError}</p>}

          <div style={{ margin: "var(--space-6) 0", padding: "var(--space-4)", border: "var(--rule-hairline) solid var(--color-border)" }}>
            <h3 style={{ marginBottom: "var(--space-2)" }}>Your Lists</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ALL_LISTS.map((l) => (
                <label key={l} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={selectedLists.includes(l)}
                    onChange={() => toggleList(l)}
                  />
                  <span>
                    {l === "daily" && "Daily Briefing — core headlines & investigations"}
                    {l === "county" && "County Editions — local to your saved counties"}
                    {l === "alerts" && "Breaking Alerts — urgent dispatches & live drops"}
                  </span>
                </label>
              ))}
            </div>

            <button
              onClick={saveLists}
              disabled={saving}
              className="btn btn--primary"
              style={{ marginTop: "var(--space-4)" }}
            >
              {saving ? "Saving…" : "Save List Preferences"}
            </button>
            {saved && <span style={{ marginLeft: 12, color: "#0a7" }}>Saved ✓</span>}
            {current.lists && current.lists.length > 0 && (
              <p className="fine-print" style={{ marginTop: 8 }}>Current: {current.lists.join(", ")} {current.confirmed ? "(confirmed)" : "(pending confirm)"}</p>
            )}
          </div>

          {/* Also surface full signup form (reuses enhanced multi-list UI) */}
          <div style={{ marginTop: "var(--space-8)" }}>
            <NewsletterSignup
              variant="plate"
              source="newsletter-preferences"
              title="Update subscription or add email"
              copy="The form below now supports list selection (daily, county, alerts). Use for new signups or county changes."
            />
          </div>

          <p className="fine-print" style={{ marginTop: "var(--space-6)" }}>
            Lists are stored alongside counties (0028 migration). Unsubscribe via email links. See <Link href="/my-counties">My Counties</Link> for location prefs.
          </p>
        </div>
      )}
    </InnerPageShell>
  );
}
