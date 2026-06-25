// SSRF guard for server-side fetches of externally/DB-supplied URLs.
// Returns a validated URL object (fetch THAT object, not the raw string, so the
// taint-tracker sees the value pass through this barrier). Rejects non-HTTP(S)
// schemes and hosts that point at the local network / cloud metadata.

function isBlockedIpv4(host: string): boolean {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  // loopback, "this host", private, link-local (incl. 169.254.169.254 metadata), multicast/reserved
  return (
    a === 0 ||
    a === 127 ||
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    a >= 224
  );
}

function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[/, "").replace(/\]$/, "");
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".localhost")
  ) {
    return true;
  }
  if (isBlockedIpv4(host)) return true;
  // IPv6 loopback / unspecified / unique-local (fc00::/7) / link-local (fe80::/10)
  if (host === "::1" || host === "::") return true;
  if (host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe8") || host.startsWith("fe9") || host.startsWith("fea") || host.startsWith("feb")) {
    return true;
  }
  return false;
}

/**
 * Validate that `raw` is a public http(s) URL safe to fetch server-side.
 * Throws on invalid/blocked URLs. Returns the parsed URL — pass it to fetch().
 */
export function assertPublicHttpUrl(raw: string): URL {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new Error("Invalid URL");
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") {
    throw new Error(`Unsupported URL scheme: ${u.protocol}`);
  }
  if (isBlockedHost(u.hostname)) {
    throw new Error("URL host is not allowed");
  }
  const allowed = process.env.ALLOWED_TRANSCRIBE_MEDIA_HOSTS;
  if (allowed) {
    const hosts = allowed.split(",").map((h) => h.trim().toLowerCase());
    if (!hosts.includes(u.hostname.toLowerCase())) {
      throw new Error(`URL host "${u.hostname}" is not in the allow-list`);
    }
  }
  return u;
}
