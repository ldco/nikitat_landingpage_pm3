import { describe, expect, it } from 'vitest'
import { contentTranslations } from '../../../i18n/content'

function flattenTranslations(
  value: Record<string, unknown>,
  prefix = ''
): Record<string, string> {
  const result: Record<string, string> = {}

  for (const [key, child] of Object.entries(value)) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (child && typeof child === 'object' && !Array.isArray(child)) {
      Object.assign(result, flattenTranslations(child as Record<string, unknown>, fullKey))
    } else {
      result[fullKey] = String(child)
    }
  }

  return result
}

describe('content translation parity', () => {
  it('does not have EN/RU empty-string mismatches that change conditional DOM', () => {
    const en = flattenTranslations(contentTranslations.en)
    const ru = flattenTranslations(contentTranslations.ru)
    const keys = new Set([...Object.keys(en), ...Object.keys(ru)])

    const mismatchedKeys = [...keys].filter(key => (en[key] === '') !== (ru[key] === ''))

    expect(mismatchedKeys).toEqual([])
  })
})
