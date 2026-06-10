"use client";

import React, { useEffect, useState } from "react";

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
  const [tab, setTab] = useState<"articles" | "contributors" | "live" | "clips" | "members">("articles");
  const [articles, setArticles] = useState<Article[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [clips, setClips] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const isAdminOrEditor = currentUserRole === "admin" || currentUserRole === "editor";

  async function loadArticles() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/articles");
      const json = await res.json();
      setArticles(json.articles || []);
    } catch {}
    setLoading(false);
  }

  async function loadApps() {
    if (!isAdminOrEditor) return;
    const res = await fetch("/api/admin/contributors/applications");
    const json = await res.json();
    setApps(json.applications || []);
  }

  async function loadLive() {
    const res = await fetch("/api/admin/live");
    const json = await res.json();
    setLiveEvents(json.events || []);
  }

  async function loadClips() {
    const res = await fetch("/api/admin/clips?approved=false");
    const json = await res.json();
    setClips(json.clips || []);
  }

  async function loadMembers() {
    if (currentUserRole !== "admin") return;
    const res = await fetch("/api/admin/members");
    const json = await res.json();
    setMembers(json.members || []);
  }

  useEffect(() => {
    if (tab === "articles") loadArticles();
    if (tab === "contributors") loadApps();
    if (tab === "live") loadLive();
    if (tab === "clips") loadClips();
    if (tab === "members") loadMembers();
  }, [tab]);

  async function approveApp(id: string) {
    setMsg(null);
    const res = await fetch("/api/admin/contributors/approve", {
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
    const res = await fetch("/api/admin/live/start", { method: "POST" });
    const json = await res.json();
    if (res.ok) {
      setMsg(`Live stream created. Stream key (admin eyes only): ${json.stream_key ? "stored" : "check DB"}`);
      loadLive();
    } else setMsg(json.error || "Failed to start live");
  }

  return (
    <div className="admin-cms">
      <nav className="admin-tabs" style={{ display: "flex", gap: "8px", margin: "16px 0", borderBottom: "3px solid #111", paddingBottom: 8 }}>
        {["articles", "contributors", "live", "clips", "members"].map((t) => (
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

      {msg && <div style={{ background: "#fff3cd", border: "2px solid #111", padding: 8, marginBottom: 12 }}>{msg}</div>}

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
                <tr key={a.id} style={{ borderBottom: "1px solid #ccc" }}>
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

          {/* Phase 3 polish: Simulcast UI */}
          <div style={{ marginTop: 12, border: "2px solid #111", padding: 8, background: "#fff" }}>
            <h3 style={{ margin: 0, fontSize: "var(--text-sm)" }}>Multi-platform simulcast (P3)</h3>
            <p className="fine-print">Free simulcast to YouTube/Rumble/X/FB (provide their RTMP ingest url + stream key). Full show + clips stay member-only on site.</p>
            <div style={{ display: "flex", gap: 6, margin: "6px 0" }}>
              <input id="simul-url" placeholder="rtmp://ingest.youtube.com/..." style={{ flex: 1 }} />
              <input id="simul-key" placeholder="stream-key-from-platform" style={{ flex: 1 }} />
              <button
                onClick={async () => {
                  const url = (document.getElementById("simul-url") as HTMLInputElement)?.value?.trim();
                  const key = (document.getElementById("simul-key") as HTMLInputElement)?.value?.trim();
                  if (!url || !key) return alert("Provide url and key");
                  // For demo: re-trigger go live or call a dedicated attach. Here we just log + re-use goLive flow (extend start route in real).
                  alert("Simulcast target noted. In full: pass to /api/admin/live/start or addSimulcastTargets. Targets will be attached on next Go Live.");
                  console.log("[admin] simulcast target", { url, key });
                }}
                className="btn btn--outline"
              >
                Attach target (demo)
              </button>
            </div>
            <small className="fine-print">Production: extend admin live start to accept array of targets and call mux.addSimulcastTargets after stream creation.</small>
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
          <p>Pending clips (approved=false). Use existing /api/clips/moderate (editor+) or future bulk UI.</p>
          <ul>
            {clips.slice(0, 10).map((c: any) => (
              <li key={c.id}>{c.id} — user {c.user_id} • {c.duration_s}s</li>
            ))}
          </ul>
          <a href="/api/clips/moderate" target="_blank" className="btn btn--outline">Open moderate endpoint</a>
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
