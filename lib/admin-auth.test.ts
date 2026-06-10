import { describe, test, expect } from "vitest";
import { safeCompare } from "./safe-compare";

describe("safeCompare (timing-safe)", () => {
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
