"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Phase 3 polish: Continue Watching rail.
 * Uses localStorage viewer fallback (real DB path available via /api/progress when userId passed from auth).
 * Shows last few watched episodes with position.
 * Drop into home or member dashboard.
 */
export default function ContinueRail() {
  const [items, setItems] = useState<Array<{ id: string; position: number; label: string }>>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("colony:progress");
      if (!raw) return;
      const all = JSON.parse(raw);
      const recent = Object.entries(all)
        .map(([id, v]: any) => ({ id, position: v.position || 0, ts: v.ts || 0 }))
        .sort((a, b) => b.ts - a.ts)
        .slice(0, 4);
      // Label is best-effort; in real use episode title from API
      setItems(recent.map(r => ({ id: r.id, position: r.position, label: `Episode ${r.id.slice(0,8)}` })));
    } catch {}
  }, []);

  if (items.length === 0) return null;

  return (
    <section style={{ margin: "var(--space-6) 0" }}>
      <h2 className="section-title" style={{ marginBottom: "var(--space-2)" }}>Continue Watching</h2>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
        {items.map((it) => (
          <Link key={it.id} href={`/podcasts?continue=${it.id}#player`} className="btn btn--outline" style={{ whiteSpace: "nowrap" }}>
            {it.label} · {Math.floor(it.position / 60)}m
          </Link>
        ))}
      </div>
      <p className="fine-print">Progress saved to your account when signed in (watch_progress table).</p>
    </section>
  );
}
