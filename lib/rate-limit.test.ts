import { describe, test, expect, beforeEach } from "vitest";
import { rateLimit, keyFromRequest, tooManyRequests } from "./rate-limit";

describe("rate-limit (memory path)", () => {
  beforeEach(() => {
    // crude: each test file gets fresh module state because vitest isolates by default in recent
  });

  test("allows under limit and returns remaining", async () => {
    const key = "t:rl:1";
    const r1 = await rateLimit(key, { limit: 2, windowSec: 60 });
    expect(r1.ok).toBe(true);
    expect(r1.remaining).toBe(1);

    const r2 = await rateLimit(key, { limit: 2, windowSec: 60 });
    expect(r2.ok).toBe(true);
    expect(r2.remaining).toBe(0);
  });

  test("blocks after limit", async () => {
    const key = "t:rl:2";
    await rateLimit(key, { limit: 1, windowSec: 60 });
    const r = await rateLimit(key, { limit: 1, windowSec: 60 });
    expect(r.ok).toBe(false);
    expect(r.remaining).toBe(0);
    expect(r.retryAfterSec).toBeGreaterThan(0);
  });

  test("keyFromRequest prefers x-forwarded-for first ip", () => {
    const req = new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8", "x-real-ip": "9.9.9.9" } });
    expect(keyFromRequest(req, "tips")).toBe("tips:1.2.3.4");
  });

  test("tooManyRequests builds 429 with Retry-After", () => {
    const res = tooManyRequests({ ok: false, remaining: 0, retryAfterSec: 42 });
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("42");
  });
});
