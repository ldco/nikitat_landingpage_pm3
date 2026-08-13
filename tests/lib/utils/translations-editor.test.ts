import { describe, it, expect } from 'vitest'
import {
  rebuildLocaleRows,
  classifyType,
  isSystemKey,
  type TranslationRow
} from '$lib/utils/translations-editor'

/**
 * Regression test — translations editor refresh flow (review):
 * `refreshFromServer()` rebuilds the active locale table from the FRESH server
 * map, so a key deleted on the server disappears from the table immediately —
 * no full page reload — while surviving keys keep their id and type
 * classification and brand-new keys are classified here.
 */

function row(partial: Partial<TranslationRow> & { key: string; value: string }): TranslationRow {
  return { id: 1, type: 'content', ...partial }
}

describe('rebuildLocaleRows — translations editor refresh flow', () => {
  it('drops a deleted key from the table and keeps surviving rows with their type', () => {
    const existing: TranslationRow[] = [
      row({ id: 10, key: 'admin.dashboard', value: 'Панель', type: 'system' }),
      row({ id: 20, key: 'hero.title', value: 'Заголовок', type: 'content' }),
      row({ id: 30, key: 'hero.subtitle', value: 'Подзаголовок', type: 'content' })
    ]

    // The server map AFTER a delete: hero.subtitle is gone, hero.title changed.
    const map = {
      'admin.dashboard': 'Панель',
      'hero.title': 'Заголовок обновлён'
    }

    const rebuilt = rebuildLocaleRows(map, existing)

    // The deleted key is absent from the rebuilt table (no page reload).
    expect(rebuilt.find(r => r.key === 'hero.subtitle')).toBeUndefined()
    // Surviving rows keep their id and type classification.
    expect(rebuilt).toContainEqual(
      expect.objectContaining({ id: 10, key: 'admin.dashboard', type: 'system', value: 'Панель' })
    )
    expect(rebuilt).toContainEqual(
      expect.objectContaining({
        id: 20,
        key: 'hero.title',
        type: 'content',
        value: 'Заголовок обновлён'
      })
    )
    expect(rebuilt).toHaveLength(2)
  })

  it('classifies brand-new keys and preserves an edited value for existing keys', () => {
    const existing: TranslationRow[] = [
      row({ id: 10, key: 'admin.name', value: 'Имя', type: 'system' })
    ]

    const map = {
      'admin.name': 'Имя пользователя',
      'common.newKey': 'Новый ключ',
      'hero.tagline': 'Слоган'
    }

    const rebuilt = rebuildLocaleRows(map, existing)

    const adminName = rebuilt.find(r => r.key === 'admin.name')
    expect(adminName).toMatchObject({ id: 10, type: 'system', value: 'Имя пользователя' })

    const newKey = rebuilt.find(r => r.key === 'common.newKey')
    expect(newKey).toBeDefined()
    expect(newKey?.type).toBe('system')
    expect(newKey?.value).toBe('Новый ключ')

    const tagline = rebuilt.find(r => r.key === 'hero.tagline')
    expect(tagline?.type).toBe('content')
  })

  it('classifies system prefixes the same as the server rule', () => {
    expect(isSystemKey('admin.anything')).toBe(true)
    expect(isSystemKey('nav.menu')).toBe(true)
    expect(isSystemKey('common.save')).toBe(true)
    expect(isSystemKey('apiErrors.auth.invalidCredentials')).toBe(true)
    expect(isSystemKey('hero.title')).toBe(false)
    expect(classifyType('admin.dashboard')).toBe('system')
    expect(classifyType('about.description')).toBe('content')
  })
})
