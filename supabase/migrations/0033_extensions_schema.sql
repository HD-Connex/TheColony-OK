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
