import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/svelte'
import EditPageMediaHarness from '../../fixtures/EditPageMediaHarness.svelte'

/**
 * Reproduces the REAL admin edit page media section: hidden input + FileUpload
 * + PortfolioCardPreview all two-way bound to ONE coverImageUrl state.
 * Clicking X → confirm REMOVE must clear the shared state (hidden input,
 * FileUpload preview, card preview all fall back), and the form must persist
 * an empty coverImageUrl (server maps '' → null).
 */
afterEach(cleanup)

describe('edit page media section — cover removal', () => {
  it('confirming REMOVE clears the shared coverImageUrl state', async () => {
    const { container } = render(EditPageMediaHarness, {
      props: {
        coverImageUrl: '/uploads/portfolios/websites/pulsik.png',
        thumbnails: ['/uploads/portfolios/websites/thumb1.png', '/uploads/portfolios/websites/thumb2.png'],
        previewTitle: 'Card preview',
        previewHint: 'hint'
      }
    })
    // FileUpload preview is present (cover shown)
    expect(container.querySelector('img')).not.toBeNull()

    const x = container.querySelector('button[aria-label="Remove"]') as HTMLButtonElement
    await fireEvent.click(x)
    // Confirm dialog appears; click its Remove button.
    const confirmBtn = [...container.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Remove')
    expect(confirmBtn).toBeDefined()
    await fireEvent.click(confirmBtn as HTMLButtonElement)

    // The shared state must now be empty.
    const bound = container.querySelector('[data-testid="hidden-bound"]')
    expect(bound?.textContent).toBe('')
    // FileUpload's own preview must be gone (dropzone shown instead).
    const coverImg = container.querySelector('img[src="/uploads/portfolios/websites/pulsik.png"]')
    expect(coverImg).toBeNull()
  })

  it('cancelling keeps the cover', async () => {
    const { container } = render(EditPageMediaHarness, {
      props: { coverImageUrl: '/uploads/portfolios/websites/pulsik.png', previewTitle: 'Card preview' }
    })
    const x = container.querySelector('button[aria-label="Remove"]') as HTMLButtonElement
    await fireEvent.click(x)
    const cancelBtn = [...container.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Cancel')
    expect(cancelBtn).toBeDefined()
    await fireEvent.click(cancelBtn as HTMLButtonElement)
    const bound = container.querySelector('[data-testid="hidden-bound"]')
    expect(bound?.textContent).toContain('/uploads/portfolios/websites/pulsik.png')
  })
})
