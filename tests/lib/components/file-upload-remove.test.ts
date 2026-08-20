import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/svelte'
import FileUploadHarness from '../../fixtures/FileUploadHarness.svelte'

/**
 * FileUpload removal contract: with removeConfirmTitle set, the X button must
 * open the confirmation dialog and only clear the bound value after the user
 * confirms. Regression: the previous implementation called getOverlaysState()
 * from the click handler — Svelte 5 forbids getContext outside init, so the
 * handler threw lifecycle_outside_component and the cover was never removed.
 */
afterEach(cleanup)

describe('FileUpload — removal confirmation contract', () => {
  it('cancelling the confirm keeps the value', async () => {
    const { container } = render(FileUploadHarness, {
      props: {
        value: '/uploads/portfolios/websites/pulsik.png',
        removeConfirmTitle: 'Remove image?',
        removeConfirmMessage: 'The cover will be removed.',
        removeConfirmConfirm: 'Remove',
        removeConfirmCancel: 'Cancel'
      }
    })
    const x = container.querySelector('button[aria-label="Remove"]') as HTMLButtonElement
    expect(x).not.toBeNull()
    await fireEvent.click(x)
    // Confirm dialog is open — cancel it.
    const cancelBtn = [...container.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Cancel')
    expect(cancelBtn).toBeDefined()
    await fireEvent.click(cancelBtn as HTMLButtonElement)
    const bound = container.querySelector('[data-testid="bound-value"]')
    expect(bound?.textContent).toContain('/uploads/portfolios/websites/pulsik.png')
  })

  it('confirming clears the bound value (cover falls back to the collage)', async () => {
    const { container } = render(FileUploadHarness, {
      props: {
        value: '/uploads/portfolios/websites/pulsik.png',
        removeConfirmTitle: 'Remove image?',
        removeConfirmMessage: 'The cover will be removed.',
        removeConfirmConfirm: 'Remove',
        removeConfirmCancel: 'Cancel'
      }
    })
    const x = container.querySelector('button[aria-label="Remove"]') as HTMLButtonElement
    await fireEvent.click(x)
    const confirmBtn = [...container.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Remove')
    expect(confirmBtn).toBeDefined()
    await fireEvent.click(confirmBtn as HTMLButtonElement)
    const bound = container.querySelector('[data-testid="bound-value"]')
    expect(bound?.textContent).toBe('')
  })

  it('without a confirmation title, removal is instant (legacy path)', async () => {
    const { container } = render(FileUploadHarness, {
      props: { value: '/uploads/portfolios/websites/pulsik.png' }
    })
    const x = container.querySelector('button[aria-label="Remove"]') as HTMLButtonElement
    await fireEvent.click(x)
    const bound = container.querySelector('[data-testid="bound-value"]')
    expect(bound?.textContent).toBe('')
  })
})
