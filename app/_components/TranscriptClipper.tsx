"use client";

import { useState } from "react";

interface Props {
  href: string;
  title: string;
  startTime?: number;
  phrase?: string; // the spoken phrase / chunk
  epId?: string;   // for real moment creation
}

/**
 * Phase 3 polish: for transcript / spoken phrase search results.
 * - Shows time badge
 * - "Jump" is the link itself
 * - "Create shareable clip" calls /api/clips/moment (if epId + time available) or falls back to enhanced link copy.
 * Creates a community clip record (pre-cleared for internal transcript moments).
 */
export default function TranscriptClipper({ href, title, startTime, phrase, epId }: Props) {
  const [status, setStatus] = useState<"idle" | "creating" | "done" | "err">("idle");
  const [clipLink, setClipLink] = useState<string | null>(null);

  const timeLabel = startTime != null
    ? `${Math.floor(startTime / 60)}:${(startTime % 60).toString().padStart(2, "0")}`
    : null;

  async function createMomentClip() {
    if (!epId || startTime == null) {
      // Fallback: just copy enhanced link
      const link = window.location.origin + href;
      await navigator.clipboard.writeText(link);
      setClipLink(link);
      setStatus("done");
      return;
    }

    setStatus("creating");
    try {
      const res = await fetch("/api/clips/moment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ep_id: epId,
          start_s: startTime,
          phrase: phrase || title,
          title: `Moment: ${title.slice(0, 60)}`,
        }),
      });
      const json = await res.json();
      if (res.ok && json.share_href) {
        const full = window.location.origin + json.share_href;
        setClipLink(full);
        await navigator.clipboard.writeText(full);
        setStatus("done");
      } else {
        setStatus("err");
      }
    } catch {
      setStatus("err");
    }
  }

  return (
    <div style={{ marginTop: 4, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
      {timeLabel && (
        <span style={{ fontSize: "var(--text-xs)", background: "var(--color-paper)", border: "1px solid var(--color-ink)", padding: "1px 4px" }}>
          at {timeLabel}
        </span>
      )}
      <a href={href} className="btn btn--sm btn--outline">Jump to moment</a>
      <button
        onClick={createMomentClip}
        disabled={status === "creating"}
        className="btn btn--sm btn--primary"
        title="Create pre-cleared community clip from this spoken phrase (member)"
      >
        {status === "creating" ? "Creating..." : "Create shareable clip"}
      </button>
      {status === "done" && clipLink && (
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-alarm)" }}>Copied! {clipLink.slice(0, 50)}…</span>
      )}
      {status === "err" && <span style={{ fontSize: "var(--text-xs)", color: "red" }}>Failed — try again or use link</span>}
    </div>
  );
}
