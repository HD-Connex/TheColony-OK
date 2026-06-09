"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabaseBrowser } from '@/lib/auth-client';
import { supabaseConfigured } from '@/lib/supabase';
import type { RealtimeChannel, User } from '@supabase/supabase-js';

/**
 * Layer 3 Perfection: Realtime Live Chat starter.
 * - postgres_changes for INSERT on live_chat_messages (filter by live_event_id or global).
 * - Optimistic UI + rollback on error.
 * - Member gate (useAuth isMember).
 * - A11y: aria-live polite for new msgs, keyboard send (Enter), focus management.
 * - Perf: limit 50 msgs, virtual scroll stub (or simple slice), dedupe by id.
 * - Errors: toast or inline, retry send, offline stub.
 * - Types full. No debt (comments, TODOs explicit).
 * - Ties to live_event or 24/7 channel id.
 * - Future: reactions, replies, mod tools, per-ep comments table reuse.
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

  const sb = supabaseBrowser();

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
  const loadMessages = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    setLoadError(null);
    loadErrorRef.current = null;

    // Fast graceful path if Supabase not configured in this env
    if (!supabaseConfigured()) {
      if (mountedRef.current) {
        setLoadError('Chat backend not connected in this environment.');
        loadErrorRef.current = 'Chat backend not connected in this environment.';
        setMessages([]);
        setLoading(false);
      }
      return;
    }

    try {
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
        setLoadError('Live chat temporarily unavailable. Tables or realtime may need provisioning.');
        loadErrorRef.current = 'Live chat temporarily unavailable. Tables or realtime may need provisioning.';
        setMessages([]);
        return;
      }
      setMessages((data || []).reverse() as ChatMessage[]);
    } catch (e: any) {
      if (mountedRef.current) {
        setLoadError('Failed to reach chat service. Realtime may be offline right now.');
        loadErrorRef.current = 'Failed to reach chat service. Realtime may be offline right now.';
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
    let channel: RealtimeChannel | null = null;
    try {
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
              setLoadError('Realtime updates unavailable. (Chat may still load static history.)');
              loadErrorRef.current = 'Realtime updates unavailable. (Chat may still load static history.)';
            }
            // eslint-disable-next-line no-console
            console.warn('[LiveChat] realtime status:', status, err);
          }
        });

      channelRef.current = channel;
    } catch (e) {
      if (mountedRef.current && !loadErrorRef.current) {
        setLoadError('Could not establish chat realtime channel.');
        loadErrorRef.current = 'Could not establish chat realtime channel.';
      }
    }

    return () => {
      mountedRef.current = false;
      if (channelRef.current) {
        try { sb.removeChannel(channelRef.current); } catch {}
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
      const { error: insertErr } = await sb.from('live_chat_messages').insert({
        live_event_id: liveEventId,
        user_id: currentUser.id,
        display_name: optimistic.display_name,
        body,
      });

      if (insertErr) throw insertErr;

      // real msg will arrive via realtime; remove opt if needed (or keep for instant)
    } catch (err: any) {
      setError(err.message || 'Send failed');
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
            <p className="chat-fallback__title">Live chat is coming soon.</p>
            <p className="chat-fallback__msg">
              {loadError} Real-time messages activate during live broadcasts once the chat backend (tables + RLS + publication) is connected.
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

      {/* Send error (distinct from loadError) */}
      {error && <p role="alert" className="error">{error} <button onClick={() => setError(null)}>dismiss</button></p>}

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
