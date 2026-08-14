import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const REPO_ROOT = join(__dirname, '..', '..')

function readSource(rel: string): string {
  return readFileSync(join(REPO_ROOT, rel), 'utf-8')
}

/**
 * Source-contract test: both routing modes must load the SAME typed section
 * content so SectionRenderer receives identical data on the homepage
 * (onepager) and on the standalone [section] page (non-onepager).
 *
 *   1. +page.server.ts (homepage) delegates to the shared loader
 *   2. [section]/+page.server.ts delegates to the SAME shared loader
 *   3. [section]/+page.svelte forwards the loaded SectionContent to
 *      SectionRenderer (same call shape as Onepager)
 */
describe('Section content in both routing modes', () => {
  it('homepage +page.server.ts loads content via the shared loader', () => {
    const src = readSource('src/routes/+page.server.ts')
    expect(src).toContain('loadSectionContent')
    expect(src).not.toContain('getHomepagePosts')
    expect(src).not.toContain('drizzle-orm')
  })

  it('[section]/+page.server.ts validates the section AND loads content via the same shared loader', () => {
    const src = readSource('src/routes/[section]/+page.server.ts')
    expect(src).toContain("import { loadSectionContent } from '$lib/server/services/section-content'")
    expect(src).toContain('loadSectionContent(locale, section.id)')
    expect(src).toContain('return { section, sectionContent')
  })

  it('[section]/+page.svelte passes the server-loaded SectionContent to SectionRenderer', () => {
    const src = readSource('src/routes/[section]/+page.svelte')
    expect(src).toContain('sectionContent')
    expect(src).toContain('<SectionRenderer sectionId={section.id} content={data.sectionContent} />')
  })

  it('the shared loader feeds every data-backed section type', () => {
    const src = readSource('src/lib/server/services/section-content.ts')
    for (const slice of ['blog', 'portfolios', 'pricing', 'faq', 'features', 'team', 'testimonials', 'clients']) {
      expect(src).toContain(slice)
    }
    expect(src).toContain('SectionContent')
  })
})
