import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/svelte'
import { initContent } from '$lib/stores/content.svelte'
import {
  emptyItemFormMetadata,
  hydrateItemMetadata,
  serializeItemMetadata
} from '$lib/portfolio-metadata-form'
import { normalizeItemMetadata } from '$lib/portfolio-metadata'
import BrandingViewer from '$lib/plugins/portfolio/BrandingViewer.svelte'
import type { PortfolioViewerItem } from '$lib/plugins/portfolio/types'

/**
 * Regression (review comment): saving a branding item through the admin must
 * preserve explanation paragraphs that have text but no section heading. The
 * serializer filter used to require a title, silently dropping text-only
 * sections — this test hydrates, saves and re-renders such a section across
 * the form adapter AND the public viewer contract.
 */

beforeAll(() => {
  initContent({
    'portfolio.clientUrl': 'Client URL'
  })
})

afterEach(cleanup)

describe('branding section serialization — text-only sections survive', () => {
  it('hydrates a stored text-only section into the editable form state', () => {
    const state = hydrateItemMetadata({
      clientUrl: 'https://client.example.com',
      sections: [{ title: '', text: 'Text-only paragraph.' }]
    })
    expect(state.sections).toEqual([{ title: '', text: 'Text-only paragraph.' }])
  })

  it('serializes a text-only section back into the stored metadata (no data loss)', () => {
    const state = emptyItemFormMetadata()
    state.clientUrl = 'https://client.example.com'
    state.sections = [{ title: '', text: 'Text-only paragraph.' }]
    state.gallery = [{ url: 'https://example.com/g1.png', caption: 'Shot' }]

    const serialized = serializeItemMetadata(state, 'branding')
    const parsed = JSON.parse(serialized) as {
      clientUrl?: string
      sections?: Array<{ title?: string; text?: string }>
      gallery?: Array<{ url: string; caption?: string }>
    }
    // The paragraph is preserved even though its heading is blank.
    expect(parsed.sections).toEqual([{ title: '', text: 'Text-only paragraph.' }])
    // The saved payload still validates against the branding metadata schema
    // (a blank title is allowed — the paragraph is the meaningful content;
    // the REQUIRED gallery array is present).
    expect(normalizeItemMetadata(parsed, 'branding')).not.toBeNull()
  })

  it('emits the REQUIRED gallery key even when the form has no gallery rows (media-less rows stay editable)', () => {
    const state = emptyItemFormMetadata()
    state.clientUrl = 'https://client.example.com'
    state.sections = [{ title: 'Concept', text: 'Body' }]

    const serialized = serializeItemMetadata(state, 'branding')
    const parsed = JSON.parse(serialized) as { gallery?: unknown }
    // The required key is present (empty array) — an omitted key would fail
    // the per-type schema and lock the row out of the form.
    expect(parsed.gallery).toEqual([])
    expect(normalizeItemMetadata(JSON.parse(serialized), 'branding')).not.toBeNull()
  })

  it('round-trips a text-only section through hydrate → save → public viewer', () => {
    const stored = JSON.stringify({
      clientUrl: 'https://client.example.com',
      sections: [{ title: '', text: 'Text-only paragraph.' }],
      gallery: [{ url: 'https://example.com/g1.png' }]
    })
    // Admin read: stored metadata → editable form state → serialized save.
    const state = hydrateItemMetadata(JSON.parse(stored) as Record<string, unknown>)
    const saved = serializeItemMetadata(state, 'branding')

    // Public read: the saved metadata renders the paragraph in BrandingViewer.
    const item: PortfolioViewerItem = {
      id: 1,
      itemType: 'image',
      title: 'Brand',
      category: 'Branding',
      metadata: saved
    }
    render(BrandingViewer, { props: { item, portfolioType: 'branding' } })
    expect(screen.getByText('Text-only paragraph.')).toBeTruthy()
  })
})
