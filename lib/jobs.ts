// Small retry helper for background work (RSS ingest, transcription, email).
// Exponential backoff; rethrows the final error so callers can record failure.

export interface RetryOptions {
  attempts?: number;
  backoffMs?: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  { attempts = 3, backoffMs = 500 }: RetryOptions = {},
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < attempts) {
        await new Promise((r) => setTimeout(r, backoffMs * 2 ** (attempt - 1)));
      }
    }
  }
  throw lastError;
}
