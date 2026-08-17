import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, within } from '@testing-library/svelte'
import { initContent } from '$lib/stores/content.svelte'
import PortfolioDetailPage from '../../../src/routes/portfolio/[slug]/+page.svelte'

/**
 * Page-orchestration tests for the PUBLIC portfolio detail route
 * (src/routes/portfolio/[slug]/+page.svelte) — the overlay lightbox journey,
 * keyboard behavior, fullscreen-to-grid switching and the edge-to-edge
 * fullscreen body region. Isolated viewer rendering lives in
 * tests/lib/components/portfolio-viewers.test.ts.
 */

beforeAll(() => {
  initContent({
    'portfolio.layoutFullscreen': 'Fullscreen',
    'portfolio.layoutGrid': 'Grid',
    'portfolio.clientUrl': 'Client URL',
    'common.close': 'Close',
    'common.lightbox': 'Lightbox',
    'common.previous': 'Previous',
    'common.next': 'Next',
    'nav.portfolio': 'Portfolio'
  })
})

afterEach(cleanup)

// Svelte 5 flushes $state updates on the microtask queue — wait a tick after
// firing events before asserting.
function tick() {
  return new Promise<void>(resolve => setTimeout(resolve, 0))
}

interface Item {
  id: number
  itemType: string
  title: string | null
  caption: string | null
  category: string | null
  description: string | null
  content: string | null
  tags: string | null
  mediaUrl: string | null
  thumbnailUrl: string | null
  metadata: string | null
}

interface PageDataShape {
  portfolio: { id: number; slug: string; name: string; type: string; description: string | null; coverImageUrl: string | null }
  items: Item[]
}

function item(partial: Partial<Item> & { id: number; itemType: string }): Item {
  return {
    title: null,
    caption: null,
    category: null,
    description: null,
    content: null,
    tags: null,
    mediaUrl: null,
    thumbnailUrl: null,
    metadata: null,
    ...partial
  }
}

function brandingData(): PageDataShape {
  return {
    portfolio: { id: 1, slug: 'branding', name: 'Branding', type: 'branding', description: 'Brand work', coverImageUrl: null },
    items: [
      item({
        id: 11,
        itemType: 'image',
        title: 'Brand 1',
        category: 'Branding',
        mediaUrl: 'https://example.com/b1.png',
        thumbnailUrl: 'https://example.com/b1-thumb.png',
        metadata: JSON.stringify({
          clientUrl: 'https://client.example.com',
          tags: ['identity'],
          sections: [{ title: 'Concept', text: 'A concept paragraph.' }],
          gallery: [{ url: 'https://example.com/b1.png' }]
        })
      })
    ]
  }
}

function websiteData(): PageDataShape {
  return {
    portfolio: { id: 2, slug: 'websites', name: 'Websites', type: 'website', description: 'Web work', coverImageUrl: null },
    items: [
      item({
        id: 21,
        itemType: 'image',
        title: 'Site A',
        caption: 'Site A',
        mediaUrl: 'https://example.com/site.png',
        metadata: JSON.stringify({
          liveUrl: 'https://example.com',
          technologies: ['SvelteKit'],
          screenshots: [
            { url: 'https://example.com/shot-1.png', caption: 'Home' },
            { url: 'https://example.com/shot-2.png', caption: 'Catalog' }
          ]
        })
      })
    ]
  }
}

/** Two-item branding portfolio — exercises the PM2 project-level lightbox nav. */
function brandingMultiData(): PageDataShape {
  return {
    portfolio: { id: 1, slug: 'branding', name: 'Branding', type: 'branding', description: 'Brand work', coverImageUrl: null },
    items: [
      item({
        id: 11,
        itemType: 'image',
        title: 'Brand 1',
        category: 'Branding',
        mediaUrl: 'https://example.com/b1.png',
        metadata: JSON.stringify({
          clientUrl: 'https://client.example.com',
          sections: [{ title: 'Concept', text: 'A concept paragraph.' }],
          gallery: [{ url: 'https://example.com/b1.png' }]
        })
      }),
      item({
        id: 12,
        itemType: 'image',
        title: 'Brand 2',
        category: 'Branding',
        mediaUrl: 'https://example.com/b2.png',
        metadata: JSON.stringify({
          clientUrl: 'https://client2.example.com',
          sections: [{ title: 'Concept 2', text: 'Second concept paragraph.' }],
          gallery: [{ url: 'https://example.com/b2.png' }]
        })
      })
    ]
  }
}

/** Branding portfolio holding a `case_study` item that still carries a valid
 *  mediaUrl (PM2 type-change migration output / the admin type matrix) — the
 *  detail lightbox must keep rendering its image via the required gallery. */
function brandingCaseStudyItemData(): PageDataShape {
  return {
    portfolio: { id: 1, slug: 'branding', name: 'Branding', type: 'branding', description: 'Brand work', coverImageUrl: null },
    items: [
      item({
        id: 13,
        itemType: 'case_study',
        title: 'Case Brand',
        category: 'Branding',
        mediaUrl: 'https://example.com/case-brand.png',
        content: '### Задача\nТело кейса.',
        metadata: JSON.stringify({
          clientUrl: 'https://client.example.com',
          gallery: [{ url: 'https://example.com/case-brand.png' }]
        })
      })
    ]
  }
}

/** Website portfolio holding a `case_study` item that still carries a valid
 *  mediaUrl — the detail lightbox must keep rendering its image. */
function websiteCaseStudyItemData(): PageDataShape {
  return {
    portfolio: { id: 2, slug: 'websites', name: 'Websites', type: 'website', description: 'Web work', coverImageUrl: null },
    items: [
      item({
        id: 22,
        itemType: 'case_study',
        title: 'Case Site',
        category: 'Web',
        mediaUrl: 'https://example.com/case-site.png',
        content: '### Идея\nПроектируем интерфейс.',
        metadata: JSON.stringify({
          liveUrl: 'https://live.example.com',
          screenshots: [{ url: 'https://example.com/case-site.png' }]
        })
      })
    ]
  }
}

function caseStudyData(): PageDataShape {
  return {
    portfolio: { id: 3, slug: 'cases', name: 'Cases', type: 'case_study', description: 'Case work', coverImageUrl: null },
    items: [
      item({
        id: 31,
        itemType: 'case_study',
        title: 'Kiosk',
        category: 'Кейс',
        content: '### Задача\nПервая строка.',
        metadata: JSON.stringify({ tags: ['kiosk'] })
      })
    ]
  }
}

describe('portfolio detail page — branding overlay journey', () => {
  it('renders branding fullscreen slides in an unconstrained edge-to-edge region', async () => {
    const { container } = render(PortfolioDetailPage, { props: { data: brandingData() } })
    await tick()

    // Fullscreen slides are the default branding layout.
    const slide = screen.getByRole('button', { name: /Brand 1/ })
    expect(slide).toBeTruthy()
    // The slide strip lives in the body's bleed Container (max-w-none, no
    // horizontal container padding) — NOT the default contained shell.
    const bodyRegion = slide.closest('.max-w-none')
    expect(bodyRegion).not.toBeNull()
    expect(bodyRegion?.classList.contains('px-0')).toBe(true)
    // The header chrome stays contained (default container).
    expect(container.querySelector('.max-w-\\[var\\(--max-w-container\\)\\]')).not.toBeNull()
  })

  it('opens the overlay viewer on slide click and closes via the close button', async () => {
    render(PortfolioDetailPage, { props: { data: brandingData() } })
    await tick()

    // Nothing is open by default — the viewer metadata is not rendered.
    expect(screen.queryByText('A concept paragraph.')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /Brand 1/ }))
    await tick()

    // The modal shows the item media + the per-type viewer content.
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeTruthy()
    expect(screen.getByText('Concept')).toBeTruthy()
    expect(screen.getByText('A concept paragraph.')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Client URL' }).getAttribute('href')).toBe('https://client.example.com')
    expect(screen.getByText('identity')).toBeTruthy()
    expect(dialog.querySelector('img')?.getAttribute('src')).toBe('https://example.com/b1.png')
    // The media-plus-thumbnail item renders ONE detail image — the stored
    // thumbnail is a preview asset (slides/cards) and must not become a second
    // gallery slide with its own counter.
    expect(dialog.querySelectorAll('img').length).toBe(1)
    expect(screen.queryByText('1 / 2')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    await tick()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByText('A concept paragraph.')).toBeNull()
  })

  it('closes the overlay with the Escape key', async () => {
    render(PortfolioDetailPage, { props: { data: brandingData() } })
    await tick()

    fireEvent.click(screen.getByRole('button', { name: /Brand 1/ }))
    await tick()
    expect(screen.getByRole('dialog')).toBeTruthy()

    fireEvent.keyDown(window, { key: 'Escape' })
    await tick()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('closes when the exposed backdrop outside the media/content panels is clicked', async () => {
    render(PortfolioDetailPage, { props: { data: brandingData() } })
    await tick()

    fireEvent.click(screen.getByRole('button', { name: /Brand 1/ }))
    await tick()

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeTruthy()
    // The media/content panels sit inside an inner wrapper, so the root
    // overlay stays exposed around them as the clickable backdrop — clicking
    // it dismisses the dialog even in the media-present two-column layout.
    expect(dialog?.querySelector('.md\\:grid-cols-2')).not.toBeNull()
    expect(dialog?.classList.contains('md:p-[var(--space-6)]')).toBe(true)

    fireEvent.click(dialog)
    await tick()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByText('A concept paragraph.')).toBeNull()
  })

  it('restores the PM2 lightbox chrome: panel sizing, pill gallery nav and project nav', async () => {
    render(PortfolioDetailPage, { props: { data: brandingMultiData() } })
    await tick()

    fireEvent.click(screen.getByRole('button', { name: /Brand 1/ }))
    await tick()

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeTruthy()
    // PM2 panel sizing: media/content split 50vh on mobile (named token),
    // full-height on md.
    expect(dialog.querySelector('.h-\\[var\\(--lightbox-panel-height-mobile\\)\\]')).not.toBeNull()
    // Content column padding matches PM2 (.lightbox-immersive-content: space-4
    // mobile, space-8 desktop).
    expect(dialog.querySelector('.p-\\[var\\(--space-4\\)\\]')).not.toBeNull()
    // Pill gallery-nav chrome (44px circular buttons + pill counter).
    expect(dialog.querySelector('.rounded-full.border.border-pm-border')).not.toBeNull()

    // Project nav chrome (PM2 .lightbox-nav-btn): for the FIRST project only
    // the NEXT button exists — bottom-right, carrying the neighbor title.
    const nextBtn = within(dialog).getByRole('button', { name: 'Brand 2' })
    expect(nextBtn.classList.contains('bottom-6')).toBe(true)
    expect(nextBtn.classList.contains('right-6')).toBe(true)
    expect(within(dialog).queryByRole('button', { name: 'Brand 1' })).toBeNull()

    // Navigating forward swaps the viewer to item 2 and reveals the PREV
    // button (bottom-left) with the first project's title.
    fireEvent.click(nextBtn)
    await tick()
    expect(screen.getByText('Second concept paragraph.')).toBeTruthy()
    expect(dialog.querySelector('img')?.getAttribute('src')).toBe('https://example.com/b2.png')
    const prevBtn = within(dialog).getByRole('button', { name: 'Brand 1' })
    expect(prevBtn.classList.contains('bottom-6')).toBe(true)
    expect(prevBtn.classList.contains('left-6')).toBe(true)
    expect(within(dialog).queryByRole('button', { name: 'Brand 2' })).toBeNull()

    // The restored chrome must not regress into duplicate slides: exactly one
    // media image is shown for the active project.
    expect(dialog.querySelectorAll('img').length).toBe(1)
  })

  it('restores the viewer readable-width constraint (PM2 800px branding/website viewer)', async () => {
    const { container } = render(PortfolioDetailPage, { props: { data: brandingData() } })
    await tick()

    fireEvent.click(screen.getByRole('button', { name: /Brand 1/ }))
    await tick()

    // The per-type viewer is centered on the PM2 readable width
    // (--max-w-viewer: 50rem = 800px) instead of stretching full-bleed.
    expect(container.querySelector('.max-w-\\[var\\(--max-w-viewer\\)\\]')).not.toBeNull()
  })

  it('renders the detail image for a case_study branding row that carries a mediaUrl', async () => {
    render(PortfolioDetailPage, { props: { data: brandingCaseStudyItemData() } })
    await tick()

    fireEvent.click(screen.getByRole('button', { name: /Case Brand/ }))
    await tick()

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeTruthy()
    // The media column renders the item's REQUIRED gallery array (the flat
    // mediaUrl fallback is gone — the migration folds the cover into gallery).
    expect(dialog.querySelector('img')?.getAttribute('src')).toBe('https://example.com/case-brand.png')
    // The case-study body still renders in the viewer content column.
    expect(screen.getByText('Задача')).toBeTruthy()
    expect(screen.getByText('Тело кейса.')).toBeTruthy()
    expect(screen.queryByText('1 / 2')).toBeNull()
  })

  it('switches from fullscreen to grid and back with the two-option mode control', async () => {
    const { container } = render(PortfolioDetailPage, { props: { data: brandingData() } })
    await tick()

    // Fullscreen active by default: the h-dvh slide strip renders.
    expect(screen.getByRole('button', { name: 'Fullscreen' }).getAttribute('aria-pressed')).toBe('true')
    expect(container.querySelector('.h-dvh')).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Grid' }))
    await tick()

    // Grid mode: slides are gone, the grid card renders, the body is contained
    // again (no bleed container), and the active option updated immediately.
    expect(container.querySelector('.h-dvh')).toBeNull()
    expect(screen.getByRole('button', { name: 'Grid' }).getAttribute('aria-pressed')).toBe('true')
    // The grid card renders the title (also in its hover-reveal overlay).
    expect(screen.getAllByText('Brand 1').length).toBeGreaterThan(0)
    expect(container.querySelector('.max-w-none')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Fullscreen' }))
    await tick()
    expect(container.querySelector('.h-dvh')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Fullscreen' }).getAttribute('aria-pressed')).toBe('true')
  })
})

describe('portfolio detail page — website overlay + gallery keyboard nav', () => {
  it('opens the overlay on card click and navigates the media gallery with arrow keys', async () => {
    render(PortfolioDetailPage, { props: { data: websiteData() } })
    await tick()

    fireEvent.click(screen.getByRole('button', { name: /Site A/ }))
    await tick()

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeTruthy()
    // Media panel shows the stored screenshots with the gallery counter and
    // the ACTIVE gallery item's own caption.
    expect(screen.getByText('1 / 2')).toBeTruthy()
    expect(screen.getByText('Home')).toBeTruthy()
    expect(dialog.querySelector('img')?.getAttribute('src')).toBe('https://example.com/shot-1.png')
    // Content panel shows the viewer's technologies.
    expect(screen.getByText('SvelteKit')).toBeTruthy()

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    await tick()
    expect(screen.getByText('2 / 2')).toBeTruthy()
    // The caption follows the active gallery entry.
    expect(screen.getByText('Catalog')).toBeTruthy()
    expect(screen.queryByText('Home')).toBeNull()
    expect(dialog.querySelector('img')?.getAttribute('src')).toBe('https://example.com/shot-2.png')

    fireEvent.keyDown(window, { key: 'Escape' })
    await tick()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('recovers when the first gallery image errors and the user navigates to a valid one', async () => {
    render(PortfolioDetailPage, { props: { data: websiteData() } })
    await tick()

    fireEvent.click(screen.getByRole('button', { name: /Site A/ }))
    await tick()

    const dialog = screen.getByRole('dialog')
    const firstImg = dialog.querySelector('img')
    expect(firstImg?.getAttribute('src')).toBe('https://example.com/shot-1.png')

    // The first gallery image fails to load → the in-component placeholder
    // shows (never a network-fetched fallback asset dependency).
    fireEvent.error(firstImg as HTMLImageElement)
    await tick()
    expect(dialog.querySelector('img')).toBeNull()
    expect(dialog.querySelector('[role="img"]')).not.toBeNull()
    expect(dialog.querySelector('img[src*="placeholder"]')).toBeNull()

    // Navigating forward resets the failed state and renders the valid second
    // image instead of staying stuck on the broken fallback.
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    await tick()
    const secondImg = dialog.querySelector('img')
    expect(secondImg?.getAttribute('src')).toBe('https://example.com/shot-2.png')
    expect(dialog.querySelector('[role="img"]')).toBeNull()
  })

  it('renders the detail image for a case_study website row that carries a mediaUrl', async () => {
    render(PortfolioDetailPage, { props: { data: websiteCaseStudyItemData() } })
    await tick()

    fireEvent.click(screen.getByRole('button', { name: /Case Site/ }))
    await tick()

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeTruthy()
    // The media column renders the item's REQUIRED screenshots array (the flat
    // mediaUrl fallback is gone).
    expect(dialog.querySelector('img')?.getAttribute('src')).toBe('https://example.com/case-site.png')
    // The case-study body still renders in the viewer content column.
    expect(screen.getByText('Идея')).toBeTruthy()
    expect(screen.getByText('Проектируем интерфейс.')).toBeTruthy()
  })
})

describe('portfolio detail page — inline types stay inline', () => {
  it('renders the case-study detail inline by default (no overlay)', async () => {
    const { container } = render(PortfolioDetailPage, { props: { data: caseStudyData() } })
    await tick()

    // The selected case-study item's content renders in the inline panel.
    expect(screen.getByText('Задача')).toBeTruthy()
    expect(screen.getByText('Первая строка.')).toBeTruthy()
    // The grid card is still present and NO dialog is open.
    expect(screen.getByRole('button', { name: /Kiosk/ })).toBeTruthy()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(container.querySelector('#portfolio-detail-panel')).not.toBeNull()
  })
})
