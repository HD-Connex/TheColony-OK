"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabaseBrowser } from '@/lib/auth-client';
import { supabaseConfigured } from '@/lib/supabase';

/**
 * Layer 3: Live Poll component starter (pairs with LiveChat).
 * P2-16 (helped by p1-swarm): polls realtime complete - votes on `poll-${id}`, + live-poll-active-${target} on live_polls (now inside LivePoll too for self-contained updates to is_active etc when parent passes static poll e.g. /live sidebar). Matches LiveStage + doc claims. liveEventId target aligns with chat/comments. Direct RLS client ok. (verified post-edit)
 * Real-time vote tally via postgres_changes on live_poll_votes; active status via live_polls.
 * Optimistic vote + unique constraint enforcement.
 * A11y: radio group, live results region, disabled after vote/close.
 * Perf: single poll fetch + subscribe; tally computed client or via RPC view.
 */

export interface Poll {
  id: string;
  live_event_id: string | null;
  question: string;
  options: string[]; // simple array for stub; can be richer
  is_active: boolean;
  closes_at?: string | null;
}

interface LivePollProps {
  poll: Poll;
  isMember: boolean;
  currentUserId: string | null;
}

export default function LivePoll({ poll, isMember, currentUserId }: LivePollProps) {
  const [votes, setVotes] = useState<Record<number, number>>({});
  const [userVote, setUserVote] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const sb = supabaseBrowser();

  // P2-16 realtime: maintain currentPoll locally (synced from prop) + sub to live-poll-active channel
  // so is_active/closes etc update on live_polls changes (for /live sidebar static poll + stage).
  // Complements LiveStage's live-poll-active- sub and votes sub here. Kills stale poll UI.
  const [currentPoll, setCurrentPoll] = useState<Poll>(poll);
  useEffect(() => {
    setCurrentPoll(poll);
  }, [poll]);

  const total = Object.values(votes).reduce((a, b) => a + b, 0);

  const loadVotes = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    setLoadError(null);

    if (!supabaseConfigured()) {
      if (mountedRef.current) {
        setLoadError('Poll results backend unavailable.');
        setLoading(false);
      }
      return;
    }

    try {
      const { data, error: qErr } = await sb
        .from('live_poll_votes')
        .select('option_index,user_id')
        .eq('poll_id', poll.id);

      if (!mountedRef.current) return;
      if (qErr || !data) {
        setLoadError('Could not load current poll results.');
        return;
      }

      const tally: Record<number, number> = {};
      let ownIdx: number | null = null;
      data.forEach((v: { option_index: number; user_id: string }) => {
        tally[v.option_index] = (tally[v.option_index] || 0) + 1;
        if (currentUserId && v.user_id === currentUserId) ownIdx = v.option_index;
      });
      setVotes(tally);
      setUserVote(ownIdx);
    } catch (e: any) {
      if (mountedRef.current) setLoadError('Poll tally fetch failed.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [poll.id, currentUserId, sb]);

  useEffect(() => {
    mountedRef.current = true;
    void loadVotes();

    let channel: any = null;
    let activeChannel: any = null;
    const targetLiveId = poll.live_event_id;
    try {
      channel = sb
        .channel(`poll-${poll.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'live_poll_votes', filter: `poll_id=eq.${poll.id}` }, () => {
          void loadVotes();
        })
        .subscribe();

      // P2-16: live-poll-active channel on live_polls (per target like LiveStage) so this LivePoll reacts to poll activate/deactivate/close realtime
      activeChannel = sb
        .channel(`live-poll-active-${targetLiveId ?? "global"}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "live_polls", filter: targetLiveId ? `live_event_id=eq.${targetLiveId}` : "live_event_id=is.null" }, async () => {
          // refetch our specific poll row to sync is_active/closes etc into local state (updates disabled state, UI)
          try {
            const { data } = await sb
              .from("live_polls")
              .select("id,live_event_id,question,options,is_active,closes_at")
              .eq("id", poll.id)
              .maybeSingle();
            if (data && mountedRef.current) {
              const raw = data as any;
              const options = Array.isArray(raw.options) ? raw.options.map((o: any) => (typeof o === "string" ? o : o.label)) : [];
              setCurrentPoll({
                id: raw.id,
                live_event_id: raw.live_event_id,
                question: raw.question,
                options,
                is_active: raw.is_active,
                closes_at: raw.closes_at,
              } as Poll);
            }
          } catch {}
        })
        .subscribe();
    } catch {}

    return () => {
      mountedRef.current = false;
      if (channel) {
        try { sb.removeChannel(channel); } catch {}
      }
      if (activeChannel) {
        try { sb.removeChannel(activeChannel); } catch {}
      }
    };
  }, [poll.id, currentUserId, sb, loadVotes]);

  async function vote(optionIdx: number) {
    if (!isMember || !currentUserId || userVote !== null || !currentPoll.is_active) return;

    // optimistic
    const prevVotes = { ...votes };
    const prevUser = userVote;
    setVotes(prev => ({ ...prev, [optionIdx]: (prev[optionIdx] || 0) + 1 }));
    setUserVote(optionIdx);

    const { error: insertErr } = await sb.from('live_poll_votes').insert({
      poll_id: currentPoll.id,
      user_id: currentUserId,
      option_index: optionIdx,
    });

    if (insertErr) {
      // rollback
      setVotes(prevVotes);
      setUserVote(prevUser);
      setLoadError('Vote failed: ' + (insertErr.message || 'unknown'));
      // clear transient vote err after a bit so UI usable
      setTimeout(() => setLoadError(null), 2500);
    }
  }

  return (
    <div className="live-poll" role="group" aria-labelledby={`poll-q-${currentPoll.id}`}>
      <h4 id={`poll-q-${currentPoll.id}`}>{currentPoll.question}</h4>
      {currentPoll.closes_at && <p>Closes {new Date(currentPoll.closes_at).toLocaleString()}</p>}

      <div className="options" aria-live="polite">
        {currentPoll.options.map((opt, idx) => {
          const count = votes[idx] || 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const voted = userVote === idx;
          return (
            <button
              key={idx}
              onClick={() => vote(idx)}
              disabled={!isMember || !currentPoll.is_active || userVote !== null}
              aria-pressed={voted}
              className={`poll-option ${voted ? 'voted' : ''}`}
            >
              <span>{opt}</span>
              <span className="tally">{count} ({pct}%)</span>
              {voted && <span aria-hidden>✓</span>}
            </button>
          );
        })}
      </div>

      {!isMember && <p className="gate">Members vote live.</p>}

      {loading && <p aria-live="polite">Loading results…</p>}
      {loadError && (
        <p role="alert" className="poll-status poll-status--error">
          {loadError}
        </p>
      )}
      {!loading && !loadError && Object.keys(votes).length === 0 && (
        <p className="poll-status">No votes yet — be the first!</p>
      )}
    </div>
  );
}
