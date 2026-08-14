import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/svelte'
import { initContent } from '$lib/stores/content.svelte'
import BrandingViewer from '$lib/plugins/portfolio/BrandingViewer.svelte'
import WebsiteViewer from '$lib/plugins/portfolio/WebsiteViewer.svelte'
import BrandbookViewer from '$lib/plugins/portfolio/BrandbookViewer.svelte'
import CaseStudyViewer from '$lib/plugins/portfolio/CaseStudyViewer.svelte'
import type { PortfolioViewerItem } from '$lib/plugins/portfolio/types'

/**
 * Behavioral contract tests for the PM3 subtype viewers (decision record:
 * docs/traycer/new audit/findings/steps/33-n18-portfolio-viewers.md).
 * Each viewer consumes ONE selected item and renders its own per-type metadata.
 */

beforeAll(() => {
  // Deterministic labels — the unified t() reads the DB-backed store first.
  initContent({
    'portfolio.clientUrl': 'Client URL',
    'portfolio.technologies': 'Technologies',
    'portfolio.pdfDownload': 'Download PDF',
    'common.previous': 'Previous',
    'common.next': 'Next'
  })
})

afterEach(cleanup)

describe('BrandingViewer — single branding item', () => {
  const item: PortfolioViewerItem = {
    id: 1,
    itemType: 'image',
    title: 'Brand project',
    category: 'Branding',
    mediaUrl: 'https://example.com/brand.png',
    metadata: JSON.stringify({
      clientUrl: 'https://client.example.com',
      tags: ['identity'],
      sections: [{ title: 'Concept', text: 'A concept paragraph.' }]
    })
  }

  it('renders sections, tags and the client URL link from the item metadata', () => {
    render(BrandingViewer, { props: { item, portfolioType: 'branding' } })
    expect(screen.getByText('Brand project')).toBeTruthy()
    expect(screen.getByText('Concept')).toBeTruthy()
    expect(screen.getByText('A concept paragraph.')).toBeTruthy()
    expect(screen.getByText('identity')).toBeTruthy()
    const link = screen.getByRole('link', { name: 'Client URL' })
    expect(link.getAttribute('href')).toBe('https://client.example.com')
  })
})

describe('WebsiteViewer — single website item', () => {
  const item: PortfolioViewerItem = {
    id: 2,
    itemType: 'image',
    title: 'Web project',
    category: 'Web',
    mediaUrl: 'https://example.com/site.png',
    metadata: JSON.stringify({
      liveUrl: 'https://live.example.com',
      technologies: ['SvelteKit', 'SQLite'],
      screenshots: [{ url: 'https://example.com/shot.png', caption: 'Home' }]
    })
  }

  it('renders screenshots captions, technologies and the live URL', () => {
    render(WebsiteViewer, { props: { item, portfolioType: 'website' } })
    expect(screen.getByText('Web project')).toBeTruthy()
    expect(screen.getByText('Home')).toBeTruthy()
    expect(screen.getByText('SvelteKit')).toBeTruthy()
    expect(screen.getByText('Technologies')).toBeTruthy()
    const liveLink = screen.getByRole('link', { name: 'live.example.com' })
    expect(liveLink.getAttribute('href')).toBe('https://live.example.com')
  })
})

describe('BrandbookViewer — single brandbook item', () => {
  const item: PortfolioViewerItem = {
    id: 3,
    itemType: 'image',
    title: 'Brandbook',
    category: 'Guideline',
    mediaUrl: 'https://example.com/page-1.png',
    metadata: JSON.stringify({
      pdfUrl: 'https://example.com/book.pdf',
      pages: [
        { url: 'https://example.com/page-1.png', caption: 'Cover' },
        { url: 'https://example.com/page-2.png', caption: 'Colors' }
      ]
    })
  }

  const secondTwoPageItem: PortfolioViewerItem = {
    ...item,
    id: 98,
    metadata: JSON.stringify({
      pdfUrl: 'https://example.com/book.pdf',
      pages: [
        { url: 'https://example.com/page-3.png', caption: 'Page Three' },
        { url: 'https://example.com/page-4.png', caption: 'Page Four' }
      ]
    })
  }

  const singlePageItem: PortfolioViewerItem = {
    ...item,
    id: 99,
    metadata: JSON.stringify({
      pdfUrl: 'https://example.com/book.pdf',
      pages: [{ url: 'https://example.com/page-1.png', caption: 'Cover' }]
    })
  }

  it('pagination moves between pages and resets when the selected item changes', async () => {
    const { rerender } = render(BrandbookViewer, { props: { item, portfolioType: 'brandbook' } })
    expect(screen.getByText('1 / 2')).toBeTruthy()
    expect(screen.getByText('Cover')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    await Promise.resolve()
    expect(screen.getByText('2 / 2')).toBeTruthy()
    expect(screen.getByText('Colors')).toBeTruthy()

    // Selecting a DIFFERENT item resets the page to 1 — the new item's first
    // page shows, never the previous item's second page.
    await rerender({ item: secondTwoPageItem })
    await Promise.resolve()
    expect(screen.getByText('1 / 2')).toBeTruthy()
    expect(screen.getByText('Page Three')).toBeTruthy()
    expect(screen.queryByText('Page Four')).toBeNull()

    // A shorter item never indexes past its pages (counter hidden, first page).
    await rerender({ item: singlePageItem })
    await Promise.resolve()
    expect(screen.queryByText('1 / 2')).toBeNull()
    expect(screen.getByText('Cover')).toBeTruthy()
  })

  it('renders the PDF download link', () => {
    render(BrandbookViewer, { props: { item, portfolioType: 'brandbook' } })
    const download = screen.getByRole('link', { name: 'Download PDF' })
    expect(download.getAttribute('href')).toBe('https://example.com/book.pdf')
  })
})

describe('CaseStudyViewer — single case-study item', () => {
  const item: PortfolioViewerItem = {
    id: 4,
    itemType: 'case_study',
    title: 'Case',
    category: 'Кейс',
    description: 'Desc',
    content: '### Задача\nПервая строка.\n### Решение\nВторая строка.',
    tags: '["kiosk"]',
    metadata: JSON.stringify({ tags: ['ux'] })
  }

  it('renders heading/text blocks and merges metadata + legacy column tags', () => {
    render(CaseStudyViewer, { props: { item, portfolioType: 'case_study' } })
    expect(screen.getByText('Задача')).toBeTruthy()
    expect(screen.getByText('Первая строка.')).toBeTruthy()
    expect(screen.getByText('Решение')).toBeTruthy()
    expect(screen.getByText('Вторая строка.')).toBeTruthy()
    expect(screen.getByText('ux')).toBeTruthy()
    expect(screen.getByText('kiosk')).toBeTruthy()
  })
})
