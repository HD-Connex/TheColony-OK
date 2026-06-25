-- Phase 5: AI search foundation — transcripts + vector embeddings for semantic search.
-- content_id may reference podcast episodes.id or video_episodes.id (global UUIDs).
-- Writes are service-role only (no INSERT/UPDATE/DELETE policies); reads are public for search.

-- Drop legacy TheColony schema (episode_id / cues) when present so CREATE below succeeds.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'transcripts'
      AND column_name = 'episode_id'
  ) THEN
    DROP TABLE IF EXISTS public.content_embeddings CASCADE;
    DROP TABLE IF EXISTS public.transcripts CASCADE;
    DROP FUNCTION IF EXISTS public.match_content_embeddings(vector(1536), int, float);
  END IF;
END $$;

CREATE EXTENSION IF NOT EXISTS vector;

-- ─── Transcripts (Whisper / Mux / provider output) ───

CREATE TABLE IF NOT EXISTS public.transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL
    CHECK (content_type IN ('episode', 'video_episode')),
  language TEXT NOT NULL DEFAULT 'en',
  segments JSONB NOT NULL DEFAULT '[]'::jsonb,
  provider TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (content_id, content_type, language)
);

CREATE INDEX IF NOT EXISTS idx_transcripts_content
  ON public.transcripts(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_transcripts_language
  ON public.transcripts(language);

COMMENT ON TABLE public.transcripts IS
  'AI/provider transcripts keyed by content_id + content_type. segments: [{start,end,text,speaker?}].';
COMMENT ON COLUMN public.transcripts.segments IS
  'JSONB array of timed segments (seconds). Aligns with lib/transcripts.ts TranscriptSegment.';

-- ─── Content embeddings (chunked text for semantic search) ───

CREATE TABLE IF NOT EXISTS public.content_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL
    CHECK (content_type IN ('episode', 'video_episode')),
  chunk_index INTEGER NOT NULL DEFAULT 0,
  chunk TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_embeddings_content
  ON public.content_embeddings(content_id, content_type, chunk_index);

-- HNSW index for fast cosine similarity search (pgvector)
CREATE INDEX IF NOT EXISTS idx_content_embeddings_hnsw_cosine
  ON public.content_embeddings
  USING hnsw (embedding vector_cosine_ops);

COMMENT ON TABLE public.content_embeddings IS
  'Chunked transcript/summary text with 1536-dim embeddings (e.g. text-embedding-3-small).';

-- ─── Semantic search RPC ───

CREATE OR REPLACE FUNCTION public.match_content_embeddings(
  query_embedding vector(1536),
  match_count int DEFAULT 10,
  match_threshold float DEFAULT 0.5
)
RETURNS TABLE (
  id uuid,
  content_id uuid,
  content_type text,
  chunk text,
  similarity float
)
LANGUAGE sql
STABLE
SET search_path = 'extensions'
AS $$
  SELECT
    ce.id,
    ce.content_id,
    ce.content_type,
    ce.chunk,
    (1 - (ce.embedding <=> query_embedding))::float AS similarity
  FROM public.content_embeddings ce
  WHERE (1 - (ce.embedding <=> query_embedding)) >= match_threshold
  ORDER BY ce.embedding <=> query_embedding
  LIMIT GREATEST(match_count, 1);
$$;

GRANT EXECUTE ON FUNCTION public.match_content_embeddings(vector(1536), int, float)
  TO anon, authenticated, service_role;

-- ─── RLS: public read, service-role write only ───

ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_embeddings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transcripts_public_read" ON public.transcripts;
CREATE POLICY "transcripts_public_read" ON public.transcripts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "content_embeddings_public_read" ON public.content_embeddings;
CREATE POLICY "content_embeddings_public_read" ON public.content_embeddings
  FOR SELECT USING (true);

-- No INSERT/UPDATE/DELETE policies for anon/authenticated.
-- supabaseAdmin() (service role) bypasses RLS for cron/job writes.