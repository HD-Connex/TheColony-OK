import { describe, test, expect } from "vitest";
import { getMembership, isActiveMember, type Membership } from "./entitlements";

// We test the fast-paths and the NO_MEMBERSHIP shape without hitting Supabase.

describe("entitlements (fast paths)", () => {
  test("getMembership(null) returns NO_MEMBERSHIP shape", async () => {
    const m: Membership = await getMembership(null);
    expect(m.isMember).toBe(false);
    expect(m.role).toBe("member");
    expect(m.status).toBeNull();
  });

  test("isActiveMember(undefined) is false", async () => {
    expect(await isActiveMember(undefined)).toBe(false);
  });

  // Note: real active cases require a members row + stripe sync; covered by integration or e2e.
  // The lib is intentionally a thin reader of the members table written by the webhook.
});
