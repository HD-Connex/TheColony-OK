"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-client";
import { createClient } from "@/utils/supabase/client";

/**
 * Improved Continue Watching rail (Phase 3/4 polish).
 * - When signed in: reads from watch_progress (RLS-protected per user) + resolves real episode titles.
 * - Falls back to localStorage (colony:progress) for anonymous sessions or extra items.
 * - Used on my-feed and can be dropped on homepage/member areas.
 */
export default function ContinueRail() {
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
            const ids = progRows.map((r) => r.episode_id);
            // Resolve titles (podcasts/episodes are the primary "continue" use case)
            const { data: eps } = await supabase
              .from("episodes")
              .select("id, title")
              .in("id", ids);

            const titleById = new Map((eps || []).map((e: any) => [e.id, e.title as string]));

            progRows.forEach((row: any) => {
              const title = titleById.get(row.episode_id) || `Episode ${row.episode_id.slice(0, 8)}`;
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

      // LocalStorage fallback / supplement (anon or items not yet in DB)
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
        .map(({ id, position, label }) => ({ id, position, label }));

      setItems(sorted);
    };

    if (!authLoading) {
      load();
    }
  }, [user, authLoading]);

  if (items.length === 0) return null;

  return (
    <section style={{ margin: "var(--space-6) 0" }}>
      <h2 className="section-title" style={{ marginBottom: "var(--space-2)" }}>Continue Watching</h2>
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
      <p className="fine-print">Progress saved to your account when signed in (watch_progress table).</p>
    </section>
  );
}
