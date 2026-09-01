import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/svelte'
import { initContent } from '$lib/stores/content.svelte'
import ModalHarness from './translation-editor-modal-harness.svelte'

vi.mock('$app/stores', async () => {
  const { writable } = await import('svelte/store')
  return {
    page: writable({ data: {} }),
    navigating: writable(null),
    updated: writable(false)
  }
})

beforeAll(() => {
  initContent({ 'common.edit': 'Edit', 'common.save': 'Save', 'common.cancel': 'Cancel' })
})
afterEach(() => cleanup())

describe('TranslationEditorModal — edit flow regression (bind:value undefined crash)', () => {
  it('opens and pre-fills key + value (text, not the key, in the value field)', () => {
    const longValue = 'Живу в Санкт-Петербурге. Более 15 лет создаю премиальный брендинг.'
    render(ModalHarness, {
      props: {
        open: true,
        editingKey: 'about.paragraph1',
        editingLocale: 'ru',
        editValue: longValue,
        locales: ['ru', 'en'],
        localeNames: { ru: 'Русский', en: 'English' },
        onClose: vi.fn(),
        onSaved: vi.fn()
      }
    })
    expect(screen.getByRole('dialog')).toBeTruthy()
    const keyInput = document.getElementById('translation-modal-key') as HTMLInputElement
    const valueArea = document.getElementById('translation-modal-value') as HTMLTextAreaElement
    expect(keyInput.value).toBe('about.paragraph1')
    expect(valueArea.value).toBe(longValue)
    expect(valueArea.value).not.toBe('about.paragraph1')
  })
})
