/**
 * System Seed Catalog Validator — guards the canonical i18n catalog.
 *
 * The DB is the runtime owner of translations and `npm run i18n:export` +
 * `npm run db:seed` both consume `i18n/system-seed.json`, so a broken locale
 * silently ships to users. This script FAILS the pipeline on:
 *
 *   1. Missing keys — every non-default locale must contain every key of the
 *      default locale (a missing Hebrew key falls back to raw keys at runtime)
 *      AND every key present in any locale must exist in the default locale
 *      (a key the default lacks leaks as a raw key for default-locale
 *      readers).
 *   2. Blank values — empty strings are never valid translations.
 *   3. Raw-key values — a value that equals the dotted key or its underscore
 *      (Paraglide export) form is an un-translated placeholder.
 *   4. Untranslated copies — a value copied from ANOTHER configured locale
 *      (the default locale, or the secondary copy-source locale from
 *      SECONDARY_LOCALE in src/project/site-config.ts) is a carry-over, e.g. a
 *      French string still in English. A LIMITED set of terms may
 *      legitimately be identical across locales (brand names, proper nouns,
 *      URLs); those are enforced through an explicit allowlist
 *      (scripts/i18n-identical-allowlist.json) instead of being silently
 *      accepted.
 *   5. Wrong-language text — a value whose dominant script is not the script
 *      its locale requires (French copy pasted into a Hebrew row, English into
 *      Russian, …). Framework-level: any locale/script pair works
 *      (scripts/lib/i18n-scripts.mjs), no per-language hardcoding. Short
 *      values (<= 25 letters) and code-like tokens (dotted keys, identifiers,
 *      masks) are excluded; values that intentionally mix scripts are exempted
 *      per-key via scripts/i18n-script-allowlist.json.
 *   6. Case-insensitive raw keys — in addition to the exact dotted/underscore
 *      forms, a value equal to its key with different casing
 *      ('Common.hello' / 'COMMON_HELLO') is an un-translated placeholder.
 *
 * Invoked by `npm run i18n:validate`, by `npm run i18n:export` (before
 * generating messages) and by CI.
 *
 * Usage: npx tsx scripts/validate-system-seed.ts
 */
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { LOCALES, DEFAULT_LOCALE, SECONDARY_LOCALE } from '../src/project/site-config'
import { scriptMismatch, isRawKeyValue, loadScriptAllowlist } from './lib/i18n-scripts.mjs'

interface TranslationEntry {
  locale: string
  key: string
  value: string
}

const SEED_PATH = join(process.cwd(), 'i18n', 'system-seed.json')
const ALLOWLIST_PATH = join(process.cwd(), 'scripts', 'i18n-identical-allowlist.json')

interface Violation {
  locale: string
  key: string
  reason: string
}

function loadAllowlist(): Set<string> {
  if (!existsSync(ALLOWLIST_PATH)) return new Set()
  const raw = JSON.parse(readFileSync(ALLOWLIST_PATH, 'utf-8')) as unknown
  if (!Array.isArray(raw)) {
    console.error(`❌ ${ALLOWLIST_PATH} must be a JSON array of dotted keys`)
    process.exit(1)
  }
  return new Set(raw.filter((k): k is string => typeof k === 'string'))
}

/**
 * Validate the catalog against the configured locales.
 *
 * @param entries    flat catalog entries ({ locale, key, value })
 * @param allowlist  dotted keys whose cross-locale-identical value is
 *   acceptable (brand names, proper nouns, URLs); defaults to the on-disk
 *   allowlist
 */
export function validate(
  entries: TranslationEntry[],
  allowlist?: Set<string>,
  scriptAllowlist: Set<string> = loadScriptAllowlist()
): Violation[] {
  const byLocale: Record<string, Record<string, string>> = {}
  for (const entry of entries) {
    ;(byLocale[entry.locale] ??= {})[entry.key] = entry.value
  }

  const defaultKeys = Object.keys(byLocale[DEFAULT_LOCALE] ?? {})
  if (defaultKeys.length === 0) {
    throw new Error(`Catalog has no default-locale (${DEFAULT_LOCALE}) entries`)
  }

  // Secondary copy-source locale (configured, distinct from the default):
  // a value identical to IT (while not being the default-locale value) is a
  // carry-over — the previous check against DEFAULT_LOCALE alone missed it.
  // E.g. with DEFAULT_LOCALE=ru and SECONDARY_LOCALE=en, a French value copied
  // from English is caught even though it differs from the Russian original.
  const secondary =
    SECONDARY_LOCALE && SECONDARY_LOCALE !== DEFAULT_LOCALE ? SECONDARY_LOCALE : null

  const allowed = allowlist ?? loadAllowlist()
  const violations: Violation[] = []

  const scriptAllowed = scriptAllowlist

  const nonDefault = LOCALES.filter(l => l !== DEFAULT_LOCALE)

  // 0. Symmetric coverage: every key present in ANY configured locale must
  //    also exist in the DEFAULT locale. The per-locale loop below only walks
  //    the default key set (it flags non-default locales missing a default
  //    key), so a key that exists in a non-default locale but is absent from
  //    the default would otherwise slip through and leak as a raw key for
  //    default-locale readers.
  for (const locale of nonDefault) {
    const map = byLocale[locale] ?? {}
    for (const key of Object.keys(map)) {
      if (!(key in byLocale[DEFAULT_LOCALE])) {
        violations.push({
          locale: DEFAULT_LOCALE,
          key,
          reason: `missing key in default locale (present in ${locale})`
        })
      }
    }
  }

  for (const locale of LOCALES) {
    const map = byLocale[locale] ?? {}
    const secondaryMap = secondary && locale !== secondary ? byLocale[secondary] : undefined
    const isDefault = locale === DEFAULT_LOCALE

    // 1. Missing keys vs the default-locale key set (non-default locales only —
    //    the default locale's own coverage is enforced symmetrically above).
    if (!isDefault) {
      for (const key of defaultKeys) {
        if (!(key in map)) {
          violations.push({ locale, key, reason: 'missing key (present in default locale)' })
        }
      }
    }

    // Value-level checks run for EVERY locale (including the default) so a
    // blank / raw-key / wrong-language value in any locale is caught.
    for (const [key, value] of Object.entries(map)) {
      const trimmed = String(value).trim()
      // 2. Blank values.
      if (trimmed === '') {
        violations.push({ locale, key, reason: 'blank value' })
        continue
      }
      // 3. Raw-key values (dotted key or Paraglide underscore export form,
      //    case-insensitive after trimming — shared with the pm3-validator DB
      //    check via scripts/lib/i18n-scripts.mjs so the two surfaces cannot
      //    drift on normalization).
      if (isRawKeyValue(key, value)) {
        const valueLower = value.trim().toLowerCase()
        const keyLower = key.toLowerCase()
        violations.push({
          locale,
          key,
          reason:
            valueLower === keyLower.replace(/\./g, '_')
              ? 'value equals the underscore-export form'
              : 'value equals the dotted key'
        })
        continue
      }
      // 4. Untranslated copies: a NON-default value copied from another
      //    configured locale (the default locale, or the secondary copy-source
      //    locale). The default locale is the source, never the suspect.
      if (!isDefault) {
        const defaultValue = byLocale[DEFAULT_LOCALE]?.[key]
        const copiedFrom =
          value === defaultValue
            ? DEFAULT_LOCALE
            : secondaryMap && secondaryMap[key] !== undefined && secondaryMap[key] !== defaultValue && value === secondaryMap[key]
              ? secondary
              : undefined
        if (copiedFrom && !allowed.has(key)) {
          violations.push({
            locale,
            key,
            reason: `identical to ${copiedFrom}-locale value (untranslated copy)`
          })
        }
      }
      // 5. Wrong-language text — the value's dominant script does not match
      //    its locale's script (framework-level, any locale/script pair).
      //    Short values and code-like tokens are skipped inside scriptMismatch;
      //    keys that intentionally mix scripts are exempted via the allowlist.
      const mismatch = scriptMismatch(locale, value)
      if (mismatch && !scriptAllowed.has(key)) {
        violations.push({ locale, key, reason: `wrong-language text — ${mismatch}` })
      }
    }
  }

  return violations
}
function main() {
  if (!existsSync(SEED_PATH)) {
    console.error('❌ i18n/system-seed.json not found — the canonical catalog is missing')
    process.exit(1)
  }
  const entries = JSON.parse(readFileSync(SEED_PATH, 'utf-8')) as TranslationEntry[]

  console.log(`🔍 Validating ${entries.length} catalog entries (default: ${DEFAULT_LOCALE})…`)

  const violations = validate(entries)
  if (violations.length === 0) {
    console.log(`   ✅ Every non-default locale matches the default key set with translated values`)
    return
  }

  const byLocale: Record<string, Violation[]> = {}
  for (const v of violations) {
    ;(byLocale[v.locale] ??= []).push(v)
  }

  for (const [locale, list] of Object.entries(byLocale)) {
    console.error(`\n❌ ${locale}: ${list.length} violation(s)`)
    for (const v of list.slice(0, 30)) {
      console.error(`   - ${v.key} — ${v.reason}`)
    }
    if (list.length > 30) console.error(`   … and ${list.length - 30} more`)
  }

  console.error(
    `\n❌ Catalog validation FAILED: ${violations.length} violation(s) across ${Object.keys(byLocale).length} locale(s).\n` +
      '   Translate the flagged entries or, for genuinely locale-independent terms, add them to\n' +
      `   scripts/i18n-identical-allowlist.json (dotted keys) and re-run.`
  )
  process.exit(1)
}

// Allow import for tests without executing main().
if (process.argv[1]?.endsWith('validate-system-seed.ts')) {
  main()
}
