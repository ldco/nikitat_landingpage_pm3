import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { validate } from '../../scripts/validate-system-seed'
import { LOCALES, DEFAULT_LOCALE, SECONDARY_LOCALE } from '$lib/config/site'

/**
 * Catalog validator tests — the failure patterns (review):
 *   - missing keys + raw underscore-export values
 *   - untranslated copies — identical to the default locale AND identical to
 *     the configured SECONDARY_LOCALE (a carry-over that the default
 *     comparison alone misses)
 * Plus the guardrails: blank values, raw dotted keys, the allowlist, and a
 * clean catalog. The final test proves the REAL catalog currently passes
 * (every non-default entry is translated or explicitly allowlisted).
 *
 * Everything is derived from the shared locale configuration (LOCALES,
 * DEFAULT_LOCALE, SECONDARY_LOCALE) so the suite keeps validating behavior
 * after the configured locale set changes.
 */

const defaultLocale = DEFAULT_LOCALE
const nonDefault = LOCALES.filter(l => l !== DEFAULT_LOCALE)
// The secondary copy-source locale (configured, distinct from the default).
const secondary =
  SECONDARY_LOCALE && SECONDARY_LOCALE !== DEFAULT_LOCALE ? SECONDARY_LOCALE : null
// The locale under test for missing/blank/raw-key/copy patterns: a NON-default
// locale (prefer one distinct from the secondary copy-source so the carry-over
// tests keep a clean subject). For a single-locale project there is no
// non-default locale — target stays undefined and the tests that need one are
// skipped (it.skipIf(!target)) instead of asserting on a fake default fallback.
const target: string | undefined =
  nonDefault.find(l => l !== secondary) ?? nonDefault[0]
// The carry-over subject must be distinct from the secondary copy-source.
const hasCopyTarget =
  target !== undefined && secondary !== null && target !== secondary

/** Distinct per-locale value — never equals another locale's value. */
function cleanValue(locale: string, suffix: string): string {
  return `T${suffix}:${locale}`
}

/** Build a full catalog: every configured locale gets the same key set. */
function catalog(values: Record<string, Record<string, string>>) {
  const entries: Array<{ locale: string; key: string; value: string }> = []
  for (const [key, perLocale] of Object.entries(values)) {
    for (const locale of LOCALES) {
      entries.push({ locale, key, value: perLocale[locale] ?? '' })
    }
  }
  return entries
}

const cleanEntry = (suffix: string): Record<string, string> =>
  Object.fromEntries(LOCALES.map(locale => [locale, cleanValue(locale, suffix)]))

describe('catalog validation — missing/blank/raw-key failure patterns', () => {
  it.skipIf(!target)(
    'flags a missing key (key present in default locale, absent in another)',
    () => {
      const entries = catalog({ 'common.hello': cleanEntry('1') }).filter(
        e => !(e.locale === target && e.key === 'common.hello')
      )
      const violations = validate(entries, new Set())
      expect(
        violations.some(
          v => v.locale === target && v.key === 'common.hello' && v.reason.includes('missing key')
        )
      ).toBe(true)
    }
  )

  it.skipIf(!target)(
    'flags a key present only in a non-default locale (missing from the default)',
    () => {
      // Symmetric coverage: a key the default locale lacks would leak as a raw
      // key for default-locale readers, so it must be flagged on the default.
      // A second key stays complete so the default locale keeps a key set.
      const entries = catalog({
        'common.hello': cleanEntry('1'),
        'common.other': cleanEntry('2')
      }).filter(e => !(e.locale === defaultLocale && e.key === 'common.hello'))
      const violations = validate(entries, new Set())
      expect(
        violations.some(
          v =>
            v.locale === defaultLocale &&
            v.key === 'common.hello' &&
            v.reason.includes('missing key in default locale')
        )
      ).toBe(true)
    }
  )

  it.skipIf(!target)('flags a value equal to the underscore-export form (raw placeholder)', () => {
    const entries = catalog({
      'common.hello': { ...cleanEntry('1'), [target as string]: 'common_hello' }
    })
    const violations = validate(entries, new Set())
    expect(
      violations.some(
        v =>
          v.locale === target &&
          v.key === 'common.hello' &&
          v.reason.includes('underscore-export')
      )
    ).toBe(true)
  })

  it.skipIf(!target)('flags a value equal to the dotted key', () => {
    const entries = catalog({
      'common.hello': { ...cleanEntry('1'), [target as string]: 'common.hello' }
    })
    const violations = validate(entries, new Set())
    expect(
      violations.some(
        v => v.locale === target && v.key === 'common.hello' && v.reason.includes('dotted key')
      )
    ).toBe(true)
  })

  it.skipIf(!target)('flags a blank value', () => {
    const entries = catalog({ 'common.hello': { ...cleanEntry('1'), [target as string]: '' } })
    const violations = validate(entries, new Set())
    expect(
      violations.some(
        v => v.locale === target && v.key === 'common.hello' && v.reason.includes('blank')
      )
    ).toBe(true)
  })
})

describe('catalog validation — untranslated copies', () => {
  it.skipIf(!target)(
    'flags a non-default value identical to the default-locale value unless allowlisted',
    () => {
      // target's value === default locale's value → untranslated copy.
      const entries = catalog({
        'common.hello': { ...cleanEntry('1'), [target as string]: cleanValue(defaultLocale, '1') }
      })
      const violations = validate(entries, new Set())
      expect(
        violations.some(
          v =>
            v.locale === target &&
            v.key === 'common.hello' &&
            v.reason.includes(`identical to ${defaultLocale}-locale value`)
        )
      ).toBe(true)

      // The same key is fine when explicitly allowlisted (brand/proper-noun rule).
      const allowed = validate(entries, new Set(['common.hello']))
      expect(allowed.filter(v => v.key === 'common.hello')).toHaveLength(0)
    }
  )

  it.skipIf(!hasCopyTarget)(
    'flags a non-default value copied from the secondary locale (carry-over, distinct from default)',
    () => {
      // target's value === secondary locale's value while the default differs —
      // the check against DEFAULT_LOCALE alone misses this exact failure mode.
      const secondaryValue = cleanValue(secondary as string, '2')
      const entries = catalog({
        'common.hello': {
          ...cleanEntry('2'),
          [secondary as string]: secondaryValue,
          [target as string]: secondaryValue
        }
      })
      const violations = validate(entries, new Set())
      expect(
        violations.some(
          v =>
            v.locale === target &&
            v.key === 'common.hello' &&
            v.reason.includes(`identical to ${secondary}-locale value`)
        )
      ).toBe(true)

      // Allowlisting a genuinely locale-independent term permits the duplicate.
      const allowed = validate(entries, new Set(['common.hello']))
      expect(allowed.filter(v => v.key === 'common.hello')).toHaveLength(0)
    }
  )

  it.skipIf(!secondary)("does not flag the secondary locale's own values against itself", () => {
    // The secondary locale is never compared against its own values — only
    // locales distinct from it are checked for carry-over.
    const entries = catalog({ 'common.hello': cleanEntry('3') })
    expect(validate(entries, new Set())).toHaveLength(0)
  })
})

describe('catalog validation — clean catalogs pass', () => {
  it('accepts a fully translated catalog', () => {
    const entries = catalog({ 'common.hello': cleanEntry('4') })
    expect(validate(entries, new Set())).toHaveLength(0)
  })

  it('the real i18n/system-seed.json catalog passes validation', () => {
    const seedPath = join(__dirname, '..', '..', 'i18n', 'system-seed.json')
    const entries = JSON.parse(readFileSync(seedPath, 'utf-8')) as Array<{
      locale: string
      key: string
      value: string
    }>
    const violations = validate(entries)
    expect(violations.map(v => `${v.locale}:${v.key} (${v.reason})`)).toHaveLength(0)
  })
})
