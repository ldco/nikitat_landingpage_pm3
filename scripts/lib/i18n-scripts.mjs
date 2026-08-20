/**
 * Framework-level i18n script validation — language-agnostic.
 *
 * These helpers detect "wrong-language" translation values WITHOUT knowing
 * the project's language set. They work for ANY locales a project configures
 * (ru/en/fr/he here, but also ar, ja, zh, de, pl, …) by comparing the SCRIPT
 * of a value against the script its locale requires. The checks they power
 * (pm3-validator check #14 and scripts/validate-system-seed.ts) stay
 * framework-level: no per-language hardcoding, no project imports.
 *
 * Detected failure modes:
 *   1. Wrong-language text — a value whose dominant script is not the script
 *      of its locale (French/Latin copy pasted into a Hebrew row, English into
 *      Russian, Russian into English/French, …). Short values (default
 *      minLetters = 25) are skipped — proper nouns and brand names legitimately
 *      stay in their original script. Code-like tokens (dotted i18n keys,
 *      snake/kebab identifiers, tag:name references, {placeholders}, masks
 *      like G-XXXXXXXX) are stripped BEFORE the script counts run so technical
 *      copy that embeds keys is never flagged. Latin-dominant values keep a
 *      high lenience (default latinLenience = 0.15): a correctly translated
 *      sentence full of brand names ("Google Analytics", "Facebook Pixel") is
 *      native text, not wrong-language copy — only near-total Latin dominance
 *      is flagged. Distinctive non-Latin foreign scripts (Cyrillic in Hebrew,
 *      Hebrew in Russian, …) are judged strictly (minExpectedRatio = 0.5).
 *      Values that intentionally mix scripts are exempted per-key via
 *      scripts/i18n-script-allowlist.json.
 *   2. Raw keys — covered by the callers (validate-system-seed.ts compares the
 *      value against the dotted/underscore key forms; pm3-validator does the
 *      same case-insensitively for every locale row in the translations table).
 *
 * Unicode note: JS regex supports \p{Script=<name>} for the individual script
 * values only — the composite ISO 15924 tags (Jpan, Hans, Hant, Kore) are NOT
 * valid property names, so SCRIPT_TAG_TO_NAMES expands them to their member
 * scripts (Japanese = Han + Hiragana + Katakana, Chinese = Han, …).
 */

import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const SCRIPT_ALLOWLIST_PATH = join(ROOT, 'scripts', 'i18n-script-allowlist.json')

/** Unicode Script property names this framework can distinguish. */
const SCRIPT_PATTERNS = {
  Latin: /[\p{Script=Latin}]/gu,
  Cyrillic: /[\p{Script=Cyrillic}]/gu,
  Hebrew: /[\p{Script=Hebrew}]/gu,
  Arabic: /[\p{Script=Arabic}]/gu,
  Greek: /[\p{Script=Greek}]/gu,
  Armenian: /[\p{Script=Armenian}]/gu,
  Georgian: /[\p{Script=Georgian}]/gu,
  Ethiopic: /[\p{Script=Ethiopic}]/gu,
  Han: /[\p{Script=Han}]/gu,
  Hiragana: /[\p{Script=Hiragana}]/gu,
  Katakana: /[\p{Script=Katakana}]/gu,
  Hangul: /[\p{Script=Hangul}]/gu,
  Devanagari: /[\p{Script=Devanagari}]/gu,
  Bengali: /[\p{Script=Bengali}]/gu,
  Gurmukhi: /[\p{Script=Gurmukhi}]/gu,
  Gujarati: /[\p{Script=Gujarati}]/gu,
  Oriya: /[\p{Script=Oriya}]/gu,
  Tamil: /[\p{Script=Tamil}]/gu,
  Telugu: /[\p{Script=Telugu}]/gu,
  Kannada: /[\p{Script=Kannada}]/gu,
  Malayalam: /[\p{Script=Malayalam}]/gu,
  Sinhala: /[\p{Script=Sinhala}]/gu,
  Thai: /[\p{Script=Thai}]/gu,
  Lao: /[\p{Script=Lao}]/gu,
  Tibetan: /[\p{Script=Tibetan}]/gu,
  Myanmar: /[\p{Script=Myanmar}]/gu,
  Khmer: /[\p{Script=Khmer}]/gu,
  Mongolian: /[\p{Script=Mongolian}]/gu,
  Syriac: /[\p{Script=Syriac}]/gu,
  Thaana: /[\p{Script=Thaana}]/gu,
  Coptic: /[\p{Script=Coptic}]/gu,
  Cherokee: /[\p{Script=Cherokee}]/gu,
  Canadian_Aboriginal: /[\p{Script=Canadian_Aboriginal}]/gu,
  Tifinagh: /[\p{Script=Tifinagh}]/gu,
  Vai: /[\p{Script=Vai}]/gu,
  Yi: /[\p{Script=Yi}]/gu,
}

/**
 * ISO 15924 script tags (as produced by Intl.Locale#maximize) → the Unicode
 * Script property names used by SCRIPT_PATTERNS. Composite tags are expanded:
 * Japanese text mixes Han + Hiragana + Katakana, Korean Hanja mixes Hangul +
 * Han, Chinese is Han in its simplified/traditional forms.
 */
const SCRIPT_TAG_TO_NAMES = {
  Latn: ['Latin'],
  Cyrl: ['Cyrillic'],
  Hebr: ['Hebrew'],
  Arab: ['Arabic'],
  Grek: ['Greek'],
  Armn: ['Armenian'],
  Geor: ['Georgian'],
  Ethi: ['Ethiopic'],
  Hani: ['Han'],
  Hira: ['Hiragana'],
  Kana: ['Katakana'],
  Hang: ['Hangul'],
  Jpan: ['Han', 'Hiragana', 'Katakana'],
  Hans: ['Han'],
  Hant: ['Han'],
  Kore: ['Hangul', 'Han'],
  Deva: ['Devanagari'],
  Beng: ['Bengali'],
  Guru: ['Gurmukhi'],
  Gujr: ['Gujarati'],
  Orya: ['Oriya'],
  Taml: ['Tamil'],
  Telu: ['Telugu'],
  Knda: ['Kannada'],
  Mlym: ['Malayalam'],
  Sinh: ['Sinhala'],
  Thai: ['Thai'],
  Laoo: ['Lao'],
  Tibt: ['Tibetan'],
  Mymr: ['Myanmar'],
  Khmr: ['Khmer'],
  Mong: ['Mongolian'],
  Syrc: ['Syriac'],
  Thaa: ['Thaana'],
  Copt: ['Coptic'],
  Cher: ['Cherokee'],
  Cans: ['Canadian_Aboriginal'],
  Tfng: ['Tifinagh'],
  Vaii: ['Vai'],
  Yiii: ['Yi']
}

/**
 * Token shapes that are NOT translatable text — stripped before the script
 * counts run so technical copy embedding keys/identifiers is never flagged:
 * dotted i18n keys (hero.title), snake/kebab identifiers, tag:name references
 * (tabler:star), {placeholders}, URLs, and masks (G-XXXXXXXX).
 */
const CODE_TOKEN_PATTERNS = [
  /https?:\/\/\S+/gi,
  /\b[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)+\b/gi,
  /\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/gi,
  /\b[a-z][a-z0-9]*(?:-[a-z0-9]+)+\b/gi,
  /\b[a-z][a-z0-9]*:[a-z0-9_-]+\b/gi,
  /\{[a-zA-Z0-9_]+\}/g,
  /\b[A-Z]-[A-Z0-9X-]{2,}\b/g
]

/** Memoized Intl.Locale#maximize results — the locale set is small and fixed. */
const scriptTagCache = new Map()

/** The canonical scripts (Unicode Script names) expected for a locale tag. */
export function expectedScripts(locale) {
  if (!locale) return []
  if (scriptTagCache.has(locale)) return scriptTagCache.get(locale)
  let scripts = []
  try {
    const tag = new Intl.Locale(locale).maximize().script
    if (tag) scripts = SCRIPT_TAG_TO_NAMES[tag] ?? []
  } catch {
    scripts = []
  }
  scriptTagCache.set(locale, scripts)
  return scripts
}

/** Per-script letter counts for a value (only the tracked scripts). */
export function scriptCounts(text) {
  const counts = {}
  for (const [name, re] of Object.entries(SCRIPT_PATTERNS)) {
    const n = (text.match(re) ?? []).length
    if (n > 0) counts[name] = n
  }
  return counts
}

/** The script with the most letters in a value, or null when none match. */
export function dominantScript(text) {
  const counts = scriptCounts(text)
  let best = null
  let bestCount = 0
  for (const [name, count] of Object.entries(counts)) {
    if (count > bestCount) {
      best = name
      bestCount = count
    }
  }
  return best
}

/**
 * Raw-key placeholder check: a value that equals its key (dotted or
 * underscore-export form), case-insensitive after trimming, renders the key
 * instead of text at runtime. Single shared implementation so the catalog
 * validator and the pm3-validator DB check can never drift.
 */
export function isRawKeyValue(key, value) {
  if (typeof key !== 'string' || typeof value !== 'string') return false
  const keyLower = key.toLowerCase()
  const valueLower = value.trim().toLowerCase()
  return (
    valueLower !== '' &&
    (valueLower === keyLower || valueLower === keyLower.replace(/\./g, '_'))
  )
}

/** Remove code-like tokens from a value, leaving only prose for script counts. */
export function stripCodeTokens(text) {
  let out = text
  for (const re of CODE_TOKEN_PATTERNS) {
    out = out.replace(re, ' ')
  }
  return out
}

/**
 * Detect a wrong-language value: the dominant script of the (token-stripped)
 * value is not the script its locale requires. Returns a human-readable reason
 * or null when the value is fine (or too short to judge).
 *
 * @param locale     BCP-47 locale tag (he, ru, en-US, …)
 * @param text       the translation value
 * @param opts.minLetters          minimum tracked letters before judging
 *                                 (default 25 — short values are proper nouns)
 * @param opts.minExpectedRatio    minimum share of expected-script letters
 *                                 (default 0.5 — majority rule)
 */
export function scriptMismatch(
  locale,
  text,
  { minLetters = 25, minExpectedRatio = 0.5, latinLenience = 0.15 } = {}
) {
  if (typeof text !== 'string' || text.trim() === '') return null
  // Cheap gate BEFORE the regex scans: values shorter than minLetters can
  // never produce a mismatch (the strict per-letter count runs below).
  if (text.length < minLetters) return null
  const expected = expectedScripts(locale)
  if (expected.length === 0) return null

  const stripped = stripCodeTokens(text)
  const counts = scriptCounts(stripped)
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0)
  if (total < minLetters) return null

  const expectedCount = expected.reduce((sum, name) => sum + (counts[name] ?? 0), 0)
  const expectedRatio = expectedCount / total
  if (expectedRatio >= minExpectedRatio) return null

  const dominant = dominantScript(stripped)
  const expectedLabel = expected.join('/')
  // Latin is the universal embedding script for brand and tech terms — a
  // value that still carries a substantial native share is native text with
  // foreign names, NOT wrong-language copy. Only near-total Latin dominance
  // (>= 85% foreign) counts as wrong-language. Distinctive non-Latin foreign
  // scripts (Cyrillic in Hebrew, Hebrew in Russian, Arabic in Latin, …) are
  // judged at the strict minExpectedRatio.
  if (dominant === 'Latin' && expectedRatio >= latinLenience) return null

  if (expectedCount === 0) {
    return `${dominant ?? 'foreign'}-script text in the ${locale} locale (expected ${expectedLabel} script) — wrong-language copy`
  }
  const foreignShare = Math.round(((total - expectedCount) / total) * 100)
  return `${dominant ?? 'foreign'}-dominant text in the ${locale} locale (expected ${expectedLabel} script) — ${foreignShare}% of letters are in the wrong script`
}

/**
 * Load the per-key script allowlist (scripts/i18n-script-allowlist.json):
 * dotted keys whose values intentionally mix scripts (technical copy with
 * embedded English terms). The CHECK stays framework-level — this file only
 * records the project's deliberate exceptions.
 */
export function loadScriptAllowlist() {
  if (!existsSync(SCRIPT_ALLOWLIST_PATH)) return new Set()
  const raw = JSON.parse(readFileSync(SCRIPT_ALLOWLIST_PATH, 'utf-8'))
  if (!Array.isArray(raw)) return new Set()
  return new Set(raw.filter((k) => typeof k === 'string'))
}
