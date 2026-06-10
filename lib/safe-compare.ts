import { createHash, timingSafeEqual } from "node:crypto";

/** Constant-time string compare. Hashes both sides so length never leaks. Pure, safe for tests. */
export function safeCompare(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}
