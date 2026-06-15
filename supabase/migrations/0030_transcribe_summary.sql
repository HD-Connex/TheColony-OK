-- 0030_transcribe_summary.sql
-- P1: persist LLM-generated summaries from the transcription job.
-- The transcribe route (app/api/jobs/transcribe) generates a 1-2 sentence summary +
-- chapters from the Whisper transcript but previously only console.log'd the summary
-- (chapters columns already exist: episodes.chapters JSONB @ 0003, video_episodes.chapters @ 0007).
-- Add a summary column so the generated summary is stored and renderable in EpisodePlayer / feeds.

ALTER TABLE public.episodes
  ADD COLUMN IF NOT EXISTS summary TEXT;

ALTER TABLE public.video_episodes
  ADD COLUMN IF NOT EXISTS summary TEXT;

COMMENT ON COLUMN public.episodes.summary IS 'LLM-generated 1-2 sentence summary from transcript (jobs/transcribe). Editorial description stays in description.';
COMMENT ON COLUMN public.video_episodes.summary IS 'LLM-generated 1-2 sentence summary from transcript (jobs/transcribe).';

-- Apply via scripts/apply-migrations.mjs or supabase migration up after prior (0029).
