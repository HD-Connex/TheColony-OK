"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-client";
import { OK_COUNTIES, COUNTY_LABEL } from "@/lib/counties";

/**
 * Enhanced NewsletterForm for "The Briefing" signup blocks (internal platform, fully self-contained).
 * Reuses Phase 1 county support (0021 migration, my-counties prefs via GET/POST to /api/newsletter/subscribe).
 * Variants for placement: default (footer), plate (dedicated paper/cream blocks), inline (after filters), sidebar (live etc).
 * County picker upgraded from free-text to <select> over shared OK_COUNTIES for better UX/accessibility.
 * Auto-prefills from authenticated user's saved counties (non-breaking; falls back gracefully).
 * Source tracking for analytics / digest targeting.
 * Mobile-friendly (stacks), accessible (labels/aria), rate-limit friendly (API 5/hr POST).
 * DS: zero-radius, rules via parent .newsletter__*, mono labels, alarm/foil accents per Heirloom Press (variables + premium.css).
 */

export interface NewsletterFormProps {
  variant?: "default" | "plate" | "inline" | "sidebar";
  source?: string;
  className?: string;
  // Optional: pass a pre-selected county (e.g. from page context)
  defaultCounty?: string;
}

export default function NewsletterForm({
  variant = "default",
  source = "web",
  className,
  defaultCounty,
}: NewsletterFormProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [selectedCounty, setSelectedCounty] = useState<string>(defaultCounty || "");
  const [prefillNote, setPrefillNote] = useState<string | null>(null);

  // Phase 1 multiple lists (daily, county, alerts) — basic UI checkboxes for breadth in forms + /newsletter/preferences.
  // Sent to existing subscribe API (lists array supported; stored via 0028 migration column).
  const ALL_LISTS = ["daily", "county", "alerts"] as const;
  const [selectedLists, setSelectedLists] = useState<string[]>(["daily", "county"]); // sensible defaults for seed visibility

  // Minor enhancement: prefill county from my-counties prefs when authenticated (Phase 1 integration).
  // Uses the existing GET on subscribe API (no rate limit on reads). Graceful fallback if 401 or error.
  useEffect(() => {
    if (!user?.email || defaultCounty) return;
    let active = true;
    const load = async () => {
      try {
        // No auth header needed for public; SSR/bearer handled server-side for the user email resolution
        const res = await fetch("/api/newsletter/subscribe");
        if (!active || !res.ok) return;
        const j = await res.json();
        const prefs: string[] = Array.isArray(j?.counties) ? j.counties : [];
        if (prefs.length > 0) {
          // Prefill first saved county (common case for "local edition"); user can change in select
          setSelectedCounty(prefs[0]);
          setPrefillNote(`Using your saved county preference (${prefs[0]}). Change to update.`);
        }
        // Prefill lists if API returns (future GET enhancement)
        const listsPref: string[] = Array.isArray(j?.lists) ? j.lists : [];
        if (listsPref.length > 0) setSelectedLists(listsPref);
      } catch {
        // silent; non-blocking for public signups
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [user?.email, defaultCounty]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const countyRaw = String(fd.get("county") ?? "").trim() || selectedCounty;
    const county = countyRaw || undefined;
    // Support both single county (string) and counties (array) per Phase 1 county feeds + 0021 migration
    const counties = county ? [county] : undefined;
    // Multiple lists (daily/county/alerts) — sent alongside for API + prefs
    const lists = selectedLists.length > 0 ? selectedLists : undefined;
    if (!email) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source,
          county,
          counties,
          lists,
        }),
      });
      if (res.ok) {
        setStatus("ok");
        (e.target as HTMLFormElement).reset();
        setSelectedCounty(""); // reset picker
        setPrefillNote(null);
        setSelectedLists(["daily", "county"]); // reset to defaults
      } else {
        setStatus("err");
      }
    } catch {
      setStatus("err");
    }
  }

  const formClasses = [
    "newsletter__form",
    variant === "inline" ? "newsletter__form--inline" : "",
    variant === "sidebar" ? "newsletter__form--sidebar" : "",
    className || "",
  ].filter(Boolean).join(" ");

  const inputClasses = "newsletter__input";
  const isPlate = variant === "plate";
  const isSidebar = variant === "sidebar";

  if (status === "ok") {
    return (
      <p className="newsletter__disclaimer" style={{ color: isPlate ? "var(--color-brass-deep)" : "#0a7" }}>
        Check your email to confirm (double opt-in). Then you're on the list for the local briefing.
      </p>
    );
  }

  return (
    <form className={formClasses} onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor={`newsletter-email-${variant}`}>Email address for The Briefing</label>
      <input
        id={`newsletter-email-${variant}`}
        type="email"
        name="email"
        className={inputClasses}
        placeholder="YOUR@EMAIL.COM"
        required
        aria-label="Email address for The Briefing"
        disabled={status === "sending"}
      />

      {/* Upgraded county picker: select from canonical Phase 1 OK_COUNTIES list (reusable, accessible, better than free-text) */}
      <label className="sr-only" htmlFor={`newsletter-county-${variant}`}>County for local newsletter edition (optional)</label>
      <select
        id={`newsletter-county-${variant}`}
        name="county"
        className={inputClasses}
        aria-label="County for local newsletter edition (optional)"
        disabled={status === "sending"}
        value={selectedCounty}
        onChange={(e) => setSelectedCounty(e.target.value)}
      >
        <option value="">{COUNTY_LABEL("")}</option>
        {OK_COUNTIES.map((c) => (
          <option key={c} value={c}>{COUNTY_LABEL(c)}</option>
        ))}
      </select>

      {/* Multiple lists UI (daily, county, alerts) — basic checkboxes for Phase 1 newsletter breadth. Reuses form submit to /api/newsletter/subscribe */}
      <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", fontSize: "var(--text-xs)", margin: "4px 0" }}>
        {ALL_LISTS.map((l) => (
          <label key={l} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <input
              type="checkbox"
              checked={selectedLists.includes(l)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedLists((prev) => prev.includes(l) ? prev : [...prev, l]);
                } else {
                  setSelectedLists((prev) => prev.filter((x) => x !== l));
                }
              }}
              disabled={status === "sending"}
            />
            <span>{l === "daily" ? "Daily Briefing" : l === "county" ? "County Editions" : "Breaking Alerts"}</span>
          </label>
        ))}
      </div>

      <button
        type="submit"
        className={`btn btn--primary${isSidebar ? " btn--sm" : ""}`}
        disabled={status === "sending"}
      >
        {status === "sending" ? "Joining..." : "Subscribe Free"}
      </button>

      {prefillNote && (
        <p className="newsletter__disclaimer" style={{ fontSize: "var(--text-xs)", opacity: 0.8 }}>
          {prefillNote}
        </p>
      )}

      <p className="newsletter__disclaimer">
        {status === "err" ? "Could not sign up — try again." : "No spam. Unsubscribe in one click. Server submission, no mailto."}
      </p>
    </form>
  );
}
