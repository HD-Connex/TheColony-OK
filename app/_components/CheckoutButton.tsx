"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/auth-client";

interface CheckoutButtonProps {
  planId: string;
  className?: string;
  children: React.ReactNode;
}

export default function CheckoutButton({ planId, className, children }: CheckoutButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);
    try {
      const { data } = await supabaseBrowser().auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        window.location.href = `/membership?redirect=/pricing`;
        return;
      }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Checkout failed.");
        return;
      }
      if (json.url) window.location.href = json.url;
    } catch {
      setError("Checkout failed. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <span style={{ display: "contents" }}>
      <button className={className} type="button" disabled={pending} onClick={handleClick}>
        {pending ? "Redirecting…" : children}
      </button>
      {error && (
        <p style={{ fontSize: ".8125rem", color: "var(--color-danger, #c44)", marginTop: ".5rem" }}>
          {error}
        </p>
      )}
    </span>
  );
}