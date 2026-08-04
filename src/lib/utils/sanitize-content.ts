/**
 * Server-side HTML content sanitizer (root-cause XSS defense)
 *
 * Sanitizes DB-resident content at the point where it can become HTML.
 * Applied in +layout.server.ts (load boundary).
 *
 * IMPORTANT: sanitize-html re-escapes text nodes (& → &amp;, < → &lt;).
 * Plain-text values are rendered via Svelte text interpolation, which escapes
 * a second time — running sanitize-html on them would double-encode (the site
 * would display literal `&amp;`). Therefore only values carrying actual
 * markup — a literal tag or entity-encoded markup (`&lt;`) — are sanitized;
 * plain text passes through unchanged.
 */
import sanitizeHtml from 'sanitize-html'

const CONTENT_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ['a', 'p', 'br', 'strong', 'em', 'b', 'i', 'ul', 'ol', 'li', 'span', 'h3', 'h4'],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    p: ['class'],
    span: ['class']
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowProtocolRelative: false,
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' })
  }
}

/** True when the value could carry markup. Catches literal tags AND
 * entity-encoded markup (`&lt;…&gt;`) — the HTML parser decodes entities when
 * the value reaches a `{@html}` sink, so a guard that only checks `<` would
 * let `&lt;svg/onload=…&gt;` through and execute stored event handlers. */
function isHtmlLike(value: string): boolean {
  return value.includes('<') || /&(?:lt|#60|#x3c);/i.test(value)
}

/** Sanitize a single content value (plain text is preserved verbatim). */
export function sanitizeContent(value: string): string {
  if (!isHtmlLike(value)) return value
  return sanitizeHtml(value, CONTENT_SANITIZE_OPTIONS)
}

/** Sanitize a content-translations map; only HTML-like values are touched. */
export function sanitizeContentMap(map: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(map)) {
    out[key] = sanitizeContent(value)
  }
  return out
}
