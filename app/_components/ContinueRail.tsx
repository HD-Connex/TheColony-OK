"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-client";
import { createClient } from "@/utils/supabase/client"; // P5: shared singleton browser client (post auth-client reuse + cache fix)
import SectionRail from "./SectionRail";

/**
 * Enhanced ContinueRail (Phase 1 discovery breadth).
 * - Made reusable / site-wide: drop-in on homepage, my-feed, stories, watch, shows, podcasts, clips etc.
 * - Reuses SectionRail for consistent rail UI (was inline styles).
 * - When signed in: reads from watch_progress + resolves real titles (episodes primary).
 * - Fallback localStorage (colony:progress).
 * - Enhanced: title prop, more resilient, visible data note, supports continue links.
 * - No new deps. Data-driven via DB when signed in.
 */
export default function ContinueRail({ title = "Continue Watching", compact = false }: { title?: string; compact?: boolean }) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<Array<{ id: string; position: number; label: string }>>([]);

  useEffect(() => {
    const load = async () => {
      const collected: Array<{ id: string; position: number; label: string; ts: number }> = [];

      if (user?.id) {
        try {
          const supabase = createClient();
          const { data: progRows } = await supabase
            .from("watch_progress")
            .select("episode_id, position_seconds, updated_at")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })
            .limit(4);

          if (progRows && progRows.length > 0) {
            const ids = progRows.map((r: any) => r.episode_id);
            // Resolve titles (podcasts/episodes primary for continue)
            const { data: eps } = await supabase
              .from("episodes")
              .select("id, title")
              .in("id", ids);

            const titleById = new Map<string, string>((eps || []).map((e: any) => [String(e.id), String(e.title || '')]));

            progRows.forEach((row: any) => {
              const title: string = titleById.get(String(row.episode_id)) || `Episode ${String(row.episode_id).slice(0, 8)}`;
              collected.push({
                id: row.episode_id,
                position: row.position_seconds || 0,
                label: title,
                ts: new Date(row.updated_at).getTime(),
              });
            });
          }
        } catch {
          // fall through to localStorage
        }
      }

      // LocalStorage fallback / supplement (anon or items not yet in DB) — keeps feature visible in seed/demo
      try {
        const raw = localStorage.getItem("colony:progress");
        if (raw) {
          const all = JSON.parse(raw);
          Object.entries(all).forEach(([id, v]: any) => {
            if (!collected.find((c) => c.id === id)) {
              collected.push({
                id,
                position: v.position || 0,
                label: `Episode ${id.slice(0, 8)}`,
                ts: v.ts || 0,
              });
            }
          });
        }
      } catch {}

      const sorted = collected
        .sort((a, b) => b.ts - a.ts)
        .slice(0, 4)
        .map(({ id, position, label }) => ({ id, position, label }) as { id: string; position: number; label: string });

      setItems(sorted);
    };

    if (!authLoading) {
      load();
    }
  }, [user, authLoading]);

  if (items.length === 0) return null;

  const railContent = (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
      {items.map((it) => (
        <Link
          key={it.id}
          href={`/podcasts?continue=${it.id}#player`}
          className="btn btn--outline"
          style={{ whiteSpace: "nowrap" }}
        >
          {it.label} · {Math.floor(it.position / 60)}m
        </Link>
      ))}
    </div>
  );

  if (compact) {
    return (
      <div style={{ margin: "var(--space-4) 0" }}>
        <div className="section-rail__header" style={{ marginBottom: 4 }}>
          <h3 className="section-rail__title" style={{ fontSize: "var(--text-sm)" }}>{title}</h3>
        </div>
        {railContent}
      </div>
    );
  }

  return (
    <SectionRail title={title} dateline="RESUME · EPISODES &amp; SHOWS">
      {railContent}
      <p className="fine-print" style={{ marginTop: "var(--space-2)" }}>
        Progress saved to your account (watch_progress). Local fallback keeps it visible with seed.
      </p>
    </SectionRail>
  );
}
