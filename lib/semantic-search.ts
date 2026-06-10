// Semantic search over content_embeddings (Phase 5).
// RPC match_content_embeddings needs a 1536-dim query vector; embedQuery() supplies
// one when OPENAI_API_KEY is set. Without a key, searchTranscriptChunks() matches
// stored chunk text via ilike (no embedding API required).

import { escapeIlike } from "./ilike";
import { supabaseAdmin, supabaseConfigured, supabasePublic } from "./supabase";

export type ContentType = "episode" | "video_episode" | "clip";

export interface EmbeddingSearchResult {
  id: string;
  content_id: string;
  content_type: ContentType;
  chunk: string;
  similarity: number;
  /** Timestamp in seconds for transcript matches (from rich segments). */
  start?: number;
  end?: number;
}

export interface SearchEmbeddingsOptions {
  /** Minimum cosine similarity 0–1 (default 0.5). */
  threshold?: number;
}

const EMBEDDING_DIM = 1536;

function isMissingSchemaError(message: string | undefined): boolean {
  if (!message) return false;
  return (
    message.includes("does not exist") ||
    message.includes("match_content_embeddings") ||
    message.includes("content_embeddings")
  );
}

/**
 * Cosine similarity search via pgvector RPC `match_content_embeddings`.
 * Requires migration 0011_ai_search.sql applied.
 */
export async function searchEmbeddings(
  queryEmbedding: number[],
  limit = 10,
  options?: SearchEmbeddingsOptions
): Promise<EmbeddingSearchResult[]> {
  if (queryEmbedding.length !== EMBEDDING_DIM) {
    throw new Error(
      `queryEmbedding must be length ${EMBEDDING_DIM}, got ${queryEmbedding.length}`
    );
  }

  const sb = supabaseAdmin();
  const { data, error } = await sb.rpc("match_content_embeddings", {
    query_embedding: queryEmbedding,
    match_count: limit,
    match_threshold: options?.threshold ?? 0.5,
  });

  if (error) {
    if (isMissingSchemaError(error.message)) {
      return [];
    }
    throw new Error(`searchEmbeddings failed: ${error.message}`);
  }

  return (data ?? []) as EmbeddingSearchResult[];
}

/** Dimension expected by content_embeddings.embedding — keep in sync with migration. */
export const EMBEDDING_DIMENSION = EMBEDDING_DIM;

export interface EmbeddingSearchStatus {
  schemaReady: boolean;
  hasEmbeddings: boolean;
  semanticQueryReady: boolean;
}

/** Whether query-time embedding generation is configured (OPENAI_API_KEY). */
export function isSemanticQueryAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

/** Probe content_embeddings + RPC availability (cheap; used by /search). */
export async function getEmbeddingSearchStatus(): Promise<EmbeddingSearchStatus> {
  if (!supabaseConfigured()) {
    return { schemaReady: false, hasEmbeddings: false, semanticQueryReady: isSemanticQueryAvailable() };
  }

  const sb = supabasePublic();
  const { count, error } = await sb
    .from("content_embeddings")
    .select("id", { count: "exact", head: true });

  if (error && isMissingSchemaError(error.message)) {
    return { schemaReady: false, hasEmbeddings: false, semanticQueryReady: isSemanticQueryAvailable() };
  }

  return {
    schemaReady: true,
    hasEmbeddings: (count ?? 0) > 0,
    semanticQueryReady: isSemanticQueryAvailable(),
  };
}

/**
 * Text match against stored transcript chunks (works without OpenAI when rows exist).
 * Deduplicates by content_id + content_type; similarity is a fixed rank placeholder.
 */
export async function searchTranscriptChunks(
  query: string,
  limit = 10
): Promise<EmbeddingSearchResult[]> {
  const q = query.trim();
  if (!q || !supabaseConfigured()) return [];

  const pattern = `%${escapeIlike(q)}%`;
  const sb = supabasePublic();
  const { data, error } = await sb
    .from("content_embeddings")
    .select("id, content_id, content_type, chunk")
    .ilike("chunk", pattern)
    .limit(Math.max(limit * 4, 20));

  if (error) {
    if (isMissingSchemaError(error.message)) return [];
    return [];
  }

  const seen = new Set<string>();
  const out: EmbeddingSearchResult[] = [];
  for (const row of data ?? []) {
    const r = row as Omit<EmbeddingSearchResult, "similarity">;
    const key = `${r.content_type}:${r.content_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...r, similarity: 1 });
    if (out.length >= limit) break;
  }
  return out;
}

/** Generate a query embedding via OpenAI when OPENAI_API_KEY is set. */
export async function embedQuery(text: string): Promise<number[] | null> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
      dimensions: EMBEDDING_DIM,
    }),
  });

  if (!res.ok) return null;

  const json = (await res.json()) as { data?: Array<{ embedding?: number[] }> };
  const embedding = json.data?.[0]?.embedding;
  if (!embedding || embedding.length !== EMBEDDING_DIM) return null;
  return embedding;
}

/**
 * Full semantic search: embed query (if configured) then RPC match_content_embeddings.
 * Returns [] when embeddings are unavailable or the schema is missing.
 */
export async function semanticSearch(
  query: string,
  limit = 10,
  options?: SearchEmbeddingsOptions
): Promise<EmbeddingSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const vector = await embedQuery(q);
  if (!vector) return [];

  try {
    return await searchEmbeddings(vector, limit, options);
  } catch {
    return [];
  }
}