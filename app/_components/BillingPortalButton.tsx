"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/auth-client";

interface BillingPortalButtonProps {
  className?: string;
}

export default function BillingPortalButton({ className }: BillingPortalButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);
    try {
      const { data } = await supabaseBrowser().auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        window.location.href = "/membership";
        return;
      }

      const res = await fetch("/api/stripe/billing-portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not open billing portal.");
        return;
      }
      if (json.url) window.location.href = json.url;
    } catch {
      setError("Could not open billing portal.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button className={className} type="button" disabled={pending} onClick={handleClick}>
        {pending ? "Opening…" : "Open billing portal"}
      </button>
      {error && (
        <p style={{ fontSize: ".8125rem", color: "var(--color-danger, #c44)", marginTop: ".5rem" }}>
          {error}
        </p>
      )}
    </>
  );
}