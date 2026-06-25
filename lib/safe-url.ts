import { lookup } from "dns/promises";
import { isIP } from "net";

// SSRF guard for server-side fetches of externally/DB-supplied URLs.
// Returns a validated URL object (fetch THAT object, not the raw string, so the
// taint-tracker sees the value pass through this barrier). Rejects non-HTTP(S)
// schemes and hosts that point at the local network / cloud metadata.
// Also enforces an explicit hostname allow-list for outbound media fetches.
// DNS hostnames are resolved at check-time: every A/AAAA record must point to a
// public (non-blocked) address.

const ALLOWED_MEDIA_HOSTS = (process.env.ALLOWED_TRANSCRIBE_MEDIA_HOSTS || "")
  .split(",")
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

function isAllowedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  // If no explicit allow-list is provided, allow any public host (the other
  // checks in assertPublicHttpUrl will still block localhost, private IPs, and
  // link-local/metadata addresses). This keeps the dev/test experience smooth
  // while preserving SSRF protections when an allow-list is configured.
  if (ALLOWED_MEDIA_HOSTS.length === 0) {
    return process.env.NODE_ENV !== "production";
  }
  return ALLOWED_MEDIA_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

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

function isBlockedIpv6(address: string): boolean {
  // IPv6 loopback / unspecified / unique-local (fc00::/7) / link-local (fe80::/10)
  return (
    address === "::1" ||
    address === "::" ||
    address.startsWith("fc") ||
    address.startsWith("fd") ||
    address.startsWith("fe8") ||
    address.startsWith("fe9") ||
    address.startsWith("fea") ||
    address.startsWith("feb")
  );
}

function isBlockedAddress(address: string): boolean {
  return isBlockedIpv4(address) || isBlockedIpv6(address);
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".localhost")
  );
}

/**
 * Validate that `raw` is a public http(s) URL safe to fetch server-side.
 * Throws on invalid/blocked URLs. Returns the parsed URL — pass it to fetch().
 *
 * IP-literal hostnames are checked directly against the block list.
 * DNS hostnames are resolved to all A/AAAA records — if any resolved address
 * is blocked the URL is rejected.
 */
export async function assertPublicHttpUrl(raw: string): Promise<URL> {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new Error("Invalid URL");
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") {
    throw new Error(`Unsupported URL scheme: ${u.protocol}`);
  }
  if (!isAllowedHost(u.hostname)) {
    throw new Error("URL host is not in allow-list");
  }
  if (isBlockedHostname(u.hostname)) {
    throw new Error("URL host is not allowed");
  }

  if (isIP(u.hostname) !== 0) {
    // IP literal — check directly
    if (isBlockedAddress(u.hostname)) {
      throw new Error("URL host is not allowed");
    }
  } else {
    // DNS hostname — resolve all addresses and reject if any are blocked
    let addresses: readonly { address: string; family: number }[];
    try {
      addresses = await lookup(u.hostname, { all: true, verbatim: true });
    } catch {
      throw new Error("URL host could not be resolved");
    }
    if (addresses.length === 0) {
      throw new Error("URL host could not be resolved");
    }
    for (const { address } of addresses) {
      if (isBlockedAddress(address)) {
        throw new Error("URL host resolves to a blocked address");
      }
    }
  }

  return u;
}
