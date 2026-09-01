import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/svelte'
import { createRawSnippet } from 'svelte'
import FormActions from '$lib/components/molecules/FormActions.svelte'

describe('FormActions — canonical form-action footer', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('bar variant wraps Cancel/Save in the card-style container', () => {
    render(FormActions, {
      props: {
        cancelLabel: 'Cancel',
        cancelHref: '/admin/blog',
        submitLabel: 'Save'
      }
    })

    const container = screen.getByRole('link', { name: 'Cancel' }).parentElement!.parentElement!
    expect(container.className).toContain('bg-[var(--card-shell-bg)]')
    expect(container.className).toContain('border-pm-border')
    expect(container.className).toContain('rounded-[var(--card-shell-radius)]')

    const cancel = screen.getByRole('link', { name: 'Cancel' })
    expect(cancel.getAttribute('href')).toBe('/admin/blog')
    expect(cancel.className).toContain('px-4')
    expect(cancel.className).toContain('text-sm')

    const submit = screen.getByRole('button', { name: 'Save' })
    expect(submit.getAttribute('type')).toBe('submit')
    expect(submit.className).toContain('bg-pm-brand')
    expect(submit.className).toContain('px-4')
    expect(submit.className).toContain('text-sm')
  })

  it('right-aligns the actions row', () => {
    render(FormActions, { props: { submitLabel: 'Save' } })
    const actions = screen.getByRole('button', { name: 'Save' }).parentElement!
    expect(actions.className).toContain('ms-auto')
  })

  it('renders only the submit action when no cancel label is given', () => {
    render(FormActions, { props: { submitLabel: 'Save' } })
    expect(screen.queryByRole('link', { name: 'Cancel' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy()
  })

  it('cancel as a button (onCancel) instead of a link (cancelHref)', async () => {
    const onCancel = vi.fn()
    render(FormActions, {
      props: { cancelLabel: 'Cancel', onCancel, submitLabel: 'Save' }
    })
    const cancel = screen.getByRole('button', { name: 'Cancel' })
    await fireEvent.click(cancel)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('divider variant renders the bordered strip without the card shell', () => {
    render(FormActions, {
      props: { variant: 'divider', cancelLabel: 'Cancel', submitLabel: 'Save' }
    })
    const container = screen.getByRole('button', { name: 'Save' }).parentElement!.parentElement!
    expect(container.className).toContain('border-t')
    expect(container.className).not.toContain('bg-[var(--card-shell-bg)]')
    expect(container.className).not.toContain('rounded-[var(--card-shell-radius)]')
  })

  it('submit button honors submitDisabled and submitType button + onSubmit', async () => {
    const onSubmit = vi.fn()
    render(FormActions, {
      props: {
        submitLabel: 'Confirm',
        submitType: 'button',
        onSubmit,
        submitDisabled: true
      }
    })
    const submit = screen.getByRole('button', { name: 'Confirm' })
    expect(submit.getAttribute('type')).toBe('button')
    // Disabled buttons must not fire click handlers (browser semantics; jsdom
    // dispatches synthetic clicks on disabled buttons, so assert state only).
    expect(submit).toHaveProperty('disabled', true)
  })

  it('calls onSubmit when submitType is button and enabled', async () => {
    const onSubmit = vi.fn()
    render(FormActions, {
      props: { submitLabel: 'Confirm', submitType: 'button', onSubmit }
    })
    const submit = screen.getByRole('button', { name: 'Confirm' })
    await fireEvent.click(submit)
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('danger submit variant for destructive confirmations', () => {
    render(FormActions, {
      props: { submitLabel: 'Delete', submitVariant: 'danger', submitType: 'button' }
    })
    expect(screen.getByRole('button', { name: 'Delete' }).className).toContain('bg-pm-danger')
  })

  it('renders hint text (left) and extra actions (before submit)', () => {
    const hint = createRawSnippet(() => ({ render: () => '<span>Unsaved changes</span>' }))
    const extra = createRawSnippet(() => ({
      render: () => '<button type="button">Discard</button>'
    }))
    render(FormActions, {
      props: { submitLabel: 'Save', hint, extra }
    })
    expect(screen.getByText('Unsaved changes')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Discard' })).toBeTruthy()
  })

  it('merges caller classes via twMerge (later class wins)', () => {
    render(FormActions, {
      props: { submitLabel: 'Save', class: 'mt-6' }
    })
    const container = screen.getByRole('button', { name: 'Save' }).parentElement!.parentElement!
    expect(container.className).toContain('mt-6')
  })
})
