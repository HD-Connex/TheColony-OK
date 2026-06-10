// HTML sanitization for untrusted content (RSS descriptions, user-generated text).
// Single chokepoint: every dangerouslySetInnerHTML of non-static content must pass
// through sanitizeHtml(). Allowlist is intentionally tight — podcast/article body
// formatting only, no scripts, no event handlers, no styles.

import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p", "a", "strong", "b", "em", "i", "u", "ul", "ol", "li", "br",
  "blockquote", "h2", "h3", "h4", "code", "pre", "span",
];

const ALLOWED_ATTR = ["href", "title", "rel", "target"];

/** Sanitize untrusted HTML for safe rendering. Strips scripts, handlers, iframes. */
export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return "";
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    // force safe link behavior
    ADD_ATTR: [],
  });
}

/** Strip all HTML — for meta descriptions, previews, plain-text contexts. */
export function stripHtml(input: string | null | undefined): string {
  if (!input) return "";
  const noTags = DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
    .replace(/>\s*</g, "> <") // ensure separation when tags were adjacent blocks
    .replace(/\s+/g, " ")
    .trim();
  return noTags;
}
