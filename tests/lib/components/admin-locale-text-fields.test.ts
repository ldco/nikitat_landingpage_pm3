import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/svelte'
import AdminLocaleTextFields from '$lib/components/molecules/AdminLocaleTextFields.svelte'

afterEach(cleanup)

function tick() {
  return new Promise<void>(resolve => setTimeout(resolve, 0))
}

describe('AdminLocaleTextFields — locale-tabbed multilingual fields', () => {
  const locales = ['en', 'fr', 'he']
  const localeNames = { en: 'English', fr: 'Français', he: 'עברית' }
  const fields = [
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description', type: 'textarea' as const }
  ]
  const initialValues = {
    en: { title: 'Nikita T. — Personal Rebranding', description: 'En desc' },
    fr: { title: 'Rebranding personnel', description: '' },
    he: {}
  }

  it('renders one tab per locale and pre-populates the active locale inputs', async () => {
    const { container } = render(AdminLocaleTextFields, {
      props: { locales, localeNames, fields, initialValues }
    })
    await tick()

    const tabs = Array.from(container.querySelectorAll('button'))
    expect(tabs.map(b => b.textContent?.trim())).toEqual(['English', 'Français', 'עברית'])

    const enTitle = container.querySelector('input[name="title_en"]') as HTMLInputElement | null
    expect(enTitle).not.toBeNull()
    expect(enTitle?.value).toBe('Nikita T. — Personal Rebranding')
  })

  it('keeps every locale input mounted so the form submits all overrides', async () => {
    const { container } = render(AdminLocaleTextFields, {
      props: { locales, localeNames, fields, initialValues }
    })
    await tick()

    for (const locale of locales) {
      expect(container.querySelector(`input[name="title_${locale}"]`)).not.toBeNull()
      expect(container.querySelector(`textarea[name="description_${locale}"]`)).not.toBeNull()
    }
  })

  it('switches the visible tab on selection', async () => {
    const { container } = render(AdminLocaleTextFields, {
      props: { locales, localeNames, fields, initialValues }
    })
    await tick()

    const frTab = Array.from(container.querySelectorAll('button'))
      .find(b => b.textContent?.trim() === 'Français')
    expect(frTab).toBeDefined()
    ;(frTab as HTMLButtonElement).click()
    await tick()

    const frTitle = container.querySelector('input[name="title_fr"]') as HTMLInputElement | null
    expect(frTitle?.value).toBe('Rebranding personnel')
  })

  it('renders textarea fields with the requested row count', async () => {
    const { container } = render(AdminLocaleTextFields, {
      props: {
        locales,
        localeNames,
        fields: [{ key: 'content', label: 'Content', type: 'textarea', rows: 8 }],
        initialValues: { en: { content: '### Overview\nBody' } }
      }
    })
    await tick()
    const textarea = container.querySelector('textarea[name="content_en"]') as HTMLTextAreaElement | null
    expect(textarea).not.toBeNull()
    expect(textarea?.value).toBe('### Overview\nBody')
    expect(textarea?.rows).toBe(8)
  })
})
