/**
 * Lightweight allowlist sanitizer for landing-page rich text.
 * Avoids isomorphic-dompurify/jsdom, which often crashes on serverless.
 */

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "blockquote",
]);

function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Sanitize landing-page rich HTML before save/render. */
export function sanitizeLandingHtml(html: string): string {
  if (!html) return "";

  // Drop scripts/styles entirely.
  let value = html
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style)[^>]*\/?\s*>/gi, "");

  // Remove event handlers and javascript: URLs.
  value = value
    .replace(/\son\w+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "")
    .replace(/\s(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, "");

  // Strip disallowed tags; keep allowed tags without attributes.
  value = value.replace(
    /<\/?([a-zA-Z0-9]+)(\s[^>]*)?>/g,
    (match, rawTag: string) => {
      const tag = rawTag.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) return "";
      if (match.startsWith("</")) return `</${tag}>`;
      if (tag === "br") return "<br />";
      return `<${tag}>`;
    }
  );

  return value.trim();
}

export function paragraphsToHtml(paragraphs: string[]): string {
  return paragraphs.map((p) => `<p>${escapeText(p)}</p>`).join("");
}
