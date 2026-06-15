"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabaseBrowser } from '@/lib/auth-client';
import { supabaseConfigured } from '@/lib/supabase';

/**
 * Layer 3: Live Poll component starter (pairs with LiveChat).
 * P2-16: polls wiring verified + enhanced (server getActivePoll + client LivePoll on /live sidebar now; channels `poll-${id}` + `live-poll-active-` on live_polls + live_poll_votes for realtime tally; liveEventId target matches chat. Direct RLS client ok (no extra /api needed).
 * Real-time vote tally via postgres_changes on live_poll_votes.
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
    try {
      channel = sb
        .channel(`poll-${poll.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'live_poll_votes', filter: `poll_id=eq.${poll.id}` }, () => {
          void loadVotes();
        })
        .subscribe();
    } catch {}

    return () => {
      mountedRef.current = false;
      if (channel) {
        try { sb.removeChannel(channel); } catch {}
      }
    };
  }, [poll.id, currentUserId, sb, loadVotes]);

  async function vote(optionIdx: number) {
    if (!isMember || !currentUserId || userVote !== null || !poll.is_active) return;

    // optimistic
    const prevVotes = { ...votes };
    const prevUser = userVote;
    setVotes(prev => ({ ...prev, [optionIdx]: (prev[optionIdx] || 0) + 1 }));
    setUserVote(optionIdx);

    const { error: insertErr } = await sb.from('live_poll_votes').insert({
      poll_id: poll.id,
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
    <div className="live-poll" role="group" aria-labelledby={`poll-q-${poll.id}`}>
      <h4 id={`poll-q-${poll.id}`}>{poll.question}</h4>
      {poll.closes_at && <p>Closes {new Date(poll.closes_at).toLocaleString()}</p>}

      <div className="options" aria-live="polite">
        {poll.options.map((opt, idx) => {
          const count = votes[idx] || 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const voted = userVote === idx;
          return (
            <button
              key={idx}
              onClick={() => vote(idx)}
              disabled={!isMember || !poll.is_active || userVote !== null}
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
