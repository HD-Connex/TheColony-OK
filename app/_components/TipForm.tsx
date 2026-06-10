"use client";

import { useState } from "react";

export default function TipForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const tip = String(fd.get("tip") ?? "").trim();
    const contact = String(fd.get("contact") ?? "").trim();
    if (!tip) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "tip", tip, contact: contact || undefined }),
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
    return <p className="tip-form__note" style={{ color: "#0a7" }}>Tip received. Thank you. We will only follow up if we open a file and you gave contact info.</p>;
  }

  return (
    <form className="tip-form" onSubmit={handleSubmit}>
      <label htmlFor="tip" className="sr-only">Your anonymous tip or story lead</label>
      <textarea id="tip" name="tip" rows={6} placeholder="Your tip..." required aria-label="Your anonymous tip or story lead" disabled={status === "sending"} />
      <label htmlFor="contact" className="sr-only">Optional contact email (we will never publish it)</label>
      <input id="contact" type="email" name="contact" placeholder="OPTIONAL CONTACT EMAIL" aria-label="Optional contact email (we will never publish it)" disabled={status === "sending"} />
      <button type="submit" className="btn btn--primary" disabled={status === "sending"}>
        {status === "sending" ? "Sending..." : "Submit Tip"}
      </button>
      <p className="tip-form__note">{status === "err" ? "Send failed — try again or use Signal." : "Secure server submission. We protect sources. No mailto."}</p>
    </form>
  );
}