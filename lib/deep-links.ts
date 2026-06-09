// Deep linking util for share/resume/context (ported from thecolony-ok archive).
export function buildDeepLink(path: string, params: Record<string, string | number | undefined>) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null) usp.set(k, String(v));
  });
  const qs = usp.toString();
  return `${path}${qs ? `?${qs}` : ""}`;
}

export function parseDeepParams(search: string) {
  const p = new URLSearchParams(search);
  return {
    t: p.get("t") ? parseInt(p.get("t")!, 10) : 0,
    host: p.get("host"),
    ref: p.get("ref"),
    county: p.get("county"),
    perk: p.get("perk"),
    q: p.get("q"),
    paywall: p.get("paywall") === "1",
  };
}