"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const county = String(fd.get("county") ?? "").trim() || undefined;
    if (!email) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "homepage", county }),
      });
      if (res.ok) {
        setStatus("ok");
        (e.target as HTMLFormElement).reset();
      } else {
        setStatus("err");
      }
    } catch {
      setStatus("err");
    }
  }

  if (status === "ok") {
    return <p className="newsletter__disclaimer" style={{ color: "#0a7" }}>Check your email to confirm (double opt-in). Then you're on the list.</p>;
  }

  return (
    <form className="newsletter__form" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="newsletter-email">Email address for The Briefing</label>
      <input
        id="newsletter-email"
        type="email"
        name="email"
        className="newsletter__input"
        placeholder="YOUR@EMAIL.COM"
        required
        aria-label="Email address for The Briefing"
        disabled={status === "sending"}
      />
      <input
        id="newsletter-county"
        name="county"
        className="newsletter__input"
        placeholder="COUNTY (optional, for local editions)"
        aria-label="County for local newsletter edition"
        disabled={status === "sending"}
        style={{ marginTop: 4 }}
      />
      <button type="submit" className="btn btn--primary" disabled={status === "sending"}>
        {status === "sending" ? "Joining..." : "Join Free"}
      </button>
      <p className="newsletter__disclaimer">{status === "err" ? "Could not sign up — try again." : "No spam. Unsubscribe in one click. Server submission, no mailto."}</p>
    </form>
  );
}