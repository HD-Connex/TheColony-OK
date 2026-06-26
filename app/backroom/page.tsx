'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth, supabaseBrowser } from '@/lib/auth-client';
import { createClient } from '@/utils/supabase/client'; // P5: now shared singleton (via cached createBrowserClient); mixed with supabaseBrowser() is safe, one GoTrueClient total
import { supabaseConfigured } from '@/lib/supabase';
import { Paywall } from '../_components/Paywall';
import InnerPageShell from '../_components/InnerPageShell';

// Types for backroom (match migration 0022)
interface BackroomThread {
  id: string;
  title: string;
  created_by: string | null;
  created_at: string;
}

interface BackroomPost {
  id: string;
  thread_id: string;
  user_id: string | null;
  content: string;
  created_at: string;
}

/**
 * The Backroom — Phase 2 "Off the Record" private members community.
 * Gated via useAuth (isMember) + new SSR client for token/session where used.
 * Reuses ThreadedComments realtime postgres_changes + load/post pattern.
 * Elite private club plate: ink bg, foil mono header, grain, double brass rule (via premium + added styles).
 * Flat posts per thread (schema per migration); "threaded" feel via dedicated thread view + realtime appends.
 * Direct client queries (RLS enforces member-only select/insert); light client sanitize.
 */
export default function BackroomPage() {
  const { user, isMember, loading: authLoading } = useAuth();
  const [threads, setThreads] = useState<BackroomThread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [posts, setPosts] = useState<BackroomPost[]>([]);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [creatingThread, setCreatingThread] = useState(false);
  const [posting, setPosting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const ssrClient = createClient(); // "new Supabase SSR" client usage (for session/token patterns)

  const currentThread = threads.find((t) => t.id === currentThreadId) || null;

  // Load threads (member gated by RLS)
  const loadThreads = useCallback(async () => {
    if (!supabaseConfigured()) {
      setLoadError('Backroom backend not connected in this environment.');
      return;
    }
    setLoadError(null);
    try {
      // Prefer SSR client for session freshness (aligns with my-counties / plan "use new Supabase SSR")
      let token: string | undefined;
      try {
        const { data } = await ssrClient.auth.getSession();
        token = data.session?.access_token;
      } catch {}
      // Direct query works because RLS + auth session in browser client
      const sb = supabaseBrowser();
      const { data, error } = await sb
        .from('backroom_threads')
        .select('id, title, created_by, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setThreads((data as BackroomThread[]) ?? []);
      if (!currentThreadId && data && data.length > 0) {
        setCurrentThreadId(data[0].id);
      }
    } catch (e: any) {
      console.warn('[backroom] load threads error', e);
      setLoadError('Could not load The Backroom (members only).');
    }
  }, [currentThreadId, ssrClient]);

  // Load posts for current thread
  const loadPosts = useCallback(async (threadId: string) => {
    if (!threadId || !supabaseConfigured()) return;
    try {
      const sb = supabaseBrowser();
      const { data, error } = await sb
        .from('backroom_posts')
        .select('id, thread_id, user_id, content, created_at')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setPosts((data as BackroomPost[]) ?? []);
    } catch (e) {
      console.warn('[backroom] load posts error', e);
    }
  }, []);

  // Realtime: threads + current posts (reuse ThreadedComments / LiveChat postgres_changes pattern)
  useEffect(() => {
    if (!isMember || !supabaseConfigured()) return;

    const sb = supabaseBrowser();
    const threadsChannel = sb
      .channel('backroom-threads')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'backroom_threads' },
        (payload) => {
          const t = payload.new as BackroomThread;
          setThreads((prev) => {
            if (prev.some((x) => x.id === t.id)) return prev;
            return [t, ...prev];
          });
        }
      )
      .subscribe();

    let postsChannel: ReturnType<typeof sb.channel> | null = null;
    if (currentThreadId) {
      postsChannel = sb
        .channel(`backroom-posts:${currentThreadId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'backroom_posts', filter: `thread_id=eq.${currentThreadId}` },
          (payload) => {
            const p = payload.new as BackroomPost;
            setPosts((prev) => [...prev, p]);
          }
        )
        .subscribe();
    }

    return () => {
      sb.removeChannel(threadsChannel);
      if (postsChannel) sb.removeChannel(postsChannel);
    };
  }, [isMember, currentThreadId]);

  // Initial load + when current thread changes
  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isMember && active) void loadThreads();
    return () => { active = false; };
  }, [isMember, loadThreads]);

  useEffect(() => {
    let active = true;
    if (currentThreadId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (active) void loadPosts(currentThreadId);
    } else {
      setPosts([]);
    }
    return () => { active = false; };
  }, [currentThreadId, loadPosts]);

  // Create new thread (title only; posts follow)
  async function createThread(e?: React.FormEvent) {
    e?.preventDefault();
    if (!newThreadTitle.trim() || !user || !isMember) return;
    setCreatingThread(true);
    try {
      const sb = supabaseBrowser();
      const { data, error } = await sb
        .from('backroom_threads')
        .insert({
          title: newThreadTitle.trim().slice(0, 200),
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      const newT = data as BackroomThread;
      setThreads((prev) => [newT, ...prev]);
      setCurrentThreadId(newT.id);
      setNewThreadTitle('');
      // realtime will also propagate; reload safe
      setTimeout(() => void loadThreads(), 300);
    } catch (e) {
      console.warn('[backroom] create thread failed', e);
      alert('Failed to create thread (member only — check connection).');
    } finally {
      setCreatingThread(false);
    }
  }

  // Post to current thread (copy ThreadedComments send + sanitize light)
  async function postToThread(e?: React.FormEvent) {
    e?.preventDefault();
    if (!newPostContent.trim() || !user || !currentThreadId || !isMember) return;
    setPosting(true);
    try {
      const safeContent = newPostContent.trim().slice(0, 4000); // basic limit; full sanitize in api future
      const sb = supabaseBrowser();
      const { error } = await sb.from('backroom_posts').insert({
        thread_id: currentThreadId,
        user_id: user.id,
        content: safeContent,
      });
      if (error) throw error;
      setNewPostContent('');
      // realtime appends; fallback reload
      setTimeout(() => { if (currentThreadId) void loadPosts(currentThreadId); }, 400);
    } catch (e) {
      console.warn('[backroom] post failed', e);
      alert('Failed to post (members only).');
    } finally {
      setPosting(false);
    }
  }

  // Gate: non-member sees brass Paywall (reuse + styled)
  if (authLoading) {
    return (
      <InnerPageShell
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'The Backroom' }]}
        eyebrow="▼ MEMBERS ONLY"
        title="The Backroom"
        lede="Loading private club..."
      >
        <div className="container" style={{ paddingBlock: 'var(--space-16)' }}>Loading…</div>
      </InnerPageShell>
    );
  }

  if (!user || !isMember) {
    return (
      <InnerPageShell
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'The Backroom' }]}
        eyebrow="▼ MEMBERS ONLY"
        title="The Backroom"
        lede="Private club for active Colony members."
      >
        <div className="container" style={{ paddingBlock: 'var(--space-8)' }}>
          <Paywall
            title="THE BACKROOM"
            message="The Backroom is for members only. Join to access the private community, Off the Record threads, and elite discussion."
            brass
            perk="BACKROOM"
            returnUrl="/backroom"
          />
          <p className="fine-print" style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
            Already a member? <Link href="/membership">Sign in</Link>.
          </p>
        </div>
      </InnerPageShell>
    );
  }

  // Member view: elite plate + community
  return (
    <InnerPageShell
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'The Backroom' }]}
      eyebrow="▼ THE BACKROOM · MEMBERS ONLY"
      title="The Backroom"
      lede="Private off-the-record discussion for active members. Ink. Foil. No outsiders."
    >
      <div className="container">
        {/* Elite private club plate header — ink, foil mono, grain, double brass (styles in premium/nav updates) */}
        <header className="backroom-plate grain" style={{
          background: 'var(--color-ink)',
          color: 'var(--color-paper)',
          padding: 'var(--space-8) var(--space-6)',
          border: 'var(--rule-medium) solid var(--color-alarm)',
          marginBottom: 'var(--space-8)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ borderTop: 'var(--rule-double) solid var(--color-brass)', borderBottom: 'var(--rule-double) solid var(--color-brass)', paddingBlock: 'var(--space-4)' }}>
            <h1 className="foil" style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(var(--text-xl), 4vw, var(--text-3xl))',
              letterSpacing: 'var(--track-wider)',
              textTransform: 'uppercase',
              margin: 0,
              textAlign: 'center'
            }}>
              THE BACKROOM · MEMBERS ONLY
            </h1>
            <p style={{ textAlign: 'center', fontSize: 'var(--text-xs)', opacity: 0.8, marginTop: 'var(--space-2)' }}>
              OFF THE RECORD • READER-FUNDED • NO ALGORITHMS
            </p>
          </div>
        </header>

        {loadError && <p className="fine-print" style={{ color: 'var(--color-alarm)' }}>{loadError}</p>}

        <div className="backroom-layout">
          {/* Threads list (sidebar) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', letterSpacing: 'var(--track-wide)', textTransform: 'uppercase', margin: 0 }}>Threads</h3>
              <span className="badge badge--members" style={{ fontSize: '10px' }}>{threads.length}</span>
            </div>

            {/* Create thread form */}
            <form onSubmit={createThread} style={{ marginBottom: 'var(--space-4)', display: 'flex', gap: 'var(--space-2)' }}>
              <input
                value={newThreadTitle}
                onChange={(e) => setNewThreadTitle(e.target.value)}
                placeholder="New thread title…"
                style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}
                maxLength={200}
                aria-label="New thread title"
              />
              <button type="submit" disabled={creatingThread || !newThreadTitle.trim()} className="btn btn--primary btn--sm">
                {creatingThread ? '…' : 'Start'}
              </button>
            </form>

            <div style={{ maxHeight: 'min(420px, 50vh)', overflow: 'auto', border: 'var(--rule-medium) solid var(--color-border)', background: 'var(--color-paper)' }}>
              {threads.length === 0 && (
                <p className="fine-print" style={{ padding: 'var(--space-4)', color: 'var(--color-ink)' }}>No threads yet. Be the first to start one.</p>
              )}
              {threads.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setCurrentThreadId(t.id)}
                  className="backroom-thread-item"
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: 'var(--space-3) var(--space-4)',
                    borderBottom: 'var(--rule-hairline) solid var(--color-border-paper)',
                    background: currentThreadId === t.id ? 'var(--color-ink)' : 'transparent',
                    color: currentThreadId === t.id ? 'var(--color-paper)' : 'var(--color-ink)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    cursor: 'pointer'
                  }}
                >
                  {t.title}
                  <div style={{ fontSize: '10px', opacity: 0.6, marginTop: 2 }}>
                    {new Date(t.created_at).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
            <p className="fine-print" style={{ marginTop: 'var(--space-3)' }}>
              Realtime • append-only • members only
            </p>
          </div>

          {/* Current thread + posts (main) */}
          <div>
            {currentThread ? (
              <>
                <div style={{ borderBottom: 'var(--rule-medium) solid var(--color-brass)', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', margin: 0, fontSize: 'var(--text-2xl)' }}>{currentThread.title}</h2>
                  <span className="text-mono text-xs" style={{ opacity: 0.7 }}>
                    started {new Date(currentThread.created_at).toLocaleString()}
                  </span>
                </div>

                {/* Posts list — reuse ThreadedComments visual/thread pattern (flat per thread) */}
                <div style={{ maxHeight: 'min(420px, 50vh)', overflow: 'auto', border: 'var(--rule-medium) solid var(--color-ink)', padding: 'var(--space-4)', background: 'var(--color-paper)', marginBottom: 'var(--space-4)' }}>
                  {posts.length === 0 && (
                    <p className="fine-print">No posts yet in this thread. Say something off the record.</p>
                  )}
                  {posts.map((p, idx) => (
                    <div key={p.id} style={{ marginBottom: 12, borderLeft: idx > 0 ? '2px solid var(--color-brass-soft)' : 'none', paddingLeft: idx > 0 ? 12 : 0 }}>
                      <div style={{ fontSize: 12, background: 'var(--color-bg-primary)', padding: 'var(--space-2)', border: 'var(--rule-hairline) solid var(--color-border)' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.7, fontSize: 10 }}>
                          {new Date(p.created_at).toLocaleTimeString()}
                        </span>{' '}
                        {p.content}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Post form */}
                <form onSubmit={postToThread} style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <input
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Post off the record…"
                    style={{ flex: 1 }}
                    aria-label="Post content"
                  />
                  <button type="submit" disabled={posting || !newPostContent.trim()} className="btn btn--primary">
                    {posting ? 'Sending…' : 'Post'}
                  </button>
                </form>
                <p className="fine-print" style={{ marginTop: 'var(--space-2)' }}>Posts are visible to all active members. Keep it true.</p>
              </>
            ) : (
              <div style={{ padding: 'var(--space-12) 0', textAlign: 'center', border: 'var(--rule-hairline) dashed var(--color-border)' }}>
                <p>Select or create a thread on the left to begin the off-the-record conversation.</p>
              </div>
            )}
          </div>
        </div>

        <div className="colophon grain" style={{ marginTop: 'var(--space-12)', textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', borderTop: 'var(--rule-hairline) solid var(--color-border)', paddingTop: 'var(--space-6)' }}>
          Printed for members • The Backroom is off the record • No screenshots. No leaks. No apologies.
        </div>
      </div>
    </InnerPageShell>
  );
}
