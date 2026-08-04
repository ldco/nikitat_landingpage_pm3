import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { HOMEPAGE_SECTIONS } from '$lib/config/site'

const REPO_ROOT = join(__dirname, '..', '..', '..')

/**
 * Source-contract test: prevents registry ↔ renderer drift.
 *
 * SECTION_REGISTRY (framework sections + project additions) is the single
 * source of truth. SectionRenderer dispatches via a static branch chain
 * (a Svelte 5 limitation — no runtime dynamic component dispatch). This test
 * keeps the two in lockstep by asserting:
 *   1. every HOMEPAGE_SECTIONS component resolves in the registry
 *   2. every framework registry key has a dispatch branch in SectionRenderer
 */
function readSource(rel: string): string {
  return readFileSync(join(REPO_ROOT, rel), 'utf-8')
}

function extractRegistryKeys(registrySource: string): string[] {
  const keys: string[] = []
  // Match `  SectionXxx,` (shorthand) or `  SectionXxx:` entries in the
  // FRAMEWORK_SECTIONS object literal
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

  it('every registry key (framework + project) has a dispatch branch in SectionRenderer', () => {
    const rendererSource = readSource('src/lib/components/complex/SectionRenderer.svelte')
    for (const key of allRegistryKeys()) {
      expect(
        rendererSource.includes(`section.component === '${key}'`),
        `SectionRenderer has no dispatch branch for registered section "${key}"`
      ).toBe(true)
    }
  })

  it('registry merges project sections via PROJECT_SECTIONS spread', () => {
    const registrySource = readSource('src/lib/components/sections/registry.ts')
    expect(registrySource).toContain('...PROJECT_SECTIONS')
    const projectRegistry = readSource('src/project/registry.ts')
    expect(projectRegistry).toContain('PROJECT_SECTIONS')
    expect(projectRegistry).toMatch(/Section\w+/)
  })
})
