"use client";

import React, { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/auth-client";
import { supabaseConfigured } from "@/lib/supabase";

interface Comment {
  id: string;
  parent_id: string | null;
  user_id: string | null;
  target_id?: string;
  content: string;
  created_at: string;
  approved?: boolean;
}

interface Props {
  targetType: "episode" | "live" | "story" | "contributor" | "vs";
  targetId: string;
  isMember: boolean;
  currentUserId?: string | null;
}

/**
 * Threaded comments (reuses live-chat realtime postgres_changes pattern).
 * Member gated for posting. Public read of approved.
 * Admin moderation happens in /admin (approved flag).
 */
export default function ThreadedComments({ targetType, targetId, isMember, currentUserId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function load() {
    if (!supabaseConfigured()) return;
    const res = await fetch(`/api/comments?target_type=${targetType}&target_id=${targetId}`);
    const json = await res.json();
    setComments(json.comments || []);
  }

  useEffect(() => {
    load();

    if (!supabaseConfigured()) return;

    const channel = supabaseBrowser()
      .channel(`comments:${targetType}:${targetId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "threaded_comments", filter: `target_type=eq.${targetType}` },
        (payload) => {
          const c = payload.new as Comment;
          if (c.target_id === targetId && c.approved !== false) {
            setComments((prev) => [...prev, c]);
          }
        }
      )
      .subscribe();

    return () => {
      supabaseBrowser().removeChannel(channel);
    };
  }, [targetType, targetId]);

  async function post(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim() || !isMember || !currentUserId) return;
    setSending(true);
    try {
      await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUserId,
          target_type: targetType,
          target_id: targetId,
          content: input.trim(),
          parent_id: replyTo,
        }),
      });
      setInput("");
      setReplyTo(null);
      // realtime will append; fallback reload
      setTimeout(load, 400);
    } finally {
      setSending(false);
    }
  }

  // naive thread grouping
  const roots = comments.filter((c) => !c.parent_id);
  const byParent = new Map<string, Comment[]>();
  comments.forEach((c) => {
    if (c.parent_id) {
      if (!byParent.has(c.parent_id)) byParent.set(c.parent_id, []);
      byParent.get(c.parent_id)!.push(c);
    }
  });

  function renderThread(c: Comment, depth = 0) {
    const replies = byParent.get(c.id) || [];
    return (
      <div key={c.id} style={{ marginLeft: depth * 12, borderLeft: depth ? "2px solid var(--color-rule-soft)" : "none", paddingLeft: depth ? 8 : 0, marginBottom: 8 }}>
        <div style={{ fontSize: 13, background: "#faf8f0", padding: 6, border: "1px solid #111" }}>
          <span style={{ fontFamily: "monospace", opacity: 0.7 }}>{new Date(c.created_at).toLocaleTimeString()}</span>{" "}
          {c.content}
          {isMember && <button onClick={() => setReplyTo(c.id)} style={{ marginLeft: 8, fontSize: 11 }}>reply</button>}
        </div>
        {replies.map((r) => renderThread(r, depth + 1))}
      </div>
    );
  }

  return (
    <div className="threaded-comments" style={{ marginTop: 16 }}>
      <h4 style={{ margin: "8px 0" }}>Discussion</h4>
      <div style={{ maxHeight: 320, overflow: "auto", border: "2px solid #111", padding: 8, background: "#fff" }}>
        {roots.length === 0 && <p className="fine-print">No comments yet. Be the first (members only).</p>}
        {roots.map((r) => renderThread(r))}
      </div>

      {isMember ? (
        <form onSubmit={post} style={{ marginTop: 8, display: "flex", gap: 6 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={replyTo ? "Reply..." : "Add to the conversation..."}
            style={{ flex: 1 }}
          />
          <button type="submit" disabled={sending || !input.trim()} className="btn btn--primary">Send</button>
          {replyTo && <button type="button" onClick={() => setReplyTo(null)} className="btn btn--outline">Cancel reply</button>}
        </form>
      ) : (
        <p className="fine-print">Members only. Join to comment.</p>
      )}
    </div>
  );
}
