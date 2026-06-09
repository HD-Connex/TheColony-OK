"use client";

import { formatDuration } from "@/lib/format";

interface Chapter {
  t: number;
  label: string;
}

export default function ChapterSidebar({ chapters }: { chapters: Chapter[] }) {
  const seek = (t: number) => {
    const media = document.querySelector<HTMLMediaElement>(
      ".per-ep-page__player audio, .per-ep-page__player video",
    );
    if (!media) return;
    media.currentTime = t;
    void media.play().catch(() => {});
  };

  if (chapters.length === 0) return null;

  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-xs)",
          letterSpacing: "var(--track-wider)",
          textTransform: "uppercase",
          color: "var(--color-text-muted)",
          marginBottom: "var(--space-3)",
        }}
      >
        ▼ CHAPTERS
      </div>
      <ul className="chapter-list">
        {chapters.map((ch, idx) => (
          <li key={idx}>
            <button
              type="button"
              className="chapter-btn"
              onClick={() => seek(ch.t)}
              aria-label={`Seek to ${formatDuration(ch.t)} — ${ch.label}`}
            >
              <span style={{ marginRight: "var(--space-3)", color: "var(--color-alarm)" }}>
                {formatDuration(ch.t)}
              </span>
              {ch.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}