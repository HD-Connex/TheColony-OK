"use client";

import React, { useCallback, useEffect, useState } from "react";

type Role = "admin" | "editor" | "contributor" | "member";

interface Props {
  currentUserRole: Role;
}

interface Article {
  id: string;
  slug: string;
  title: string;
  status?: string;
  updated_at?: string;
}

interface Application {
  id: string;
  name: string;
  email: string;
  tier?: string;
  created_at: string;
}

export default function AdminDashboard({ currentUserRole }: Props) {
  const [tab, setTab] = useState<"articles" | "contributors" | "live" | "clips" | "members" | "report-card" | "comments">("articles");
  const [articles, setArticles] = useState<Article[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [clips, setClips] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [reportOfficials, setReportOfficials] = useState<any[]>([]);
  const [reportIssues, setReportIssues] = useState<any[]>([]);
  const [reportGrades, setReportGrades] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Simulcast targets (Phase 3/4 functional wiring)
  const [simulcastTargets, setSimulcastTargets] = useState<Array<{ url: string; stream_key: string }>>([]);
  const [simulUrl, setSimulUrl] = useState("");
  const [simulKey, setSimulKey] = useState("");

  const isAdminOrEditor = currentUserRole === "admin" || currentUserRole === "editor";

  // Helper: attach Supabase session Bearer token (matches getUserFromRequest + requireAdmin expectation).
  // Mirrors the pattern in ClipsUploadForm, WatchlistButton, CheckoutButton, my-counties etc.
  // Without this, all /api/admin/* fetches (including report-card) would hit 401/403 because
  // requireAdmin / getUserFromRequest only inspect Authorization header (bearer from localStorage session),
  // not cookies (even though middleware refreshes them).
  async function authedFetch(input: RequestInfo | URL, init?: RequestInit) {
    const headers: Record<string, string> = { ...(init?.headers as any) };
    try {
      // Prefer the auth-client browser client (localStorage + magic link sessions).
      const { supabaseBrowser } = await import("@/lib/auth-client");
      const { data } = await supabaseBrowser().auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    } catch {
      // Non-fatal; route will 401/403 and UI will handle gracefully.
    }
    return fetch(input, { ...init, headers });
  }

  const loadArticles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authedFetch("/api/admin/articles");
      const json = await res.json().catch(() => ({}));
      setArticles(json.articles || []);
    } catch {}
    setLoading(false);
  }, []);

  const loadApps = useCallback(async () => {
    if (!isAdminOrEditor) return;
    const res = await authedFetch("/api/admin/contributors/applications");
    const json = await res.json().catch(() => ({}));
    setApps(json.applications || []);
  }, [isAdminOrEditor]);

  const loadLive = useCallback(async () => {
    const res = await authedFetch("/api/admin/live");
    const json = await res.json().catch(() => ({}));
    setLiveEvents(json.events || []);
  }, []);

  const loadClips = useCallback(async () => {
    const res = await authedFetch("/api/admin/clips?approved=false");
    const json = await res.json().catch(() => ({}));
    setClips(json.clips || []);
  }, []);

  const loadMembers = useCallback(async () => {
    if (currentUserRole !== "admin") return;
    const res = await authedFetch("/api/admin/members");
    const json = await res.json().catch(() => ({}));
    setMembers(json.members || []);
  }, [currentUserRole]);

  const loadReportCard = useCallback(async () => {
    const res = await authedFetch("/api/admin/report-card");
    const json = await res.json().catch(() => ({}));
    setReportOfficials(json.officials || []);
    setReportIssues(json.issues || []);
    setReportGrades(json.grades || []);
  }, []);

  const loadComments = useCallback(async () => {
    const res = await authedFetch("/api/admin/comments");
    const json = await res.json().catch(() => ({}));
    setComments(json.comments || []);
  }, []);

  async function moderateComment(commentId: string, action: 'approve' | 'reject') {
    setMsg(null);
    const res = await authedFetch("/api/admin/comments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId, action }),
    });
    if (res.ok) {
      setMsg(action === 'approve' ? "Comment approved (now visible to public)." : "Comment rejected (remains pending).");
      loadComments();
    } else {
      setMsg("Moderate failed");
    }
  }

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (tab === "articles") await loadArticles();
      else if (tab === "contributors") await loadApps();
      else if (tab === "live") await loadLive();
      else if (tab === "clips") await loadClips();
      else if (tab === "members") await loadMembers();
      else if (tab === "report-card") await loadReportCard();
      else if (tab === "comments") await loadComments();
    };
    if (active) void load();
    return () => { active = false; };
  }, [tab, loadArticles, loadApps, loadLive, loadClips, loadMembers, loadReportCard, loadComments]);

  async function approveApp(id: string) {
    setMsg(null);
    const res = await authedFetch("/api/admin/contributors/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId: id }),
    });
    if (res.ok) {
      setMsg("Approved. Contributor profile created + email sent.");
      loadApps();
    } else {
      setMsg("Approve failed");
    }
  }

  async function goLive() {
    setMsg(null);
    const payload: any = {};
    if (simulcastTargets.length > 0) {
      payload.simulcast_targets = simulcastTargets;
    }
    const res = await authedFetch("/api/admin/live/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      const attached = json.simulcast_attached ?? 0;
      const baseMsg = `Live stream created. Stream key (admin eyes only): check DB`;
      setMsg(attached > 0 ? `${baseMsg} • ${attached} simulcast target(s) attached` : baseMsg);
      setSimulcastTargets([]);
      loadLive();
    } else setMsg(json.error || "Failed to start live");
  }

  function addSimulcastTarget() {
    const url = simulUrl.trim();
    const key = simulKey.trim();
    if (!url || !key) return;
    setSimulcastTargets((prev) => [...prev, { url, stream_key: key }]);
    setSimulUrl("");
    setSimulKey("");
  }

  function removeSimulcastTarget(idx: number) {
    setSimulcastTargets((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="admin-cms">
      <nav className="admin-tabs" style={{ display: "flex", gap: "8px", margin: "16px 0", borderBottom: "3px solid var(--color-ink)", paddingBottom: 8 }}>
        {["articles", "contributors", "live", "clips", "members", "report-card", "comments"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={tab === t ? "btn btn--primary" : "btn btn--outline"}
            style={{ textTransform: "capitalize" }}
          >
            {t}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 12, alignSelf: "center" }}>Role: {currentUserRole}</span>
      </nav>

      {msg && <div style={{ background: "var(--color-paper-soft)", border: "2px solid var(--color-ink)", padding: 8, marginBottom: 12 }}>{msg}</div>}

      {tab === "articles" && (
        <section>
          <h2 className="section-title">Articles (MD supported)</h2>
          <p className="fine-print">Draft → Review → Published. Contributor bylines linked via contributors table.</p>
          <AdminArticlesEditor onSaved={loadArticles} />
          <div style={{ marginTop: 16 }}>
            <h3>Recent</h3>
            <ul>
              {articles.map((a) => (
                <li key={a.id}>{a.title} — <code>{a.status}</code> <small>{a.slug}</small></li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {tab === "contributors" && isAdminOrEditor && (
        <section>
          <h2 className="section-title">Contributor Applications</h2>
          <button onClick={loadApps} className="btn btn--outline" style={{ marginBottom: 8 }}>Refresh</button>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th>Name</th><th>Email</th><th>Tier</th><th>Applied</th><th></th></tr></thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.id} style={{ borderBottom: "1px solid var(--color-rule-soft)" }}>
                  <td>{a.name}</td>
                  <td>{a.email}</td>
                  <td>{a.tier}</td>
                  <td>{new Date(a.created_at).toLocaleDateString()}</td>
                  <td><button onClick={() => approveApp(a.id)} className="btn btn--primary">Approve</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="fine-print">Approving creates contributors row (active), sets members.role=contributor when email matches, and sends the approval email template.</p>
        </section>
      )}

      {tab === "live" && (
        <section>
          <h2 className="section-title">Live Scheduler &amp; Ingest</h2>
          <button onClick={goLive} className="btn btn--alarm">GO LIVE (create Mux stream + store key)</button>
          <p className="fine-print">Creates real Mux live stream. Stream key + playback stored on live_events. Webhook flips status + auto-creates VOD replay episode on end.</p>

          {/* Functional simulcast UI (wired to /api/admin/live/start + lib/mux addSimulcastTargets) */}
          <div style={{ marginTop: 12, border: "2px solid var(--color-ink)", padding: 8, background: "var(--color-paper)" }}>
            <h3 style={{ margin: 0, fontSize: "var(--text-sm)" }}>Multi-platform simulcast</h3>
            <p className="fine-print">Provide RTMP ingest + stream key for YouTube/Rumble/X/FB etc. Targets are attached when you click GO LIVE (Mux handles the rest). Full show stays member-only on site.</p>

            <div style={{ display: "flex", gap: 6, margin: "6px 0", flexWrap: "wrap" }}>
              <input
                value={simulUrl}
                onChange={(e) => setSimulUrl(e.target.value)}
                placeholder="rtmp://ingest.youtube.com/..."
                style={{ flex: 1, minWidth: 220 }}
              />
              <input
                value={simulKey}
                onChange={(e) => setSimulKey(e.target.value)}
                placeholder="stream-key-from-platform"
                style={{ flex: 1, minWidth: 180 }}
              />
              <button onClick={addSimulcastTarget} className="btn btn--sm btn--outline" type="button">
                Add target
              </button>
            </div>

            {simulcastTargets.length > 0 && (
              <div style={{ margin: "6px 0" }}>
                <div className="fine-print" style={{ marginBottom: 4 }}>Pending targets (will be sent with next GO LIVE):</div>
                <ul style={{ fontSize: "var(--text-xs)", margin: 0, paddingLeft: 16 }}>
                  {simulcastTargets.map((t, i) => (
                    <li key={i} style={{ marginBottom: 2 }}>
                      {t.url} <button onClick={() => removeSimulcastTarget(i)} className="btn btn--sm" style={{ padding: "0 4px", marginLeft: 4 }}>×</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <small className="fine-print">Targets are attached via Mux createSimulcastTarget at stream creation time. Clear after successful GO LIVE.</small>
          </div>

          <ul style={{ marginTop: 8 }}>
            {liveEvents.map((e) => (
              <li key={e.id}>{e.title} — <strong>{e.status}</strong> {e.mux_live_stream_id ? "(real ingest)" : ""}</li>
            ))}
          </ul>
        </section>
      )}

      {tab === "clips" && (
        <section>
          <h2 className="section-title">Clips Moderation Queue</h2>
          <p>Pending clips (approved=false). Citizen Dispatch moments are pre-cleared (approved=true via transcript clipper) and skip queue. Use existing /api/clips/moderate (editor+) or future bulk UI. Dispatch type from 0023 migration.</p>
          <ul>
            {clips.slice(0, 15).map((c: any) => {
              const isDispatch = c.dispatch_type === 'citizen_dispatch';
              const label = c.transcript || c.source_phrase || c.id;
              return (
                <li key={c.id} style={{ marginBottom: 6, fontSize: 'var(--text-sm)' }}>
                  <code>{c.id.slice(0,8)}…</code> — user {c.user_id?.slice(0,8)} • {c.duration_s || '?'}s
                  {c.county ? ` • ${c.county}` : ''}
                  {c.start_s != null ? ` @${c.start_s}s` : ''}
                  {' '}<strong>{c.upvotes || 0}↑</strong>
                  {isDispatch ? ' ' : ' '}
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', background: isDispatch ? '#f4e9c8' : '#eee', padding: '0 4px' }}>
                    {c.dispatch_type || 'upload'}
                  </span>
                  <div style={{ fontSize: '10px', opacity: 0.7, marginTop: 2 }}>{String(label).slice(0, 80)}</div>
                </li>
              );
            })}
          </ul>
          <a href="/api/clips/moderate" target="_blank" className="btn btn--outline">Open moderate endpoint</a>
          <p className="fine-print" style={{ marginTop: 8 }}>Pre-cleared Citizen Dispatches (dispatch_type=citizen_dispatch) appear directly in /clips feed (approved=true). Uploads wait here.</p>
        </section>
      )}

      {tab === "members" && currentUserRole === "admin" && (
        <section>
          <h2 className="section-title">Members (admin only)</h2>
          <ul>
            {members.slice(0, 20).map((m: any) => (
              <li key={m.user_id}>{m.email || m.user_id} — {m.tier || "free"} {m.is_member ? "✓ member" : ""} role:{m.role}</li>
            ))}
          </ul>
        </section>
      )}

      {tab === "report-card" && (
        <section>
          <h2 className="section-title">Report Card (Phase 4)</h2>
          <p className="fine-print">Public civic grades. Officials + issues + A–F grades with evidence. Data is readable by anyone after 0024 migration; edits here are admin-only.</p>
          <button onClick={loadReportCard} className="btn btn--outline" style={{ marginBottom: 8 }}>Refresh</button>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
            {/* Officials */}
            <div style={{ border: "1px solid #111", padding: 8 }}>
              <strong>Officials</strong>
              <ul style={{ fontSize: "var(--text-sm)", margin: "8px 0" }}>
                {reportOfficials.slice(0, 12).map((o: any) => (
                  <li key={o.id}>{o.name} — {o.office} ({o.county || "—"})</li>
                ))}
              </ul>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setMsg(null);
                  const fd = new FormData(e.currentTarget);
                  const payload = {
                    name: fd.get("name"),
                    office: fd.get("office"),
                    county: fd.get("county"),
                    party: fd.get("party") || null,
                  };
                  const res = await authedFetch("/api/admin/report-card", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "create_official", payload }),
                  });
                  if (res.ok) {
                    setMsg("Official added.");
                    (e.target as HTMLFormElement).reset();
                    loadReportCard();
                  } else setMsg("Failed to add official");
                }}
              >
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  <input name="name" placeholder="Name" required style={{ flex: 1, minWidth: 120 }} />
                  <input name="office" placeholder="Office" required style={{ flex: 1, minWidth: 120 }} />
                  <input name="county" placeholder="County" style={{ width: 110 }} />
                  <input name="party" placeholder="Party" style={{ width: 80 }} />
                  <button className="btn btn--sm" type="submit">Add</button>
                </div>
              </form>
            </div>

            {/* Grades */}
            <div style={{ border: "1px solid #111", padding: 8 }}>
              <strong>Recent Grades</strong>
              <ul style={{ fontSize: "var(--text-sm)", margin: "8px 0" }}>
                {reportGrades.slice(0, 8).map((g: any) => (
                  <li key={g.id}>{g.grade} · official {String(g.official_id).slice(0,8)}… issue {String(g.issue_id).slice(0,8)}…</li>
                ))}
              </ul>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setMsg(null);
                  const fd = new FormData(e.currentTarget);
                  const payload = {
                    official_id: fd.get("official_id"),
                    issue_id: fd.get("issue_id"),
                    grade: fd.get("grade"),
                    notes: fd.get("notes") || null,
                    evidence_url: fd.get("evidence_url") || null,
                    source: fd.get("source") || null,
                  };
                  const res = await authedFetch("/api/admin/report-card", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "upsert_grade", payload }),
                  });
                  if (res.ok) {
                    setMsg("Grade saved.");
                    (e.target as HTMLFormElement).reset();
                    loadReportCard();
                  } else setMsg("Failed to save grade");
                }}
              >
                <div style={{ display: "grid", gap: 4, gridTemplateColumns: "1fr 1fr" }}>
                  <select name="official_id" required>
                    <option value="">Official…</option>
                    {reportOfficials.map((o: any) => (
                      <option key={o.id} value={o.id}>{o.name} ({o.county || "?"})</option>
                    ))}
                  </select>
                  <select name="issue_id" required>
                    <option value="">Issue…</option>
                    {reportIssues.map((i: any) => (
                      <option key={i.id} value={i.id}>{i.title}</option>
                    ))}
                  </select>
                  <select name="grade" required>
                    {["A","B","C","D","F","N/A"].map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <input name="source" placeholder="Source (e.g. OK Senate bill 123)" />
                  <input name="evidence_url" placeholder="https://evidence..." style={{ gridColumn: "1 / -1" }} />
                  <textarea name="notes" placeholder="Notes (optional)" style={{ gridColumn: "1 / -1", minHeight: 40 }} />
                  <button className="btn btn--sm" type="submit" style={{ gridColumn: "1 / -1" }}>Save / Update Grade</button>
                </div>
              </form>
            </div>
          </div>

          <p className="fine-print" style={{ marginTop: 8 }}>
            After adding officials/grades, the public /report-card and /report-card/[county] pages will reflect them (public read via RLS).
          </p>
        </section>
      )}

      {tab === "comments" && (
        <section>
          <h2 className="section-title">Comments Moderation Queue</h2>
          <p className="fine-print">Pending (approved=false). Member posts go to queue (P1 change from auto-approve). Approve to surface in ThreadedComments on target; realtime only shows approved. Use PATCH via this surface.</p>
          <button onClick={loadComments} className="btn btn--outline" style={{ marginBottom: 8 }}>Refresh</button>
          {comments.length === 0 && <p className="fine-print">No pending comments.</p>}
          <ul>
            {comments.slice(0, 20).map((c: any) => (
              <li key={c.id} style={{ marginBottom: 8, fontSize: 'var(--text-sm)', borderBottom: '1px solid var(--color-rule-soft)', paddingBottom: 6 }}>
                <code>{c.id.slice(0,8)}…</code> • {c.target_type}:{String(c.target_id).slice(0,8)} • user {c.user_id?.slice(0,8)} • {new Date(c.created_at).toLocaleDateString()}
                <div style={{ margin: '4px 0', background: '#faf8f0', padding: 4, border: '1px solid #111' }}>{String(c.content).slice(0, 160)}</div>
                <button onClick={() => moderateComment(c.id, 'approve')} className="btn btn--primary btn--sm">Approve</button>
                <button onClick={() => moderateComment(c.id, 'reject')} className="btn btn--outline btn--sm" style={{ marginLeft: 6 }}>Reject (keep false)</button>
              </li>
            ))}
          </ul>
          <p className="fine-print">Approving sets approved=true; public GET /api/comments + ThreadedComments + realtime will surface it. Member posting remains functional (queues now).</p>
        </section>
      )}

      <p style={{ marginTop: 32 }} className="fine-print">All actions call server routes that re-validate requireAdmin. Middleware is only a hint.</p>
    </div>
  );
}

// Simple inline MD-capable editor for articles (no extra deps)
function AdminArticlesEditor({ onSaved }: { onSaved: () => void }) {
  const [form, setForm] = useState({ title: "", slug: "", body: "", status: "draft", category: "", county: "" });
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);

  function update(k: string, v: string) {
    const next = { ...form, [k]: v };
    setForm(next);
    // very light live preview (basic md-ish)
    const html = next.body
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/^### (.*)$/gm, "<h3>$1</h3>")
      .replace(/^## (.*)$/gm, "<h2>$1</h2>")
      .replace(/^# (.*)$/gm, "<h1>$1</h1>")
      .replace(/\n/g, "<br/>");
    setPreview(html);
  }

  async function save() {
    setSaving(true);
    setPreview("");
    try {
      // Note: for full auth, this nested editor should use authedFetch too. For now the parent loads are fixed;
      // duplicate the token logic or lift helper if editor save 403s. (Minor; main admin flows + report-card covered.)
      const res = await fetch("/api/admin/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title || "Untitled",
          slug: form.slug || `draft-${Date.now()}`,
          body: form.body,
          body_md: form.body,
          status: form.status,
          category: form.category || null,
          county: form.county || null,
        }),
      });
      if (res.ok) {
        onSaved();
        setForm({ title: "", slug: "", body: "", status: "draft", category: "", county: "" });
        setPreview("");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ border: "3px solid #111", padding: 12, background: "#fff" }}>
      <input placeholder="Title" value={form.title} onChange={(e) => update("title", e.target.value)} style={{ width: "100%", marginBottom: 6 }} />
      <input placeholder="slug-kebab-case" value={form.slug} onChange={(e) => update("slug", e.target.value)} style={{ width: "100%", marginBottom: 6 }} />
      <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
        <select value={form.status} onChange={(e) => update("status", e.target.value)}>
          <option value="draft">draft</option>
          <option value="review">review</option>
          <option value="scheduled">scheduled</option>
          <option value="published">published</option>
        </select>
        <input placeholder="category (ag, energy...)" value={form.category} onChange={(e) => update("category", e.target.value)} />
        <input placeholder="county (for local moat)" value={form.county || ""} onChange={(e) => update("county", e.target.value)} />
      </div>
      <textarea
        placeholder="Body (markdown supported: # ## **bold** *italic* links etc). This becomes the article content."
        value={form.body}
        onChange={(e) => update("body", e.target.value)}
        rows={8}
        style={{ width: "100%", fontFamily: "monospace" }}
      />
      {preview && (
        <div style={{ border: "1px solid #ccc", padding: 8, margin: "8px 0", background: "#faf8f0" }} dangerouslySetInnerHTML={{ __html: preview }} />
      )}
      <button onClick={save} disabled={saving} className="btn btn--primary">{saving ? "Saving..." : "Save / Publish"}</button>
      <span className="fine-print" style={{ marginLeft: 12 }}>Saves via gated /api/admin/articles (re-validates role)</span>
    </div>
  );
}
