import sanitizeHtmlLib from "sanitize-html";

const ALLOWED_TAGS = [
  "p", "a", "strong", "b", "em", "i", "u", "ul", "ol", "li", "br",
  "blockquote", "h2", "h3", "h4", "code", "pre", "span",
];

export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return "";
  return sanitizeHtmlLib(input, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "title", "rel", "target"],
    },
  });
}

export function stripHtml(input: string | null | undefined): string {
  if (!input) return "";
  return sanitizeHtmlLib(input, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/\s+/g, " ")
    .trim();
}
