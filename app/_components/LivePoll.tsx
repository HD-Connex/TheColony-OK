"use client";

import React, { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/auth-client';

/**
 * Layer 3: Live Poll component starter (pairs with LiveChat).
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
  const sb = supabaseBrowser();

  const total = Object.values(votes).reduce((a, b) => a + b, 0);

  useEffect(() => {
    let active = true;

    async function loadVotes() {
      const { data } = await sb
        .from('live_poll_votes')
        .select('option_index')
        .eq('poll_id', poll.id);

      if (!active || !data) return;
      const tally: Record<number, number> = {};
      data.forEach((v: any) => {
        tally[v.option_index] = (tally[v.option_index] || 0) + 1;
      });
      setVotes(tally);

      // check own vote
      if (currentUserId) {
        const own = data.find((v: any) => /* need join or separate query */ false); // stub: separate query in real
      }
      setLoading(false);
    }

    loadVotes();

    const channel = sb
      .channel(`poll-${poll.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_poll_votes', filter: `poll_id=eq.${poll.id}` }, () => {
        // re-tally simple (in prod: incremental or RPC)
        loadVotes();
      })
      .subscribe();

    return () => { active = false; sb.removeChannel(channel); };
  }, [poll.id, currentUserId, sb]);

  async function vote(optionIdx: number) {
    if (!isMember || !currentUserId || userVote !== null || !poll.is_active) return;

    // optimistic
    const prevVotes = { ...votes };
    const prevUser = userVote;
    setVotes(prev => ({ ...prev, [optionIdx]: (prev[optionIdx] || 0) + 1 }));
    setUserVote(optionIdx);

    const { error } = await sb.from('live_poll_votes').insert({
      poll_id: poll.id,
      user_id: currentUserId,
      option_index: optionIdx,
    });

    if (error) {
      // rollback
      setVotes(prevVotes);
      setUserVote(prevUser);
      alert('Vote failed: ' + error.message);
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
      {loading && <p>Loading results…</p>}
    </div>
  );
}
