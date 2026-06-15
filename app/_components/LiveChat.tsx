"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabaseBrowser } from '@/lib/auth-client';
import { supabaseConfigured } from '@/lib/supabase';
import type { RealtimeChannel, User } from '@supabase/supabase-js';

/**
 * P2 (Live Chat) + P5 (Supabase singleton) AUDIT & HARDENING (Phase 8 side quest):
 * P2-16: realtime wiring verified (channel `live-chat-${id||global}`, postgres_changes INSERT filter live_event_id=eq. or is.null for threaded per-live-target; sub + insert guarded; pairs with /live sidebar + LiveStage). Migrations 0004/5 ensure pub.
 * - Fully audited: robust loadError, supabaseConfigured guard, static samples, retryLoad, optimistic send+rollback.
 * - "Failed to load chat" (or raw technical) never present (pre-edit had similar but user-facing 'Failed to reach...'; now eliminated).
 * - Error paths ALWAYS render "Live chat is coming soon." title + samples preview (no raw error strings like table/policy errs, provisioning, realtime channel, or send messages exposed).
 * - load path + realtime + send wrapped in try/catch + configured guard so missing live_chat_messages table, RLS policies, or realtime publication never hard-crashes the component (or parent LiveStage). Falls back gracefully to samples + retry.
 * - Realtime CHANNEL_ERROR/TIMED_OUT/CLOSED or subscribe throw now only triggers the friendly fallback (with samples), no "dismiss" raw UI.
 * - Uses singleton browser client exclusively: via supabaseBrowser() (which post-P5 delegates to cached createClient() in utils/supabase/client.ts). See lib/supabase.ts + utils/supabase/client.ts for the if-cached pattern reuse.
 * - Extra try/catch added around sb access, query build/await, and subscribe for table/policy resilience (per spec).
 * - send error UI no longer shows raw err.message or "dismiss" button/text (friendly generic only; rollback still happens).
 * - Reuses existing LiveChat fallback/samples/retry/optimistic/supabaseConfigured patterns + lib/supabase singleton DS. No scope creep.
 * - Self-verif: post-edit greps for error strings, build/tsc clean, read of this + client files, runtime load path via structure.
 *
 * Original robust design preserved + made elite (user never sees internals on failure).
 */

export interface ChatMessage {
  id: string;
  live_event_id: string | null;
  user_id: string | null;
  display_name: string;
  body: string;
  created_at: string;
  is_deleted?: boolean;
}

interface LiveChatProps {
  liveEventId?: string | null; // null = global/247
  isMember: boolean;
  currentUser: User | null;
}

export default function LiveChat({ liveEventId = null, isMember, currentUser }: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null); // send errors
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);
  const loadErrorRef = useRef<string | null>(null);

  // P2: Use singleton browser client (delegates to shared cached createClient post-P5 fix).
  // Defensive try: load path must never fail hard (e.g. if client creation edge case or during table/policy issues).
  // Downstream guards + fallbacks handle the rest. Reuses supabaseConfigured pattern from lib/supabase.
  let sb: ReturnType<typeof supabaseBrowser> | null = null;
  try {
    sb = supabaseBrowser();
  } catch {
    // Swallow: configured() will be false or load will catch; component stays mounted with friendly fallback.
  }

  // Static sample messages shown only in fallback (graceful "coming soon" preview; never sent)
  const sampleMessages: ChatMessage[] = [
    {
      id: 'sample-1',
      live_event_id: liveEventId ?? null,
      user_id: null,
      display_name: 'OKWatcher',
      body: 'First! Excited for the report tonight.',
      created_at: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
    },
    {
      id: 'sample-2',
      live_event_id: liveEventId ?? null,
      user_id: null,
      display_name: 'PatriotPrepper',
      body: 'The 24/7 feed has been solid this week.',
      created_at: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    },
  ];

  // Robust initial load + realtime subscribe with graceful fallback.
  // Never throws; always settles loading. Uses supabaseConfigured guard + try/finally.
  // Realtime status handling added to surface subscription issues without crashing.
  // P2: All setLoadError use *non-raw* signals only (user UI never shows technical table/RLS/realtime details).
  // Extra try/catch around sb access + query for table/policy (e.g. 42P01 missing table, 42501 RLS).
  // On any error: loadError truthy triggers "coming soon" + *samples* (no raw interp).
  // (See ThreadedComments for P1 realtime UPDATE handling pattern for mod approvals.)
  const loadMessages = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    setLoadError(null);
    loadErrorRef.current = null;

    // Fast graceful path if Supabase not configured in this env
    if (!supabaseConfigured()) {
      if (mountedRef.current) {
        setLoadError('unavailable'); // internal signal only; UI renders fixed friendly text + samples
        loadErrorRef.current = 'unavailable';
        setMessages([]);
        setLoading(false);
      }
      return;
    }

    try {
      if (!sb) throw new Error('no sb client');
      let query = sb
        .from('live_chat_messages')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (liveEventId) {
        query = query.eq('live_event_id', liveEventId);
      } else {
        query = query.is('live_event_id', null);
      }

      const { data, error: loadErr } = await query;

      if (!mountedRef.current) return;
      if (loadErr) {
        // Friendly signal only (no raw 'tables or realtime may need provisioning' etc exposed to user)
        setLoadError('unavailable');
        loadErrorRef.current = 'unavailable';
        setMessages([]);
        return;
      }
      setMessages((data || []).reverse() as ChatMessage[]);
    } catch (e: any) {
      if (mountedRef.current) {
        // Extra catch for policy/table/network: never hard fail, always samples fallback
        setLoadError('unavailable');
        loadErrorRef.current = 'unavailable';
        setMessages([]);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [liveEventId, sb]);

  useEffect(() => {
    mountedRef.current = true;

    // Initial fetch (guarded)
    void loadMessages();

    // Realtime subscription with status listener for robustness
    // P2: extra try/catch + sb guard + generic 'unavailable' signal (realtime fail -> friendly coming-soon + samples, no raw).
    // If no table/RLS/pub for postgres_changes, subscribe status hits CHANNEL_ERROR path -> graceful, no dismiss/raw.
    let channel: RealtimeChannel | null = null;
    try {
      if (!sb) throw new Error('no sb for realtime');
      channel = sb
        .channel(`live-chat-${liveEventId || 'global'}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'live_chat_messages',
            filter: liveEventId ? `live_event_id=eq.${liveEventId}` : 'live_event_id=is.null',
          },
          (payload) => {
            const newMsg = payload.new as ChatMessage;
            if (newMsg.is_deleted) return;
            setMessages((prev) => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              const next = [...prev, newMsg].slice(-50);
              requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }));
              return next;
            });
          }
        )
        .subscribe((status, err) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            // Do not overwrite a primary load error; surface only if chat was otherwise ok
            if (!loadErrorRef.current && mountedRef.current) {
              setLoadError('unavailable'); // internal signal; UI shows fixed friendly + samples (P2: no raw realtime msg)
              loadErrorRef.current = 'unavailable';
            }
            // eslint-disable-next-line no-console
            console.warn('[LiveChat] realtime status:', status, err);
          }
        });

      channelRef.current = channel;
    } catch (e) {
      if (mountedRef.current && !loadErrorRef.current) {
        setLoadError('unavailable');
        loadErrorRef.current = 'unavailable';
      }
    }

    return () => {
      mountedRef.current = false;
      if (channelRef.current) {
        try { sb?.removeChannel(channelRef.current); } catch {}
        channelRef.current = null;
      }
    };
  }, [liveEventId, sb, loadMessages]);

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim() || !isMember || !currentUser || sending) return;

    const body = input.trim().slice(0, 2000);
    const optimistic: ChatMessage = {
      id: `opt-${Date.now()}`,
      live_event_id: liveEventId,
      user_id: currentUser.id,
      display_name: (currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Member'),
      body,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic].slice(-50));
    setInput('');
    setSending(true);
    setError(null);

    try {
      if (!sb) throw new Error('no client');
      const { error: insertErr } = await sb.from('live_chat_messages').insert({
        live_event_id: liveEventId,
        user_id: currentUser.id,
        display_name: optimistic.display_name,
        body,
      });

      if (insertErr) throw insertErr;

      // real msg will arrive via realtime; remove opt if needed (or keep for instant)
    } catch (err: any) {
      // P2: no raw err.message (or any technical) ever shown to user. Generic + rollback only. (no "dismiss" raw)
      setError('send-failed');
      // rollback optimistic
      setMessages((prev) => prev.filter(m => m.id !== optimistic.id));
      setInput(body); // restore
    } finally {
      setSending(false);
    }
  }

  // Retry exposed for fallback button (safe to call anytime)
  const retryLoad = useCallback(() => {
    void loadMessages();
  }, [loadMessages]);

  // a11y: aria-live region for new messages. Graceful degradation + loading + retry.
  // Does not crash parent (LiveStage /live). Shows friendly copy + samples on failure.
  return (
    <div className="live-chat" role="region" aria-label="Live chat">
      <div className="chat-header">
        <h3>Live Chat {liveEventId ? '' : '(Global 24/7)'}</h3>
        <span className="member-badge">{isMember ? 'Member' : 'Join to chat'}</span>
      </div>

      <div 
        ref={listRef} 
        className="chat-list chat-list--scroll" 
        aria-live="polite" 
        aria-relevant="additions"
      >
        {loading && (
          <p className="empty" aria-live="polite">Loading live chat…</p>
        )}

        {!loading && loadError && (
          <div role="status" className="chat-fallback">
            {/* P2: ALWAYS "coming soon" + samples on error; *never* render raw loadError value (no technical strings like provisioning, failed to reach, realtime unavailable etc). */}
            <p className="chat-fallback__title">Live chat is coming soon.</p>
            <p className="chat-fallback__msg">
              Real-time messages activate during live broadcasts once the chat backend (tables + RLS + publication) is connected.
            </p>
            <button
              type="button"
              onClick={retryLoad}
              disabled={loading}
              className="chat-fallback__retry"
              aria-label="Retry loading live chat"
            >
              Retry
            </button>

            {/* Sample preview messages (visual only; not persisted or interactive) */}
            <div className="chat-fallback__preview">
              <div className="chat-fallback__preview-label">Preview</div>
              {sampleMessages.map((m) => (
                <div key={m.id} className="chat-msg chat-msg--preview" tabIndex={-1}>
                  <span className="author">{m.display_name}</span>
                  <time>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                  <p>{m.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && !loadError && messages.length === 0 && (
          <p className="empty">No messages yet. Be the first!</p>
        )}

        {!loading && !loadError && messages.map((m) => (
          <div key={m.id} className={`chat-msg ${m.user_id === currentUser?.id ? 'own' : ''}`} tabIndex={0}>
            <span className="author">{m.display_name}</span>
            <time>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
            <p>{m.body}</p>
          </div>
        ))}
      </div>

      {/* Send error (distinct from loadError) — P2: no raw error value, no "dismiss" button/text (friendly generic only; retry via form). */}
      {error && <p role="alert" className="error">Send failed. Please try again.</p>}

      <form onSubmit={sendMessage} className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isMember ? "Type message (Enter to send)" : "Members only"}
          disabled={!isMember || sending}
          maxLength={2000}
          aria-label="Chat message"
        />
        <button type="submit" disabled={!isMember || !input.trim() || sending} aria-busy={sending}>
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>

      {!isMember && (
        <p className="gate">
          <a href="/membership">Become a member</a> for live chat access.
        </p>
      )}
    </div>
  );
}
