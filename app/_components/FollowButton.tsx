"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/auth-client";

/**
 * Basic Follow button for contributors (Phase 1 breadth discovery).
 * Reuses WatchlistButton + /api/watchlist exact client patterns (auth, token, fetch, states, redirect to membership).
 * Requires migration 0028 (contributor_follows table + RLS) + /api/contributors/follow .
 * For seed/demo: works once table applied; uses contributorId (uuid from getContributors).
 * Toggles "Follow" / "Following". Visible + functional on ContributorCard + [slug] profiles.
 * No new deps. Optimistic + error states.
 */
interface FollowButtonProps {
  contributorId: string;
  className?: string;
  compact?: boolean; // for cards
}

export default function FollowButton({ contributorId, className, compact }: FollowButtonProps) {
  const [following, setFollowing] = useState(false);
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
          setFollowing(false);
          return;
        }

        const res = await fetch(`/api/contributors/follow?contributorId=${encodeURIComponent(contributorId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!active) return;
        if (res.status === 401) {
          setFollowing(false);
          return;
        }

        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Could not load follow status.");
          return;
        }

        setFollowing(Boolean(json.following));
      } catch {
        if (!active) return;
        setError("Could not load follow status.");
      } finally {
        if (!active) return;
        setLoading(false);
      }
    })();

    return () => { active = false; };
  }, [contributorId]);

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

      const res = await fetch("/api/contributors/follow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ contributorId }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not update follow.");
        return;
      }

      setFollowing(Boolean(json.following));
    } catch {
      setError("Could not update follow.");
    } finally {
      setPending(false);
    }
  }

  const label = loading
    ? "…"
    : following
    ? (compact ? "Following" : "✓ Following")
    : (compact ? "Follow" : "+ Follow contributor");

  const btnClass = className || (compact ? "btn btn--sm btn--outline" : "btn btn--outline");

  return (
    <span style={{ display: "inline-block" }}>
      <button
        className={btnClass}
        type="button"
        disabled={loading || pending}
        onClick={handleClick}
        aria-pressed={following}
      >
        {pending ? "…" : label}
      </button>
      {error && (
        <p style={{ fontSize: ".75rem", color: "var(--color-danger, #c44)", marginTop: ".25rem" }}>
          {error}
        </p>
      )}
    </span>
  );
}
