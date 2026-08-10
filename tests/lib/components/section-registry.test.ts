import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { HOMEPAGE_SECTIONS } from '$lib/config/site'
import { buildSectionProps } from '$lib/components/sections/props'
import type { SectionContent } from '$lib/components/sections/types'

const REPO_ROOT = join(__dirname, '..', '..', '..')

/**
 * Source-contract test: prevents registry ↔ renderer drift.
 *
 * SECTION_REGISTRY (framework sections + project additions) is the single
 * source of truth. SectionRenderer resolves the component DIRECTLY from the
 * registry and spreads props built by the typed prop-adapter (sections/props.ts).
 * This test keeps the pieces in lockstep by asserting:
 *   1. every HOMEPAGE_SECTIONS component resolves in the registry
 *   2. the renderer has NO hardcoded component-name dispatch (no `component ===`)
 *   3. the renderer resolves via SECTION_REGISTRY[section.component]
 *   4. the adapter maps every data-backed framework section to its content slice
 *   5. project-only sections (e.g. SectionF22) are NOT special-cased anywhere —
 *      they render with `{}` props through the same dynamic path
 */
function readSource(rel: string): string {
  return readFileSync(join(REPO_ROOT, rel), 'utf-8')
}

function extractRegistryKeys(registrySource: string): string[] {
  const keys: string[] = []
  // Match `  SectionXxx,` (shorthand), `  SectionXxx:` or a bare last key
  const re = /^\s{2}(Section\w+)(?:[:,]|$)/gm
  let m: RegExpExecArray | null
  while ((m = re.exec(registrySource)) !== null) {
    keys.push(m[1] as string)
  }
  return keys
}

/** Registry keys = framework literal + project registry (PROJECT_SECTIONS). */
function allRegistryKeys(): Set<string> {
  const framework = extractRegistryKeys(readSource('src/lib/components/sections/registry.ts'))
  const project = extractRegistryKeys(readSource('src/project/registry.ts'))
  return new Set([...framework, ...project])
}

const EMPTY_CONTENT: SectionContent = {
  blog: [], portfolioItems: [], pricing: [], faq: [], features: [],
  team: [], testimonials: [], clients: [], locale: 'ru'
}

describe('Section registry ↔ renderer contract', () => {
  it('every HOMEPAGE_SECTIONS component is registered in SECTION_REGISTRY (hero excluded — rendered by Onepager directly)', () => {
    const registryKeys = allRegistryKeys()
    for (const section of HOMEPAGE_SECTIONS) {
      // SectionHero is the documented exception: Onepager renders it directly
      // because it needs a grid layout incompatible with the Section shell.
      if (section.component === 'SectionHero') continue
      expect(registryKeys.has(section.component),
        `HOMEPAGE_SECTIONS references "${section.component}" but it is not a framework registry key`
      ).toBe(true)
    }
  })

  it('SectionRenderer has no hardcoded component-name dispatch — it resolves SECTION_REGISTRY[section.component]', () => {
    const rendererSource = readSource('src/lib/components/complex/SectionRenderer.svelte')
    // No `section.component === 'SectionX'` branch may exist: a new section
    // must render without a framework edit.
    expect(rendererSource).not.toMatch(/section\.component\s*===/)
    // The component is resolved from the registry by name.
    expect(rendererSource).toContain('SECTION_REGISTRY[section.component]')
    // Props flow through the adapter.
    expect(rendererSource).toContain('buildSectionProps')
  })

  it('the SectionF22 project special case is gone — no project component name appears in the renderer', () => {
    const rendererSource = readSource('src/lib/components/complex/SectionRenderer.svelte')
    expect(rendererSource).not.toContain('SectionF22')
    // Project sections are registered in src/project/registry.ts and merged
    // via the PROJECT_SECTIONS spread — the framework never names them.
    const registrySource = readSource('src/lib/components/sections/registry.ts')
    expect(registrySource).toContain('...PROJECT_SECTIONS')
    expect(registrySource).not.toContain('SectionF22')
  })

  it('the prop-adapter maps every data-backed framework section to its content slice', () => {
    const propsFor = (component: string) => buildSectionProps(component, EMPTY_CONTENT)
    expect(propsFor('SectionPortfolio')).toEqual({ items: [] })
    expect(propsFor('SectionBlog')).toEqual({ posts: [] })
    expect(propsFor('SectionFeatures')).toEqual({ features: [] })
    expect(propsFor('SectionFaq')).toEqual({ items: [] })
    expect(propsFor('SectionPricing')).toEqual({ tiers: [] })
    expect(propsFor('SectionTeam')).toEqual({ members: [] })
    expect(propsFor('SectionTestimonials')).toEqual({ testimonials: [] })
    expect(propsFor('SectionClients')).toEqual({ clients: [] })
  })

  it('project-only sections render without framework edits — unknown components get `{}` props', () => {
    // The adapter is the ONLY framework file that names sections. A newly
    // registered project section is not listed there, so it must receive the
    // empty props object — no special case required.
    expect(buildSectionProps('SectionBrandNew', EMPTY_CONTENT)).toEqual({})
    expect(buildSectionProps('SectionAbout', EMPTY_CONTENT)).toEqual({})
    expect(buildSectionProps('SectionFocus', EMPTY_CONTENT)).toEqual({})
    expect(buildSectionProps('SectionContact', EMPTY_CONTENT)).toEqual({})
  })

  it('registry merges project sections via PROJECT_SECTIONS spread', () => {
    const registrySource = readSource('src/lib/components/sections/registry.ts')
    expect(registrySource).toContain('...PROJECT_SECTIONS')
    const projectRegistry = readSource('src/project/registry.ts')
    expect(projectRegistry).toContain('PROJECT_SECTIONS')
    expect(projectRegistry).toMatch(/Section\w+/)
  })
})
