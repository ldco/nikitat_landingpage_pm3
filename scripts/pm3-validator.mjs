#!/usr/bin/env node

/**
 * PM3 Framework Validator
 *
 * The single source of truth for PM3 style-system enforcement (see
 * docs/traycer/PM3_Bulletproof_Style_System_—_Tokens-Only_CSS_Architecture.md).
 *
 * Checks (each maps to a framework rule):
 *  1. No duplicate token definitions inside @theme blocks (Rule A.1).
 *  2. No NEW token-bridge or component-visual @utility additions. The ONLY
 *     permitted @utility blocks are the browser-fix exceptions min-h-dvh and
 *     backdrop-blur-glass, each carrying a justification comment (Rule A.2).
 *  3. No unjustified @layer components additions — every entry must have an
 *     inline "why inline is impossible" comment (Rule A.2).
 *  4. No forbidden arbitrary bracket values — bracket syntax must reference
 *     tokens (var(--...)) or safe viewport math; literal colors/px/rem/%/ch
 *     inside [] are forbidden (Rule A.1).
 *  5. No literal-value duplication appearing 2+ times inline in a component
 *     (signal to promote to a named token).
 *  6. No canonical-primitive bypass — hand-rolled button/container/section
 *     heading/card class bundles are rejected when a canonical primitive exists.
 *  7. No type suppressions (`@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`)
 *     and no non-null assertions (`!`) in source files (Rule D.12).
 *  8. No empty catch blocks — every catch must log, re-throw, or return a typed
 *     error (Rule D.13).
 *  9. Missing Zod validation on API routes (files named `+server.ts` under
 *     `src/routes/api/`) — every POST/PUT/PATCH handler must import and use
 *     zod (Rule C.10).
 * 10. NEW user-facing string literals in framework/project UI files (`.svelte`
 *     under `src/` and `src/app.html`) — every visible string must come from
 *     the i18n layer (`t()`/`m.*()`). The current literal inventory is frozen
 *     in `scripts/i18n-literal-baseline.json`; any literal NOT already in the
 *     baseline fails the build (Rule: no untranslated regressions).
 *
 * Allowed exceptions (documented in docs/contributing/i18n-literals-policy.md):
 *   - strings with no letters (numbers/punctuation only): '9+', '?', '×'
 *   - single-character initials / brand letters: 'P'
 *   - i18n keys and identifiers: 'admin.dashboard', 'pm-session'
 *   - SvelteKit template placeholders: %sveltekit.body%
 *   - explicit fallback values passed as the 2nd arg of t('key', 'Fallback')
 *     (kept for proper nouns; everything else must be a key)
 *
 * Usage:
 *   node scripts/pm3-validator.mjs                 # check whole repo
 *   node scripts/pm3-validator.mjs <file> [...]    # check specific files
 *   node scripts/pm3-validator.mjs --update-baseline   # freeze current inventory
 *
 * Exit codes: 0 = clean, 1 = violations found.
 */

import { readFileSync, readdirSync, existsSync, writeFileSync } from 'fs'
import { resolve, dirname, relative } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const APP_CSS = resolve(ROOT, 'src', 'app.css')
const THEME_CSS = resolve(ROOT, 'src', 'project', 'theme.css')
const APP_HTML = resolve(ROOT, 'src', 'app.html')
const LITERAL_BASELINE = resolve(ROOT, 'scripts', 'i18n-literal-baseline.json')

/**
 * Approved TypeScript config surfaces that feed UI output (visible labels in
 * project config). String literals in these files are scanned like UI text:
 * any NEW label-like literal fails. Add a project-layer config file here when
 * it starts feeding visible strings (see docs/contributing/i18n-literals-policy.md).
 */
const TS_CONFIG_SCAN_FILES = [
  'src/project/site-config.ts'
]

/** The only @utility blocks permitted (browser-fix exceptions, Rule A.2). */
const ALLOWED_UTILITIES = new Set(['min-h-dvh', 'backdrop-blur-glass'])

/** @layer components entries must reference one of these infra purposes in a comment. */
const COMPONENT_INFRA_KEYWORDS = [
  'browser', 'webkit', 'prefix', 'keyframe', 'page transition', 'view-transition',
  'hamburger', 'pseudo', 'infra', 'cannot be', 'can\'t be', 'not possible'
]

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

function walk(dir, files) {
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name.startsWith('.')) continue
      walk(full, files)
    } else if (entry.name.endsWith('.svelte')) {
      files.push(full)
    }
  }
}

function readFile(file) {
  return readFileSync(file, 'utf8')
}

function collectFiles(args) {
  if (args.length > 0) {
    return args.map((f) => resolve(ROOT, f)).filter((f) => existsSync(f))
  }
  const files = [APP_CSS, THEME_CSS, APP_HTML, ...TS_CONFIG_SCAN_FILES.map((f) => resolve(ROOT, f))]
  walk(resolve(ROOT, 'src'), files)
  return [...new Set(files)]
}

function lineAt(content, index) {
  return content.slice(0, index).split('\n').length
}

/** Extract every class attribute value (double-quoted or template literal), skipping comments. */
function extractClassValues(content) {
  // Mask out comment blocks so JSDoc examples are not scanned
  const masked = content
    .replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, ' '))
    .replace(/<!--[\s\S]*?-->/g, (match) => match.replace(/[^\n]/g, ' '))
  const values = []
  const re = /class\s*=\s*(?:"([^"]*)"|`([^`]*)`)/g
  let m
  while ((m = re.exec(masked)) !== null) {
    values.push({ value: m[1] ?? m[2] ?? '', index: m.index })
  }
  return values
}

// ═══════════════════════════════════════════════════════════════════════════
// Check 1: duplicate tokens inside @theme blocks
// ═══════════════════════════════════════════════════════════════════════════

function checkDuplicateTokens() {
  const issues = []
  for (const file of [APP_CSS, THEME_CSS]) {
    if (!existsSync(file)) continue
    const content = readFile(file)
    const themeRe = /@theme\s*\{([\s\S]*?)\}/g
    let tm
    while ((tm = themeRe.exec(content)) !== null) {
      const body = tm[1]
      const seen = new Map()
      const declRe = /(--[a-zA-Z0-9_-]+)\s*:/g
      let d
      while ((d = declRe.exec(body)) !== null) {
        const line = lineAt(content, tm.index) + lineAt(body, d.index) - 1
        if (seen.has(d[1])) {
          issues.push({
            file: relative(ROOT, file),
            line,
            message: `Duplicate token definition: ${d[1]} (first declared at line ${seen.get(d[1])})`
          })
        } else {
          seen.set(d[1], line)
        }
      }
    }
  }
  return issues
}

// ═══════════════════════════════════════════════════════════════════════════
// Check 2: disallowed @utility additions
// ═══════════════════════════════════════════════════════════════════════════

function checkUtilities() {
  const issues = []
  if (!existsSync(APP_CSS)) return issues
  const content = readFile(APP_CSS)
  const re = /@utility\s+([a-zA-Z0-9_-]+)\s*\{/g
  let m
  while ((m = re.exec(content)) !== null) {
    const name = m[1]
    if (ALLOWED_UTILITIES.has(name)) {
      const commentStart = content.lastIndexOf('/*', m.index)
      const comment = commentStart === -1 ? '' : content.slice(commentStart, m.index)
      if (!/browser|webkit|fallback|prefix/i.test(comment)) {
        issues.push({
          file: relative(ROOT, APP_CSS),
          line: lineAt(content, m.index),
          message: `@utility ${name} is missing a "why inline is impossible" justification comment`
        })
      }
    } else {
      issues.push({
        file: relative(ROOT, APP_CSS),
        line: lineAt(content, m.index),
        message: `New @utility "${name}" is disallowed — token bridges and component visuals must be Svelte components or direct token references (Rule A.2)`
      })
    }
  }
  return issues
}

// ═══════════════════════════════════════════════════════════════════════════
// Check 3: unjustified @layer components additions
// ═══════════════════════════════════════════════════════════════════════════

function checkLayerComponents() {
  const issues = []
  if (!existsSync(APP_CSS)) return issues
  const content = readFile(APP_CSS)
  const layerRe = /@layer\s+components\s*\{([\s\S]*?)\n\}/g
  let layerMatch
  while ((layerMatch = layerRe.exec(content)) !== null) {
    const body = layerMatch[1]
    // A layer-level justification comment (at the top of the layer) covers the whole block.
    const layerHeaderComment = body.slice(0, body.indexOf('{') === -1 ? 0 : body.indexOf('{'))
    const hasLayerJustification = COMPONENT_INFRA_KEYWORDS.some((kw) => layerHeaderComment.toLowerCase().includes(kw))
    if (hasLayerJustification) continue

    const ruleRe = /^([ \t]*)(\.[a-zA-Z0-9_-]+[^{]*?)\{/gm
    let ruleMatch
    while ((ruleMatch = ruleRe.exec(body)) !== null) {
      const commentStart = body.lastIndexOf('/*', ruleMatch.index)
      const comment = commentStart === -1 ? '' : body.slice(commentStart, ruleMatch.index)
      const hasJustification = COMPONENT_INFRA_KEYWORDS.some((kw) => comment.toLowerCase().includes(kw))
      if (!hasJustification) {
        issues.push({
          file: relative(ROOT, APP_CSS),
          line: lineAt(content, layerMatch.index) + lineAt(body, ruleMatch.index) - 1,
          message: `@layer components rule ${ruleMatch[2].trim()} has no "why inline is impossible" justification comment`
        })
      }
    }
  }
  return issues
}

// ═══════════════════════════════════════════════════════════════════════════
// Check 4: forbidden arbitrary bracket values in class attributes
// ═══════════════════════════════════════════════════════════════════════════

const FORBIDDEN_BRACKET = /\b[a-z-]+-\[([^\]]*)\]/g

function isAllowedBracketValue(value) {
  const trimmed = value.trim()
  if (!trimmed) return false
  // Strip all var(--x) references (with or without fallback)
  const stripped = trimmed.replace(/var\(\s*--[\w-]+\s*(?:,[^)]*)?\)/g, '__T__')
  // Reject literal colors
  if (/#[0-9a-fA-F]{3,8}\b/.test(trimmed)) return false
  if (/\b(?:white|black|red|blue|green|transparent)\b/i.test(trimmed)) return false
  // Reject literal px/rem/%/ch values not inside a var() (already stripped)
  if (/(^|[^-\w])\d+(?:\.\d+)?(?:px|rem|%|ch)\b/.test(stripped)) return false
  // Strip safe viewport/relative units and math operators; leftover must be empty
  const rest = stripped
    .replace(/\b\d+(?:\.\d+)?(?:vw|vh|dvh|svh|lvh|em)\b/g, '')
    .replace(/[()+\-*/%.,\s]/g, '')
    .replace(/__T__/g, '')
  return rest.trim() === ''
}

function checkBracketValues(file) {
  const issues = []
  const content = readFile(file)
  for (const { value, index } of extractClassValues(content)) {
    let bm
    while ((bm = FORBIDDEN_BRACKET.exec(value)) !== null) {
      const inner = bm[1]
      if (!isAllowedBracketValue(inner)) {
        issues.push({
          file: relative(ROOT, file),
          line: lineAt(content, index),
          message: `Forbidden arbitrary bracket value [${inner}] in "${bm[0]}" — must reference a design token (Rule A.1)`
        })
      }
    }
  }
  return issues
}

// ═══════════════════════════════════════════════════════════════════════════
// Check 5: literal-value duplication (2+ identical literals in one file)
// ═══════════════════════════════════════════════════════════════════════════

const LITERAL_RE = /\[(?:[0-9.]+(?:px|rem|em|%|ch|vw|vh)|#[0-9a-fA-F]{3,8}|rgb\([^)]*\)|rgba\([^)]*\))\]/g

function checkLiteralDuplication(file) {
  const issues = []
  const content = readFile(file)
  const counts = new Map()
  let m
  while ((m = LITERAL_RE.exec(content)) !== null) {
    counts.set(m[0], (counts.get(m[0]) ?? 0) + 1)
  }
  for (const [lit, count] of counts) {
    if (count >= 2) {
      issues.push({
        file: relative(ROOT, file),
        message: `Literal value ${lit} appears ${count} times — promote to a named design token (Rule A.1)`
      })
    }
  }
  return issues
}

// ═══════════════════════════════════════════════════════════════════════════
// Check 6: canonical-primitive bypass (linear token checks per class value)
// ═══════════════════════════════════════════════════════════════════════════

function checkPrimitiveBypass(file) {
  const issues = []
  const content = readFile(file)
  for (const { value, index } of extractClassValues(content)) {
    const tokens = value.split(/\s+/)
    const has = (s) => tokens.some((t) => t.includes(s))

    const isButton = has('inline-flex') && (has('rounded-md') || has('rounded-lg')) && has('bg-pm-brand')
    if (isButton) {
      issues.push({
        file: relative(ROOT, file),
        line: lineAt(content, index),
        message: 'Canonical-primitive bypass: hand-rolled button classes — use <CtaButton>'
      })
    }

    const isContainer = has('max-w-[var(--max-w-container)]') && has('mx-auto') && has('px-[var(--px-container)]')
    if (isContainer) {
      issues.push({
        file: relative(ROOT, file),
        line: lineAt(content, index),
        message: 'Canonical-primitive bypass: hand-rolled container classes — use <Container> or <SectionContent>'
      })
    }

    const isSectionHeading = has('text-[var(--heading-') && has('font-black')
    if (isSectionHeading) {
      issues.push({
        file: relative(ROOT, file),
        line: lineAt(content, index),
        message: 'Canonical-primitive bypass: hand-rolled section heading — use <SectionHeading>'
      })
    }
  }
  return issues
}

// ═══════════════════════════════════════════════════════════════════════════
// Check 7: type suppressions + non-null assertions
// ═══════════════════════════════════════════════════════════════════════════

function checkTypeSuppressions(file) {
  const issues = []
  const content = readFile(file)
  // Only flag the unambiguous comment-based suppressions here; non-null
  // assertions are already enforced by eslint (no-non-null-assertion + the
  // --max-warnings=0 lint-staged task).
  const re = /@ts-(?:ignore|expect-error|nocheck)\b/g
  let m
  while ((m = re.exec(content)) !== null) {
    issues.push({
      file: relative(ROOT, file),
      line: lineAt(content, m.index),
      message: `Type suppression detected: ${m[0]} — type suppressions are FORBIDDEN (Rule D.12)`
    })
  }
  return issues
}

// ═══════════════════════════════════════════════════════════════════════════
// Check 8: empty catch blocks
// ═══════════════════════════════════════════════════════════════════════════

function checkEmptyCatches(file) {
  const issues = []
  const content = readFile(file)
  // catch { } / catch (e) { } with nothing but whitespace/comments inside
  const re = /catch\s*(?:\([^)]*\))?\s*\{\s*(\/\/[^\n]*\n)?\s*\}/g
  let m
  while ((m = re.exec(content)) !== null) {
    issues.push({
      file: relative(ROOT, file),
      line: lineAt(content, m.index),
      message: 'Empty catch block — every catch must log, re-throw with context, or return a typed error (Rule D.13)'
    })
  }
  return issues
}

// ═══════════════════════════════════════════════════════════════════════════
// Check 9: missing Zod validation on API routes
// ═══════════════════════════════════════════════════════════════════════════

function checkApiZod(file) {
  const issues = []
  if (!/\+server\.ts$/.test(file)) return issues
  const content = readFile(file)
  const hasZodImport = /\bfrom\s*['"]zod['"]/.test(content)
  const hasMutation = /\b(POST|PUT|PATCH|DELETE)\s*\(/.test(content)
  if (hasMutation && !hasZodImport) {
    issues.push({
      file: relative(ROOT, file),
      message: 'API route with mutation handler is missing Zod validation — every POST/PUT/PATCH/DELETE endpoint must validate input with Zod (Rule C.10)'
    })
  }
  return issues
}

// ═══════════════════════════════════════════════════════════════════════════
// Check 10: NEW user-facing string literals in UI files (i18n guardrail)
// ═══════════════════════════════════════════════════════════════════════════

/** SvelteKit template placeholders (%sveltekit.body%) are not literals. */
const TEMPLATE_PLACEHOLDER_RE = /^%.+%$/

/** i18n keys / identifiers / slugs are not user-facing literals (camelCase keys included). */
const I18N_KEY_RE = /^[a-z][a-zA-Z0-9_.-]*$/

/** http(s) URLs and site-relative paths are not translatable literals. */
const URL_OR_PATH_RE = /^(?:https?:\/\/|\/|\.\/)/i

/** ISO language codes (ru-RU, en-US) are not translatable literals. */
const ISO_LOCALE_RE = /^[a-z]{2,3}(?:-[A-Z]{2,4})?$/

const HAS_LETTER_RE = /\p{L}/u

function maskComments(content) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, ' '))
    .replace(/<!--[\s\S]*?-->/g, (match) => match.replace(/[^\n]/g, ' '))
}

/** True when a candidate string is an allowed exception (not user-facing text). */
function isAllowedLiteral(lit) {
  const trimmed = lit.trim()
  if (!trimmed) return true
  if (!HAS_LETTER_RE.test(trimmed)) return true
  if (TEMPLATE_PLACEHOLDER_RE.test(trimmed)) return true
  if (I18N_KEY_RE.test(trimmed)) return true
  if (URL_OR_PATH_RE.test(trimmed)) return true
  if (ISO_LOCALE_RE.test(trimmed)) return true
  // single-letter brand/initial marks like 'P'
  if (trimmed.length === 1 && /[A-Za-zА-Яа-яЁё]/.test(trimmed)) return true
  return false
}

/** Plain text nodes (strip scripts/styles so JS strings are not scanned). */
function extractTextNodes(content) {
  const withoutCode = content
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
  const literals = []
  const re = />([^{}<>]*[A-Za-zА-Яа-яЁё][^{}<>]*)</g
  let m
  while ((m = re.exec(withoutCode)) !== null) {
    literals.push(m[1])
  }
  return literals
}

/** aria-label / title / placeholder / alt attribute values (quoted literals). */
function extractAttributeLiterals(content) {
  const literals = []
  const re = /\b(?:aria-label|title|placeholder|alt)="([^"]*)"/g
  let m
  while ((m = re.exec(content)) !== null) {
    literals.push(m[1])
  }
  return literals
}

/** `|| 'literal'` / `?? 'literal'` fallbacks with visible text. */
function extractFallbackLiterals(content) {
  const literals = []
  const re = /(?:\|\||\?\?)\s*'([^']*)'/g
  let m
  while ((m = re.exec(content)) !== null) {
    if (HAS_LETTER_RE.test(m[1])) literals.push(m[1])
  }
  return literals
}

function extractUserFacingLiterals(file) {
  const content = maskComments(readFile(file))
  const literals = [
    ...extractTextNodes(content),
    ...extractAttributeLiterals(content),
    ...extractFallbackLiterals(content)
  ]
  // Deduplicate, drop allowed exceptions, keep original literal text.
  return [...new Set(literals.filter((lit) => !isAllowedLiteral(lit)))]
}

function loadLiteralBaseline() {
  if (!existsSync(LITERAL_BASELINE)) return {}
  try {
    return JSON.parse(readFileSync(LITERAL_BASELINE, 'utf-8'))
  } catch {
    return {}
  }
}

function checkUserFacingLiterals(file) {
  if (!file.endsWith('.svelte') && file !== APP_HTML) return []
  const rel = relative(ROOT, file)
  const baseline = loadLiteralBaseline()
  const allowed = new Set(baseline[rel] ?? [])
  const issues = []
  for (const lit of extractUserFacingLiterals(file)) {
    if (!allowed.has(lit)) {
      issues.push({
        file: rel,
        message: `NEW user-facing string literal "${lit}" — replace with an i18n key (t('...') or m.*()). See docs/contributing/i18n-literals-policy.md (Rule: no untranslated regressions)`
      })
    } else if (STRICT_MODE) {
      // audit E-1 / Step 15: --check-strict fails on ANY literal still present
      // in the frozen baseline — the baseline must shrink to zero. Opt-in:
      // CI/batch translation work, NOT the default pre-commit gate.
      issues.push({
        file: rel,
        message: `BASELINED user-facing string literal "${lit}" still present — translate it and remove it from scripts/i18n-literal-baseline.json (--check-strict: baseline must shrink to zero).`
      })
    }
  }
  return issues
}

// ═══════════════════════════════════════════════════════════════════════════
// Check 10b: NEW label-like string literals in approved TS config surfaces
// ═══════════════════════════════════════════════════════════════════════════

/** Label-like heuristic for config values: multi-word phrases, Title-case
 * single words (Name, Email), or words with non-ASCII letters (Русский).
 * Compound PascalCase identifiers (SectionAbout) are exempted explicitly. */
const LABEL_LIKE_RE = /[\s\P{ASCII}]|[A-Z][a-z]{2,}/u

/** Compound PascalCase identifiers (SectionAbout, SectionF22) — config refs, not labels. */
const PASCAL_IDENTIFIER_RE = /^[A-Z][a-z]*[A-Z][A-Za-z0-9]*$/

/**
 * Extract string literals from a TS file, skipping `//` and `/* *\/` comments so
 * quoted text inside comments (e.g. `// Footer "Made by" branding`) is never
 * treated as a config value. Interpolated template literals are skipped.
 */
function extractTsStringLiterals(content) {
  const literals = []
  const n = content.length
  let i = 0
  while (i < n) {
    const ch = content[i]
    if (ch === '/' && content[i + 1] === '/') {
      const nl = content.indexOf('\n', i)
      i = nl === -1 ? n : nl + 1
      continue
    }
    if (ch === '/' && content[i + 1] === '*') {
      const end = content.indexOf('*/', i + 2)
      i = end === -1 ? n : end + 2
      continue
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      const quote = ch
      let j = i + 1
      let value = ''
      let closed = false
      while (j < n) {
        const c = content[j]
        if (c === '\\') {
          value += c + (content[j + 1] ?? '')
          j += 2
          continue
        }
        if (c === quote) {
          closed = true
          break
        }
        if (quote === '`' && c === '$' && content[j + 1] === '{') break // interpolated
        if (c === '\n' && quote !== '`') break // unterminated
        value += c
        j++
      }
      if (closed) literals.push(value)
      i = closed ? j + 1 : i + 1
      continue
    }
    i++
  }
  return literals
}

function extractTsConfigLiterals(file) {
  const content = maskComments(readFile(file))
  return [...new Set(
    extractTsStringLiterals(content)
      .map((lit) => lit.trim())
      .filter((lit) => HAS_LETTER_RE.test(lit) && LABEL_LIKE_RE.test(lit))
      .filter((lit) => !PASCAL_IDENTIFIER_RE.test(lit))
      .filter((lit) => !isAllowedLiteral(lit))
  )]
}

function checkTsConfigLiterals(file) {
  const rel = relative(ROOT, file)
  if (!TS_CONFIG_SCAN_FILES.includes(rel)) return []
  const baseline = loadLiteralBaseline()
  const allowed = new Set(baseline[rel] ?? [])
  const issues = []
  for (const lit of extractTsConfigLiterals(file)) {
    if (!allowed.has(lit)) {
      issues.push({
        file: rel,
        message: `NEW label-like string literal "${lit}" in a TS config surface that feeds UI — replace with an i18n key (t('...') or m.*()). See docs/contributing/i18n-literals-policy.md (Rule: no untranslated regressions)`
      })
    } else if (STRICT_MODE) {
      // audit E-1 / Step 15: same strict-baseline-shrink gate as check #10.
      issues.push({
        file: rel,
        message: `BASELINED label-like string literal "${lit}" still present — translate it and remove it from scripts/i18n-literal-baseline.json (--check-strict: baseline must shrink to zero).`
      })
    }
  }
  return issues
}

/** Freeze the current literal inventory as the baseline (code-review gated). */
function updateLiteralBaseline() {
  const baseline = {}
  const files = [APP_HTML, ...TS_CONFIG_SCAN_FILES.map((f) => resolve(ROOT, f))]
  walk(resolve(ROOT, 'src'), files)
  for (const file of [...new Set(files)]) {
    const rel = relative(ROOT, file)
    const literals = file.endsWith('.svelte') || file === APP_HTML
      ? extractUserFacingLiterals(file)
      : extractTsConfigLiterals(file)
    if (literals.length > 0) baseline[rel] = literals
  }
  writeFileSync(LITERAL_BASELINE, JSON.stringify(baseline, null, 2) + '\n')
  console.log(`PM3 i18n literal baseline updated: ${Object.keys(baseline).length} files`)
}

// ═══════════════════════════════════════════════════════════════════════════
// Check 11: framework → project boundary (audit I-22 / E-3 enforcement)
// ═══════════════════════════════════════════════════════════════════════════
// Framework files under src/lib/** must NOT import from src/project/** except
// the documented exceptions below (config assembly, project section registry,
// and the Onepager-injected hero parallax). This is the machine-enforcement
// piece of the @puppet-master/core boundary: a future package extraction
// makes these imports impossible, but until then the validator blocks new ones.

const FRAMEWORK_PROJECT_IMPORT_EXCEPTIONS = [
  // config assembly: framework site.ts merges the project's site-config
  'src/lib/config/site.ts',
  // project section registry merge (ADR-003)
  'src/lib/components/sections/registry.ts',
  // Onepager injects the project parallax via dynamic import (audit I-22)
  'src/lib/components/complex/Onepager.svelte'
]

function checkFrameworkProjectBoundary(file) {
  const rel = relative(ROOT, file)
  if (!rel.startsWith('src/lib/')) return []
  if (FRAMEWORK_PROJECT_IMPORT_EXCEPTIONS.includes(rel)) return []

  const content = readFile(file)
  // Match static and dynamic imports that reference the project layer.
  const projectImportRe = /(?:import|from)\s*\(?['"].*project\/(?:site-config|registry|HeroParallaxScene|gsapIntro|theme|content\.json)['"]\)?/g
  const issues = []
  let m
  while ((m = projectImportRe.exec(content)) !== null) {
    issues.push({
      file: rel,
      line: lineAt(content, m.index),
      message: `Framework → project import is not allowed here (check #11). Framework code (src/lib/**) must not import from src/project/**. If this is a legitimate boundary exception, add the file to FRAMEWORK_PROJECT_IMPORT_EXCEPTIONS in scripts/pm3-validator.mjs with a comment.`
    })
  }
  return issues
}

// ═══════════════════════════════════════════════════════════════════════════
// Check 12: DB is the runtime translation owner — no direct Paraglide reads
// ═══════════════════════════════════════════════════════════════════════════
// The database is the canonical runtime source for ALL translations (PM v2
// parity). Components MUST read text through the unified `t()` helper
// ($lib/stores/content.svelte — DB-first, Paraglide fallback). Direct imports
// of the compiled Paraglide catalog (`import * as m from '$lib/i18n'`) bypass
// the DB and silently ignore admin edits — the ONLY sanctioned importer is the
// `t()` wrapper itself.

const PARAGLIDE_DIRECT_IMPORT_ALLOWED = [
  // the DB-aware wrapper that owns the m.* fallback branch of t()
  'src/lib/stores/content.svelte.ts',
  // the i18n facade + paraglide runtime plumbing (hooks use `i18n`, not m.*)
  'src/lib/i18n.ts'
]

const PARAGLIDE_IMPORT_RE = /import\s*\*\s*as\s+m\s+from\s*['"]\$lib\/i18n['"]/g

function checkParaglideDirectImports(file) {
  const rel = relative(ROOT, file)
  if (PARAGLIDE_DIRECT_IMPORT_ALLOWED.includes(rel)) return []

  const content = readFile(file)
  const issues = []
  let m
  while ((m = PARAGLIDE_IMPORT_RE.exec(content)) !== null) {
    issues.push({
      file: rel,
      line: lineAt(content, m.index),
      message: `Direct Paraglide catalog import (check #12): components must read text through t() from '$lib/stores/content.svelte' (DB is the runtime owner — admin edits apply live). Importing '* as m from $lib/i18n' bypasses the DB.`
    })
  }
  return issues
}

// ═══════════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════════

const args = process.argv.slice(2)
const updateBaseline = args.includes('--update-baseline')
const STRICT_MODE = args.includes('--check-strict')
const fileArgs = args.filter((a) => a !== '--update-baseline' && a !== '--check-strict')

if (updateBaseline) {
  updateLiteralBaseline()
  process.exit(0)
}

const files = collectFiles(fileArgs)
const allIssues = []

allIssues.push(...checkDuplicateTokens())
allIssues.push(...checkUtilities())
allIssues.push(...checkLayerComponents())

for (const file of files) {
  if (file.endsWith('.svelte')) {
    allIssues.push(...checkBracketValues(file))
    allIssues.push(...checkLiteralDuplication(file))
    allIssues.push(...checkPrimitiveBypass(file))
  }
  if (file.endsWith('.svelte') || file.endsWith('.ts')) {
    allIssues.push(...checkTypeSuppressions(file))
    allIssues.push(...checkEmptyCatches(file))
    allIssues.push(...checkFrameworkProjectBoundary(file))
    allIssues.push(...checkParaglideDirectImports(file))
  }
  if (file.endsWith('+server.ts')) {
    allIssues.push(...checkApiZod(file))
  }
  if (file.endsWith('.svelte') || file === APP_HTML) {
    allIssues.push(...checkUserFacingLiterals(file))
  }
  if (file.endsWith('.ts') && TS_CONFIG_SCAN_FILES.includes(relative(ROOT, file))) {
    allIssues.push(...checkTsConfigLiterals(file))
  }
}

const unique = [...new Map(allIssues.map((i) => [`${i.file}:${i.line ?? 0}:${i.message}`, i])).values()]

if (unique.length > 0) {
  console.error('PM3 Framework Validator — violations found:\n')
  for (const issue of unique) {
    const loc = issue.line ? `${issue.file}:${issue.line}` : issue.file
    console.error(`  ❌ ${loc}`)
    console.error(`     ${issue.message}`)
  }
  console.error('\nSee docs/traycer/PM3_Bulletproof_Style_System_—_Tokens-Only_CSS_Architecture.md')
  process.exit(1)
}

console.log('PM3 Framework Validator — OK')
process.exit(0)
