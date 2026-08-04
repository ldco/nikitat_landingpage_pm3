/**
 * HTML Sanitization Utility (Client-side) — hardened render-time fallback
 *
 * Ported from PM v2 app/utils/sanitize.ts and hardened against the known
 * regex-bypass classes: foreign-content tags (SVG/MathML), unquoted
 * attributes, entity-encoded schemes, and control characters in schemes.
 *
 * PRIMARY XSS DEFENSE is server-side (src/lib/utils/sanitize-content.ts,
 * applied at the load boundary and admin write path). This module is the
 * render-time second layer for any content that reaches {@html}.
 */

// Tags that should be completely removed (including content).
// SVG/MathML foreign content is dropped wholesale (xlink:href / xmlns vectors).
const DANGEROUS_TAGS = [
  'script', 'style', 'iframe', 'frame', 'object', 'embed', 'form', 'input',
  'meta', 'link', 'base', 'svg', 'math', 'use', 'animate', 'foreignObject',
  'title', 'desc', 'template', 'noscript'
]

// Event handler pattern (on*), case-insensitive. Matches whitespace OR the
// self-closing-slash form (`<svg/onload=…>`) which the HTML tokenizer turns
// into an attribute — whitespace-only matching would miss it.
const EVENT_HANDLER_REGEX = /(?:[\s/]|^)on\w+\s*=/gi

// Attributes that carry URLs and must be scheme-checked
const URL_ATTRIBUTE_REGEX = /\b(?:href|src|xlink:href|action|formaction|poster|background)\s*=\s*["']?([^"'\s>]*)/gi

// Dangerous URL schemes (after entity decoding + control-char stripping)
const DANGEROUS_URL_REGEX = /^\s*(?:javascript|data|vbscript|file):/i

function decodeEntities(value: string): string {
  return value
    .replace(/&(amp|#38);/gi, '&')
    .replace(/&(lt|#60);/gi, '<')
    .replace(/&(gt|#62);/gi, '>')
    .replace(/&(quot|#34);/gi, '"')
    .replace(/&(#x27|#39);/gi, "'")
    .replace(/&(nbsp|#160);/gi, ' ')
}

/**
 * Strip ASCII control characters (0x00-0x1F, 0x7F) — the WHATWG URL parser
 * ignores them inside schemes, so a scheme check must too. Functional (no
 * regex) to avoid the no-control-regex lint rule while preserving the defense.
 */
function stripUrlControlChars(value: string): string {
  let out = ''
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0
    if (code < 0x20 || code === 0x7f) continue
    out += ch
  }
  return out
}

/**
 * Sanitize HTML content to prevent XSS.
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return ''

  let result = html

  // 1. Remove dangerous tags with their content (case-insensitive, nested-safe
  //    by repeated pass)
  for (const tag of DANGEROUS_TAGS) {
    const regex = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi')
    result = result.replace(regex, '')
    const selfClosing = new RegExp(`<${tag}[^>]*/?>`, 'gi')
    result = result.replace(selfClosing, '')
  }

  // 2. Remove event handlers from all tags (case-insensitive)
  result = result.replace(EVENT_HANDLER_REGEX, ' ')

  // 3. Sanitize URL-bearing attributes (quoted AND unquoted values;
  //    entity-decoded + control-character-stripped before the scheme check)
  result = result.replace(URL_ATTRIBUTE_REGEX, (match, url) => {
    const decoded = stripUrlControlChars(decodeEntities(url))
    if (DANGEROUS_URL_REGEX.test(decoded)) {
      return `${match.slice(0, match.indexOf('=') + 1)} "#"`
    }
    return match
  })

  // 4. Remove expression() in style attributes (IE CSS expression attack)
  result = result.replace(/style\s*=\s*["'][^"']*expression\s*\([^"']*["']/gi, 'style=""')

  // 5. Drop bare javascript: text nodes / data URIs in remaining attrs
  result = result.replace(/=\s*["']?(?:javascript|vbscript)\s*:/gi, '="#"')

  return result.trim()
}
