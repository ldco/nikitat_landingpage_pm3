import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/svelte'
import { initContent } from '$lib/stores/content.svelte'
import Dropdown from '$lib/components/atoms/Dropdown.svelte'

vi.mock('$app/stores', () => ({
  page: { subscribe: (cb: (v: unknown) => void) => { cb({ data: {} }); return () => {} } },
  navigating: { subscribe: () => () => {} },
  updated: { subscribe: () => () => {} }
}))

/**
 * Framework-level Dropdown: option labels resolve through the unified i18n
 * helper — callers pass keys, the component renders translations, and a key
 * missing from every catalog degrades to the raw key (never an empty box).
 */
beforeAll(() => {
  initContent({
    'admin.portfolioTypeBranding': 'Брендинг',
    'admin.portfolioTypeWebsite': 'Сайт'
  })
})
afterEach(cleanup)

const OPTIONS = [
  { value: 'branding', label: 'admin.portfolioTypeBranding' },
  { value: 'website', label: 'admin.portfolioTypeWebsite' }
]

describe('Dropdown — i18n label resolution', () => {
  it('renders the translated label in the closed trigger', () => {
    const { container } = render(Dropdown, { props: { name: 'type', value: 'branding', options: OPTIONS } })
    const trigger = container.querySelector('button[role="combobox"]') as HTMLButtonElement
    expect(trigger.textContent).toContain('Брендинг')
    expect(trigger.textContent).not.toContain('admin.')
  })

  it('renders translated labels in the open listbox', async () => {
    const { container } = render(Dropdown, { props: { name: 'type', value: 'branding', options: OPTIONS } })
    const trigger = container.querySelector('button[role="combobox"]') as HTMLButtonElement
    await fireEvent.click(trigger)
    await new Promise(r => setTimeout(r, 0))
    const labels = Array.from(document.body.querySelectorAll('[role="option"]')).map(o => o.textContent?.trim() ?? '')
    expect(labels).toContain('Брендинг')
    expect(labels).toContain('Сайт')
    for (const l of labels) expect(l ?? '').not.toContain('admin.')
  })

  it('keyboard: ArrowDown opens, Enter selects, hidden input follows', async () => {
    const { container } = render(Dropdown, { props: { name: 'type', value: 'branding', options: OPTIONS } })
    const trigger = container.querySelector('button[role="combobox"]') as HTMLButtonElement
    await fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    await new Promise(r => setTimeout(r, 0))
    await fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    await new Promise(r => setTimeout(r, 0))
    await fireEvent.keyDown(trigger, { key: 'Enter' })
    await new Promise(r => setTimeout(r, 0))
    const input = container.querySelector('input[type="hidden"][name="type"]') as HTMLInputElement
    expect(input.value).toBe('website')
  })

  it('Escape closes the listbox', async () => {
    const { container } = render(Dropdown, { props: { name: 'type', value: 'branding', options: OPTIONS } })
    const trigger = container.querySelector('button[role="combobox"]') as HTMLButtonElement
    await fireEvent.click(trigger)
    await new Promise(r => setTimeout(r, 0))
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    await fireEvent.keyDown(trigger, { key: 'Escape' })
    await new Promise(r => setTimeout(r, 0))
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })
})
