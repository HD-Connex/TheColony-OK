import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { roleAtLeast, requireServiceToken, requireCronSecret, safeCompare } from "./admin-auth";

describe("roleAtLeast", () => {
  test("admin >= admin", () => expect(roleAtLeast("admin", "admin")).toBe(true));
  test("admin >= editor", () => expect(roleAtLeast("admin", "editor")).toBe(true));
  test("admin >= contributor", () => expect(roleAtLeast("admin", "contributor")).toBe(true));
  test("admin >= member", () => expect(roleAtLeast("admin", "member")).toBe(true));

  test("editor >= editor", () => expect(roleAtLeast("editor", "editor")).toBe(true));
  test("editor >= contributor", () => expect(roleAtLeast("editor", "contributor")).toBe(true));
  test("editor >= member", () => expect(roleAtLeast("editor", "member")).toBe(true));
  test("editor < admin", () => expect(roleAtLeast("editor", "admin")).toBe(false));

  test("contributor >= contributor", () => expect(roleAtLeast("contributor", "contributor")).toBe(true));
  test("contributor >= member", () => expect(roleAtLeast("contributor", "member")).toBe(true));
  test("contributor < editor", () => expect(roleAtLeast("contributor", "editor")).toBe(false));
  test("contributor < admin", () => expect(roleAtLeast("contributor", "admin")).toBe(false));

  test("member >= member", () => expect(roleAtLeast("member", "member")).toBe(true));
  test("member < contributor", () => expect(roleAtLeast("member", "contributor")).toBe(false));
  test("member < editor", () => expect(roleAtLeast("member", "editor")).toBe(false));
  test("member < admin", () => expect(roleAtLeast("member", "admin")).toBe(false));
});

describe("safeCompare (timing-safe, re-exported from admin-auth)", () => {
  test("returns false for null/undefined/empty", () => {
    expect(safeCompare(null, "x")).toBe(false);
    expect(safeCompare("x", undefined)).toBe(false);
    expect(safeCompare("", "a")).toBe(false);
  });

  test("true for identical strings", () => {
    expect(safeCompare("secret-token-123", "secret-token-123")).toBe(true);
  });

  test("false for different strings (even same length)", () => {
    expect(safeCompare("abc123", "abc124")).toBe(false);
  });

  test("false for different lengths (no length leak)", () => {
    expect(safeCompare("short", "muchlongerstring")).toBe(false);
  });
});

describe("requireServiceToken", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  test("returns false when no token configured", () => {
    delete process.env.ADMIN_SERVICE_TOKEN;
    const req = new Request("http://local", {
      headers: { authorization: "Bearer some-token" },
    });
    expect(requireServiceToken(req)).toBe(false);
  });

  test("returns false when authorization header missing", () => {
    process.env.ADMIN_SERVICE_TOKEN = "my-secret-token";
    const req = new Request("http://local");
    expect(requireServiceToken(req)).toBe(false);
  });

  test("returns false when authorization is not Bearer", () => {
    process.env.ADMIN_SERVICE_TOKEN = "my-secret-token";
    const req = new Request("http://local", {
      headers: { authorization: "Basic abc123" },
    });
    expect(requireServiceToken(req)).toBe(false);
  });

  test("returns true for matching token", () => {
    process.env.ADMIN_SERVICE_TOKEN = "my-secret-token";
    const req = new Request("http://local", {
      headers: { authorization: "Bearer my-secret-token" },
    });
    expect(requireServiceToken(req)).toBe(true);
  });

  test("returns false for wrong token", () => {
    process.env.ADMIN_SERVICE_TOKEN = "my-secret-token";
    const req = new Request("http://local", {
      headers: { authorization: "Bearer wrong-token" },
    });
    expect(requireServiceToken(req)).toBe(false);
  });
});

describe("requireCronSecret", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  test("returns true in dev when no secret configured", () => {
    delete process.env.CRON_SECRET;
    (process.env as Record<string, string>)["NODE_ENV"] = "development";
    const req = new Request("http://local");
    expect(requireCronSecret(req)).toBe(true);
  });

  test("returns false in production when no secret configured", () => {
    delete process.env.CRON_SECRET;
    (process.env as Record<string, string>)["NODE_ENV"] = "production";
    const req = new Request("http://local");
    expect(requireCronSecret(req)).toBe(false);
  });

  test("returns true for matching token", () => {
    process.env.CRON_SECRET = "cron-secret-123";
    const req = new Request("http://local", {
      headers: { authorization: "Bearer cron-secret-123" },
    });
    expect(requireCronSecret(req)).toBe(true);
  });

  test("returns false for wrong token", () => {
    process.env.CRON_SECRET = "cron-secret-123";
    const req = new Request("http://local", {
      headers: { authorization: "Bearer wrong-secret" },
    });
    expect(requireCronSecret(req)).toBe(false);
  });
});
