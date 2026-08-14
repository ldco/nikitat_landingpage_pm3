import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/svelte'
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
          sections: [{ title: 'Concept', text: 'A concept paragraph.' }]
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
