/**
 * Simple offset/limit pagination helper + types.
 * Used by P1 listings (articles, episodes, clips, video_episodes) to avoid full table scans at scale.
 * Supports both offset and cursor-ish (page based).
 * Default safe limits to prevent abuse.
 */
export interface PaginateParams {
  limit?: number;
  offset?: number;
  page?: number; // 1-based convenience
}

export interface PaginatedResult<T> {
  items: T[];
  total?: number; // optional if expensive; caller can omit
  limit: number;
  offset: number;
  hasMore: boolean;
}

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 12;

export function getPaginateParams(params: PaginateParams): { limit: number; offset: number } {
  let limit = params.limit ?? (params.page ? DEFAULT_LIMIT : DEFAULT_LIMIT);
  limit = Math.max(1, Math.min(MAX_LIMIT, Math.floor(limit)));

  let offset = params.offset ?? 0;
  if (params.page && params.page > 0) {
    offset = (params.page - 1) * limit;
  }
  offset = Math.max(0, Math.floor(offset));

  return { limit, offset };
}

export function makePaginatedResult<T>(items: T[], total: number | undefined, limit: number, offset: number): PaginatedResult<T> {
  const hasMore = total != null ? offset + items.length < total : items.length === limit; // heuristic if no total
  return { items, total, limit, offset, hasMore };
}

/** Apply to Supabase query builder (chain before execute). */
export function applySupabasePaginate(qb: any, p: PaginateParams) {
  const { limit, offset } = getPaginateParams(p);
  return qb.range(offset, offset + limit - 1); // inclusive
}

export const PAGINATION = { DEFAULT_LIMIT, MAX_LIMIT };
