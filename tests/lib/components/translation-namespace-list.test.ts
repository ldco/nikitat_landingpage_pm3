import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/svelte'
import { initContent } from '$lib/stores/content.svelte'
import TranslationNamespaceList, {
  type TranslationGroup
} from '$lib/components/admin/translations/TranslationNamespaceList.svelte'

vi.mock('$app/stores', async () => {
  const { writable } = await import('svelte/store')
  return {
    page: writable({ data: {} }),
    navigating: writable(null),
    updated: writable(false)
  }
})

beforeAll(() => {
  initContent({
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'admin.translationKey': 'Key',
    'admin.translationValue': 'Value'
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const groups: TranslationGroup[] = [
  {
    namespace: 'about',
    items: [
      { id: 1, key: 'about.paragraph1', value: 'First paragraph', type: 'content' },
      { id: 2, key: 'about.paragraph2', value: 'Second paragraph', type: 'content' }
    ]
  }
]

describe('TranslationNamespaceList — canonical row actions', () => {
  it('renders an explicit Edit (pencil) action per row that opens the editor', async () => {
    const onEdit = vi.fn()
    render(TranslationNamespaceList, {
      props: { groups, contextKey: 'content:ru', forceOpen: true, onEdit, onDelete: vi.fn() }
    })
    const editButtons = screen.getAllByRole('button', { name: 'Edit' })
    expect(editButtons).toHaveLength(2)
    await fireEvent.click(editButtons[0])
    expect(onEdit).toHaveBeenCalledWith(groups[0].items[0])
  })

  it('renders the Delete action inside the same row-actions group', async () => {
    const onDelete = vi.fn()
    render(TranslationNamespaceList, {
      props: { groups, contextKey: 'content:ru', forceOpen: true, onEdit: vi.fn(), onDelete }
    })
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' })
    expect(deleteButtons).toHaveLength(2)
    await fireEvent.click(deleteButtons[0])
    expect(onDelete).toHaveBeenCalledWith(groups[0].items[0])
  })

  it('shows the key in a proportional chip (no mono <code>)', () => {
    render(TranslationNamespaceList, {
      props: { groups, contextKey: 'content:ru', forceOpen: true, onEdit: vi.fn(), onDelete: vi.fn() }
    })
    expect(screen.getByText('about.paragraph1')).toBeTruthy()
    expect(document.querySelector('code')).toBeNull()
  })
})
