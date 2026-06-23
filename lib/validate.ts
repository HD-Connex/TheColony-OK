// Shared input validators. Kept regex-free where user input drives matching, to
// avoid catastrophic backtracking (ReDoS).

/**
 * Linear, backtracking-free email check. Not RFC-exhaustive — just enough to
 * reject obviously-bad addresses for tip/contributor forms. Caps length, requires
 * exactly one "@", non-empty local part, and a dotted domain.
 */
export function isEmail(v?: string | null): boolean {
  if (!v) return false;
  const s = v.trim();
  if (s.length === 0 || s.length > 254) return false;
  if (/\s/.test(s)) return false; // single bounded scan, no backtracking
  const at = s.indexOf("@");
  if (at <= 0 || at !== s.lastIndexOf("@")) return false; // exactly one "@", local part non-empty
  const domain = s.slice(at + 1);
  if (domain.length === 0 || domain.startsWith(".") || domain.endsWith(".")) return false;
  return domain.includes(".");
}
