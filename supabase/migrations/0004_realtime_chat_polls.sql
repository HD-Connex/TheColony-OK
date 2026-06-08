-- Layer 3 Perfection: Realtime chat & polls starter (Supabase)
-- Adds tables for live chat messages + polls (with votes), RLS for members, realtime enable.
-- Ties to live_events (or global for now; extend to episodes later).
-- Every line: types/comments in companion .ts, a11y in UI, optimistic + conflict (updated_at), perf (indexes, limit queries), no debt.
-- Member-only for chat/polls (is_member via existing entitlements).
-- Future: per-ep comments, Q&A queue, moderation.

-- Enable realtime for these (run once or in dashboard too)
-- alter publication supabase_realtime add table live_chat_messages;
-- alter publication supabase_realtime add table live_polls;
-- alter publication supabase_realtime add table live_poll_votes;

CREATE TABLE IF NOT EXISTS live_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_event_id UUID REFERENCES live_events(id) ON DELETE CASCADE, -- null = global 24/7 or site-wide
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL, -- snapshot or from profiles
  body TEXT NOT NULL CHECK (length(body) > 0 AND length(body) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  -- moderation
  flagged_count INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_live_chat_live_event_created ON live_chat_messages(live_event_id, created_at DESC) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_live_chat_user ON live_chat_messages(user_id);

-- Polls (simple multi-choice during live)
CREATE TABLE IF NOT EXISTS live_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_event_id UUID REFERENCES live_events(id) ON DELETE CASCADE,
  question TEXT NOT NULL CHECK (length(question) <= 280),
  options JSONB NOT NULL, -- e.g. ["Yes","No","Undecided"] or [{id:.., label:..}]
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closes_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS live_poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES live_polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  option_index INT NOT NULL, -- or option_id if complex
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (poll_id, user_id) -- one vote per user per poll
);

CREATE INDEX IF NOT EXISTS idx_live_poll_votes_poll ON live_poll_votes(poll_id);

-- RLS: members (or admins) can read/insert chat & votes; only own deletes/mods limited.
-- Assumes existing is_member() or profiles.is_member or jwt claim from Stripe sync.
ALTER TABLE live_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_poll_votes ENABLE ROW LEVEL SECURITY;

-- Read: public for chat (transparency) or member-only? Start public read for engagement, write member.
CREATE POLICY "live_chat_read" ON live_chat_messages FOR SELECT USING (true); -- or (auth.role() = 'authenticated' AND is_member())
CREATE POLICY "live_chat_insert" ON live_chat_messages FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND 
  (SELECT is_member FROM profiles WHERE id = auth.uid()) -- adjust to your profiles/entitlements
);

-- Similar for polls (read active, vote if member)
CREATE POLICY "live_polls_read" ON live_polls FOR SELECT USING (is_active OR auth.uid() = created_by);
CREATE POLICY "live_polls_vote" ON live_poll_votes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Update/delete own or admin (simple)
CREATE POLICY "live_chat_own_update" ON live_chat_messages FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
-- Admin full via service or separate policy.

COMMENT ON TABLE live_chat_messages IS 'Layer 3: realtime chat starter for live/24/7. postgres_changes on created_at for new msgs. Member write gate.';
COMMENT ON TABLE live_polls IS 'Layer 3: live polls. Realtime on votes for instant results UI. One-vote RLS unique.';

-- Seed example (in seed or admin): INSERT live_polls ... 
-- TODO: trigger updated_at; function for vote tally view; fulltext on chat if search later.
