-- Relocate pgvector from public to extensions schema (reduces namespace pollution).
-- The vector extension's types/functions were exposed in the public schema, creating
-- API surface clutter and potential unintended exposure per Supabase lint rules.

create schema if not exists extensions;

-- Move existing vector extension objects to extensions schema.
-- For new deployments, 0011_ai_search.sql already creates vector here; this handles
-- existing databases that have it in public.
alter extension vector set schema extensions;

-- Ensure extensions schema is in search_path so unqualified vector type references
-- (e.g. column type `vector(1536)`) continue to resolve correctly.
alter database postgres set search_path to "$user", public, extensions;

-- Recreate match_content_embeddings with updated search_path (old: '', which hid the
-- vector operator after relocation). All table refs are already fully qualified.
create or replace function public.match_content_embeddings(
  query_embedding vector(1536),
  match_count int default 10,
  match_threshold float default 0.5
)
returns table (
  id uuid,
  content_id uuid,
  content_type text,
  chunk text,
  similarity float
)
language sql
stable
set search_path = 'extensions'
as $$
  select
    ce.id,
    ce.content_id,
    ce.content_type,
    ce.chunk,
    (1 - (ce.embedding <=> query_embedding))::float as similarity
  from public.content_embeddings ce
  where (1 - (ce.embedding <=> query_embedding)) >= match_threshold
  order by ce.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;
