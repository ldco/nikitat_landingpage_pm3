import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest'
import { render, cleanup } from '@testing-library/svelte'
import { initContent } from '$lib/stores/content.svelte'
import PortfolioItemEditor from '$lib/components/admin/PortfolioItemEditor.svelte'
import type { PortfolioItem } from '$lib/portfolio-metadata-form'

vi.mock('$app/stores', () => ({
  page: {
    subscribe: (cb: (v: unknown) => void) => {
      cb({ data: { csrfToken: 'test-csrf' } })
      return () => {}
    }
  },
  navigating: { subscribe: () => () => {} },
  updated: { subscribe: () => () => {} }
}))

/**
 * Regression test (review): the CREATE path of the portfolio item editor must
 * default the item type to the first type the parent portfolio can render
 * (e.g. case_study portfolios start as `case_study`) so the modal never
 * submits a server-invalid `image` default. The legacy edit path keeps the
 * existing row's type.
 */

beforeAll(() => {
  initContent({
    'admin.mediaType': 'Media type',
    'admin.image': 'Image',
    'admin.video': 'Video',
    'admin.externalUrl': 'External URL',
    'admin.caseStudy': 'Case study'
  })
})

afterEach(cleanup)

function tick() {
  return new Promise<void>(resolve => setTimeout(resolve, 0))
}

function selectValue(container: HTMLElement): string {
  const input = container.querySelector('input[name="itemType"]') as HTMLInputElement | null
  expect(input).not.toBeNull()
  return input?.value ?? ''
}

/** Open the Dropdown and read the currently rendered option values (portaled to <body>). */
async function openDropdown(container: HTMLElement): Promise<string[]> {
  const trigger = container.querySelector('button[role="combobox"][id="itemType"]') as HTMLButtonElement | null
  expect(trigger).not.toBeNull()
  trigger?.click()
  await tick()
  return Array.from(document.body.querySelectorAll('[role="option"]')).map(o =>
    (o as HTMLElement).getAttribute('data-option-value') ?? ''
  )
}

const editingItem: PortfolioItem = {
  id: 7,
  itemType: 'case_study',
  mediaUrl: null,
  thumbnailUrl: null,
  caption: null,
  title: 'Case',
  description: null,
  content: '### Задача\nBody',
  metadata: null,
  order: 1,
  published: true
}

describe('PortfolioItemEditor — create-path itemType default', () => {
  it('case_study portfolio create flow starts with the case_study item type', async () => {
    const { container } = render(PortfolioItemEditor, {
      props: { open: true, portfolioType: 'case_study', editingItem: null, onClose: () => {} }
    })
    await tick()
    expect(selectValue(container)).toBe('case_study')
  })

  it('website portfolio create flow starts with the image item type (first allowed)', async () => {
    const { container } = render(PortfolioItemEditor, {
      props: { open: true, portfolioType: 'website', editingItem: null, onClose: () => {} }
    })
    await tick()
    expect(selectValue(container)).toBe('image')
  })

  it('brandbook create flow offers only image and starts with it', async () => {
    const { container } = render(PortfolioItemEditor, {
      props: { open: true, portfolioType: 'brandbook', editingItem: null, onClose: () => {} }
    })
    await tick()
    expect(selectValue(container)).toBe('image')
    const optionValues = await openDropdown(container)
    expect(optionValues).toEqual(['image'])
  })

  it('keeps the existing row\u2019s item type on the edit path', async () => {
    const { container } = render(PortfolioItemEditor, {
      props: { open: true, portfolioType: 'case_study', editingItem, onClose: () => {} }
    })
    await tick()
    expect(selectValue(container)).toBe('case_study')
  })
})
