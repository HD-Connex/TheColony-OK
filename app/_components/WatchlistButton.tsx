"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/auth-client";

interface WatchlistButtonProps {
  seriesId: string;
  className?: string;
}

export default function WatchlistButton({ seriesId, className }: WatchlistButtonProps) {
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
    setError(null);

    (async () => {
      try {
        const { data } = await supabaseBrowser().auth.getSession();
        const token = data.session?.access_token;
        if (!token) {
          if (!active) return;
          setInWatchlist(false);
          return;
        }

        const res = await fetch(`/api/watchlist?seriesId=${encodeURIComponent(seriesId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!active) return;
        if (res.status === 401) {
          setInWatchlist(false);
          return;
        }

        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Could not load watchlist.");
          return;
        }

        setInWatchlist(Boolean(json.inWatchlist));
      } catch {
        if (!active) return;
        setError("Could not load watchlist.");
      } finally {
        if (!active) return;
        setLoading(false);
      }
    })();

    return () => { active = false; };
  }, [seriesId]);

  async function handleClick() {
    setPending(true);
    setError(null);
    try {
      const { data } = await supabaseBrowser().auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        window.location.href = `/membership?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }

      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ seriesId }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not update watchlist.");
        return;
      }

      setInWatchlist(Boolean(json.inWatchlist));
    } catch {
      setError("Could not update watchlist.");
    } finally {
      setPending(false);
    }
  }

  const label = loading ? "…" : inWatchlist ? "✓ On watchlist" : "+ Add to watchlist";

  return (
    <span style={{ display: "contents" }}>
      <button
        className={className}
        type="button"
        disabled={loading || pending}
        onClick={handleClick}
        aria-pressed={inWatchlist}
      >
        {pending ? "Saving…" : label}
      </button>
      {error && (
        <p style={{ fontSize: ".8125rem", color: "var(--color-danger, #c44)", marginTop: ".5rem" }}>
          {error}
        </p>
      )}
    </span>
  );
}