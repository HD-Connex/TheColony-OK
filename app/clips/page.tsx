'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, supabaseBrowser } from '@/lib/auth-client';
import { createClient } from '@/utils/supabase/client'; // new SSR client pattern (per plan: use where server/client code)
import InnerPageShell from '../_components/InnerPageShell';
import ClipEmbed from '../_components/ClipEmbed';
import ClipsTeaser from '../_components/ClipsTeaser';

interface Clip {
  id: string;
  dispatch_type?: string | null;
  upvotes: number;
  created_at: string;
  transcript?: string | null;
  source_phrase?: string | null;
  storage_path?: string | null;
  duration_s?: number | null;
  start_s?: number | null;
  ep_id?: string | null;
  county?: string | null;
  episodes?: { title?: string | null; slug?: string | null } | null;
}

/**
 * Phase 3: /clips — Rumble-style member feed for Citizen Dispatch UGC.
 * Lists approved clips (pre-cleared transcript moments + moderated member uploads).
 * Upvote button (reuses /api/clips/upvote, public ok).
 * Filter: all / citizen_dispatch (foil badge) / upload.
 * Reuses: InnerPageShell, ClipEmbed (for uploads w/ storage), ClipsTeaser, supabase client, existing auth/entitlements patterns.
 * Elite: .grain container, .foil for Citizen Dispatch badges (step8 refines double rules etc).
 * Public view + upvote; create/upload member-only (enforced in moment/upload routes via entitlements).
 */
export default function ClipsFeedPage() {
  const { user, isMember, loading: authLoading } = useAuth();
  const [clips, setClips] = useState<Clip[]>([]);
  const [filter, setFilter] = useState<'all' | 'citizen_dispatch' | 'upload'>('all');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // New SSR client (browser instance here for consistency with my-feed/backroom; anon key for public RLS-approved reads)
  const ssrClient = createClient();

  async function loadClips() {
    setLoading(true);
    setLoadError(null);
    try {
      // Use browser client — RLS "clips_public_approved_read" allows anon/public select on approved=true
      // (no session needed for viewing the feed; matches upvote public design)
      const sb = supabaseBrowser();
      let query = sb
        .from('clips')
        .select(`
          id,
          dispatch_type,
          upvotes,
          created_at,
          transcript,
          source_phrase,
          storage_path,
          duration_s,
          start_s,
          ep_id,
          county,
          episodes:ep_id ( title, slug )
        `)
        .eq('approved', true)
        .order('upvotes', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(60);

      if (filter !== 'all') {
        query = query.eq('dispatch_type', filter);
      }

      const { data, error: qErr } = await query;
      if (qErr) throw qErr;

      setClips((data as Clip[]) ?? []);
    } catch (e: any) {
      console.warn('[clips] load error', e);
      setLoadError('Could not load Citizen Dispatches feed.');
      setClips([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadClips();
  }, [filter]);

  // Upvote reuses existing /api/clips/upvote (public, rate-limited, denorm increment)
  async function handleUpvote(clipId: string, currentUpvotes: number) {
    try {
      const res = await fetch('/api/clips/upvote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clip_id: clipId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Upvote failed');
      }
      const json = await res.json();
      const newCount = typeof json.upvotes === 'number' ? json.upvotes : currentUpvotes + 1;
      setClips((prev) =>
        prev.map((c) => (c.id === clipId ? { ...c, upvotes: newCount } : c))
      );
    } catch (e) {
      console.warn('[clips] upvote error', e);
      alert('Upvote failed — try again later (rate limits apply).');
    }
  }

  const isCitizen = (c: Clip) => c.dispatch_type === 'citizen_dispatch';

  return (
    <InnerPageShell
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Citizen Dispatches' }]}
      eyebrow="▼ RUMBLE-STYLE MEMBER FEED"
      title="Citizen Dispatches"
      lede="Pre-cleared clip moments (via TranscriptClipper) + member UGC. Upvote to surface the best. Public feed, member-powered."
    >
      <div className="container">
        {/* Filters + actions (Rumble vertical feed vibe) */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'btn btn--primary btn--sm' : 'btn btn--outline btn--sm'}
          >
            All Approved
          </button>
          <button
            onClick={() => setFilter('citizen_dispatch')}
            className={filter === 'citizen_dispatch' ? 'btn btn--primary btn--sm' : 'btn btn--outline btn--sm'}
          >
            <span className="foil">CITIZEN DISPATCH</span> (pre-cleared)
          </button>
          <button
            onClick={() => setFilter('upload')}
            className={filter === 'upload' ? 'btn btn--primary btn--sm' : 'btn btn--outline btn--sm'}
          >
            Member Uploads
          </button>

          <button onClick={loadClips} className="btn btn--outline btn--sm" style={{ marginLeft: 'auto' }} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>

          {user && isMember && (
            <Link href="/membership" className="btn btn--outline btn--sm">
              Member tools
            </Link>
          )}
        </div>

        {loadError && (
          <p className="fine-print" style={{ color: 'var(--color-alarm)', marginBottom: 'var(--space-4)' }}>
            {loadError}
          </p>
        )}

        {/* Feed container: grain + elite heirloom treatment (foil badges, double-rule accents via borders) */}
        <div
          className="grain"
          style={{
            background: 'var(--color-paper)',
            border: 'var(--rule-medium) solid var(--color-border)',
            padding: 'var(--space-4)',
            marginBottom: 'var(--space-8)',
          }}
        >
          {/* Double rule accent for heirloom press separation (elite Phase 3) */}
          <hr className="rule-double rule-double--ink" style={{ margin: '0 0 var(--space-4)' }} />
          {loading && clips.length === 0 && <p>Loading dispatches…</p>}

          {!loading && clips.length === 0 && (
            <p className="fine-print">
              No approved clips yet. Members create pre-cleared Citizen Dispatches from transcript search or upload clips in episode players.
            </p>
          )}

          {clips.map((clip) => {
            const dispatch = isCitizen(clip);
            const title = clip.transcript || clip.source_phrase || 'Untitled Dispatch';
            const epInfo = clip.episodes as any;
            const timeLabel = clip.start_s != null
              ? `${Math.floor(clip.start_s / 60)}:${(clip.start_s % 60).toString().padStart(2, '0')}`
              : null;
            const viewHref = clip.ep_id
              ? `/podcasts/${clip.ep_id}${clip.start_s != null ? `?t=${clip.start_s}` : ''}${clip.id ? `&clip=${clip.id}` : ''}`
              : null;

            return (
              <div
                key={clip.id}
                className={`card ${dispatch ? 'grain' : ''}`}
                style={{
                  marginBottom: 'var(--space-6)',
                  padding: 'var(--space-4)',
                  border: dispatch ? '1px solid var(--color-brass)' : undefined,
                  position: 'relative',
                }}
              >
                {/* Header row: type badge (foil for citizen) + date + county */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                  {dispatch ? (
                    <span
                      className="foil"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-xs)',
                        letterSpacing: 'var(--track-wider)',
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        border: 'var(--rule-hairline) solid currentColor',
                      }}
                    >
                      CITIZEN DISPATCH
                    </span>
                  ) : (
                    <span className="mono-eyebrow">MEMBER CLIP • UGC</span>
                  )}
                  <div style={{ textAlign: 'right', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    {new Date(clip.created_at).toLocaleDateString()}
                    {clip.county && <div>{clip.county} County</div>}
                  </div>
                </div>

                <h3 style={{ margin: '0 0 var(--space-2)', fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)' }}>
                  {title}
                </h3>

                {/* Content: reuse ClipEmbed for video uploads; custom moment card for pre-cleared transcript dispatches */}
                {clip.storage_path ? (
                  <ClipEmbed
                    clip={{
                      id: clip.id,
                      url: clip.storage_path,
                      transcript: clip.transcript || clip.source_phrase || undefined,
                      duration_s: clip.duration_s || undefined,
                    }}
                  />
                ) : viewHref ? (
                  <div
                    style={{
                      padding: 'var(--space-4)',
                      background: 'var(--color-ink-soft)',
                      color: 'var(--color-paper)',
                      border: 'var(--rule-hairline) solid var(--color-border)',
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 'var(--text-sm)' }}>
                      Platform-native transcript moment{epInfo?.title ? ` from “${epInfo.title}”` : ''}.
                    </p>
                    <div style={{ marginTop: 'var(--space-2)', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <a href={viewHref} className="btn btn--sm btn--outline">
                        Jump to moment →
                      </a>
                      {timeLabel && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', opacity: 0.8 }}>
                          at {timeLabel}
                        </span>
                      )}
                      <span className="fine-print" style={{ marginLeft: 'auto' }}>Pre-cleared • auto-approved</span>
                    </div>
                  </div>
                ) : (
                  <p className="fine-print">Preview unavailable for this dispatch.</p>
                )}

                {/* Upvote rail + meta (Rumble-style community signal) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    marginTop: 'var(--space-4)',
                    paddingTop: 'var(--space-3)',
                    borderTop: 'var(--rule-hairline) solid var(--color-border)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleUpvote(clip.id, clip.upvotes)}
                    className="btn btn--sm btn--primary"
                    disabled={authLoading}
                    title="Upvote this dispatch (public or member)"
                  >
                    ▲ UPVOTE
                  </button>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', minWidth: 80 }}>
                    {clip.upvotes} UPVOTES
                  </span>

                  {dispatch && (
                    <span className="foil fine-print" style={{ marginLeft: 'auto' }}>
                      ★ ELITE PRE-CLEARED
                    </span>
                  )}
                  {!dispatch && <span className="fine-print" style={{ marginLeft: 'auto' }}>Moderated member content</span>}
                </div>
              </div>
            );
          })}
          {/* Trailing double rule for heirloom press separation (elite) */}
          <hr className="rule-double" style={{ margin: 'var(--space-4) 0 0' }} />
        </div>

        {/* Bottom: reuse teaser + explainer. Links added in nav/footer per later steps. */}
        <div style={{ marginTop: 'var(--space-4)' }}>
          <ClipsTeaser count={clips.length} showLink={false} />
          <p className="fine-print" style={{ marginTop: 'var(--space-4)' }}>
            Uploads and transcript moments require active membership (enforced server-side via entitlements). 
            All approved items visible publicly and upvotable. Top-upvoted recent dispatches included in weekly member digests.
            Elite styling (foil, grain) for Citizen Dispatches.
          </p>
          {!user && (
            <p>
              <Link href="/membership" className="btn btn--outline btn--sm">
                Sign in to create dispatches
              </Link>
            </p>
          )}
        </div>
      </div>
    </InnerPageShell>
  );
}
