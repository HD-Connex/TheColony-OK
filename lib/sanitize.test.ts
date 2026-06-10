import { describe, test, expect } from "vitest";
import { sanitizeHtml, stripHtml } from "./sanitize";

describe("sanitize", () => {
  test("sanitizeHtml strips scripts and event handlers, keeps allowlist", () => {
    const dirty = `<p onclick="alert(1)">ok</p><script>evil()</script><a href="https://x.com">link</a><img src="x" onerror="x">`;
    const out = sanitizeHtml(dirty);
    expect(out).toContain("<p>ok</p>");
    expect(out).toContain('<a href="https://x.com">link</a>');
    expect(out).not.toContain("script");
    expect(out).not.toContain("onclick");
    expect(out).not.toContain("onerror");
    expect(out).not.toContain("<img");
  });

  test("stripHtml removes all tags and collapses whitespace", () => {
    const html = "<h2>Title</h2><p>Body with <strong>bold</strong> and <a href='#'>link</a>.</p>";
    const out = stripHtml(html);
    // Tags removed; adjacent text nodes may concatenate (acceptable for meta/preview use).
    expect(out).toMatch(/Title.*Body with bold and link\./);
  });

  test("empty input yields empty string", () => {
    expect(sanitizeHtml(null as any)).toBe("");
    expect(stripHtml(undefined as any)).toBe("");
  });
});
