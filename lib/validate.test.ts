import { describe, it, expect } from "vitest";
import { isEmail } from "./validate";

describe("isEmail", () => {
  it("accepts normal addresses", () => {
    expect(isEmail("jane@example.com")).toBe(true);
    expect(isEmail("a.b+tag@sub.domain.co")).toBe(true);
  });
  it("rejects malformed", () => {
    expect(isEmail("")).toBe(false);
    expect(isEmail(null)).toBe(false);
    expect(isEmail("noatsign")).toBe(false);
    expect(isEmail("@nolocal.com")).toBe(false);
    expect(isEmail("two@@at.com")).toBe(false);
    expect(isEmail("nodot@domain")).toBe(false);
    expect(isEmail("trailing@dot.")).toBe(false);
    expect(isEmail("has space@x.com")).toBe(false);
  });
  it("rejects over-long input without catastrophic backtracking", () => {
    // a ReDoS-prone regex would hang here; linear check returns fast.
    const evil = "a".repeat(50000) + "@";
    expect(isEmail(evil)).toBe(false);
  });
});
