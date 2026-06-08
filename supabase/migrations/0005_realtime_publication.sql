-- Enable Supabase Realtime for chat + poll tables (run after 0004)
-- Safe to re-run: skips tables already in publication.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'live_chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE live_chat_messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'live_polls'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE live_polls;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'live_poll_votes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE live_poll_votes;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'live_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE live_events;
  END IF;
END $$;