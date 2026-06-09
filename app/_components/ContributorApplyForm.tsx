"use client";

import { useState } from "react";
import Link from "next/link";
import { CONTRIBUTOR_PLANS, isContributorPlanId } from "@/lib/contributor-plans";

interface Props {
  defaultPlanId?: string;
}

export default function ContributorApplyForm({ defaultPlanId = "featured" }: Props) {
  const initialPlan = isContributorPlanId(defaultPlanId) ? defaultPlanId : "featured";
  const [planId, setPlanId] = useState(initialPlan);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const clips = [form.get("clip1"), form.get("clip2"), form.get("clip3")]
      .map((v) => String(v ?? "").trim())
      .filter(Boolean);

    const payload = {
      planId,
      name: String(form.get("name") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      slug: String(form.get("slug") ?? "").trim() || undefined,
      role: String(form.get("role") ?? "").trim() || undefined,
      bio: String(form.get("bio") ?? "").trim() || undefined,
      website: String(form.get("website") ?? "").trim() || undefined,
      xHandle: String(form.get("x_handle") ?? "").trim() || undefined,
      headshotUrl: String(form.get("headshot_url") ?? "").trim() || undefined,
      clips,
    };

    try {
      const res = await fetch("/api/contributors/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Application failed. Try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Application failed. Try again.");
    } finally {
      setPending(false);
    }
  }

  if (submitted) {
    return (
      <div className="contrib-apply__success" id="apply">
        <h2>Application received.</h2>
        <p style={{ color: "var(--color-text-ink-soft)", maxWidth: "48ch", margin: "0 auto var(--space-6)" }}>
          Editorial review within 48 hours. We&apos;ll email you at the address you provided with next steps for your{" "}
          {CONTRIBUTOR_PLANS.find((p) => p.id === planId)?.name ?? "masthead"} tier.
        </p>
        <Link className="btn btn--ink" href="/journalists">
          View the masthead →
        </Link>
      </div>
    );
  }

  return (
    <form className="contrib-apply" id="apply" onSubmit={handleSubmit}>
      <h2 className="contrib-apply__title">Apply for the masthead</h2>
      <p className="contrib-apply__lede">
        Select your exposure tier, share three published clips, and tell us what you cover. Payment is collected after
        editorial approval.
      </p>

      <div className="contrib-apply__grid">
        <div className="contrib-apply__field">
          <label className="contrib-apply__label" htmlFor="plan">
            Exposure tier
          </label>
          <select
            className="contrib-apply__select"
            id="plan"
            name="plan"
            value={planId}
            onChange={(e) => {
              const value = e.target.value;
              if (isContributorPlanId(value)) setPlanId(value);
            }}
          >
            {CONTRIBUTOR_PLANS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — ${p.price}/mo
              </option>
            ))}
          </select>
        </div>

        <div className="contrib-apply__field">
          <label className="contrib-apply__label" htmlFor="name">
            Full name
          </label>
          <input className="contrib-apply__input" id="name" name="name" required />
        </div>

        <div className="contrib-apply__field">
          <label className="contrib-apply__label" htmlFor="email">
            Email
          </label>
          <input className="contrib-apply__input" id="email" name="email" type="email" required />
        </div>

        <div className="contrib-apply__field">
          <label className="contrib-apply__label" htmlFor="slug">
            Profile slug (optional)
          </label>
          <input className="contrib-apply__input" id="slug" name="slug" placeholder="jane-doe" />
        </div>

        <div className="contrib-apply__field">
          <label className="contrib-apply__label" htmlFor="role">
            Role / beat
          </label>
          <input className="contrib-apply__input" id="role" name="role" placeholder="Investigations · Rural OK" />
        </div>

        <div className="contrib-apply__field contrib-apply__field--full">
          <label className="contrib-apply__label" htmlFor="bio">
            Short bio
          </label>
          <textarea className="contrib-apply__textarea" id="bio" name="bio" rows={4} />
        </div>

        <div className="contrib-apply__field">
          <label className="contrib-apply__label" htmlFor="website">
            Website
          </label>
          <input className="contrib-apply__input" id="website" name="website" type="url" placeholder="https://" />
        </div>

        <div className="contrib-apply__field">
          <label className="contrib-apply__label" htmlFor="x_handle">
            X handle
          </label>
          <input className="contrib-apply__input" id="x_handle" name="x_handle" placeholder="@handle" />
        </div>

        <div className="contrib-apply__field">
          <label className="contrib-apply__label" htmlFor="headshot_url">
            Headshot URL (optional)
          </label>
          <input className="contrib-apply__input" id="headshot_url" name="headshot_url" type="url" />
        </div>

        <div className="contrib-apply__field">
          <label className="contrib-apply__label" htmlFor="clip1">
            Clip 1 URL
          </label>
          <input className="contrib-apply__input" id="clip1" name="clip1" type="url" required />
        </div>

        <div className="contrib-apply__field">
          <label className="contrib-apply__label" htmlFor="clip2">
            Clip 2 URL
          </label>
          <input className="contrib-apply__input" id="clip2" name="clip2" type="url" required />
        </div>

        <div className="contrib-apply__field">
          <label className="contrib-apply__label" htmlFor="clip3">
            Clip 3 URL
          </label>
          <input className="contrib-apply__input" id="clip3" name="clip3" type="url" required />
        </div>
      </div>

      <div style={{ marginTop: "var(--space-8)" }}>
        <button className="btn btn--ink btn--lg" type="submit" disabled={pending}>
          {pending ? "Submitting…" : "Submit application"}
        </button>
      </div>

      {error && <p className="contrib-apply__error">{error}</p>}
    </form>
  );
}