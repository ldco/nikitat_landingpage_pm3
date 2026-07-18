import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf-8')
}

function readCssFiles(path: string, files: string[] = []): string[] {
  const absolutePath = resolve(process.cwd(), path)

  for (const entry of readdirSync(absolutePath, { withFileTypes: true })) {
    const childPath = `${path}/${entry.name}`

    if (entry.isDirectory()) {
      readCssFiles(childPath, files)
    } else if (entry.isFile() && entry.name.endsWith('.css')) {
      files.push(childPath)
    }
  }

  return files
}

function stripCssComments(content: string): string {
  return content.replace(/\/\*[\s\S]*?\*\//g, match =>
    match
      .split('\n')
      .map(() => '')
      .join('\n')
  )
}

describe('Style system contracts', () => {
  it('defines heading utility classes', () => {
    const textCss = readProjectFile('app/assets/css/common/text.css')

    expect(textCss).toContain('.text-xs')
    expect(textCss).toContain('.text-sm')
    expect(textCss).toContain('.text-base')
    expect(textCss).toContain('.text-lg')
    expect(textCss).toContain('.text-xl')
  })

  it('defines font-black token', () => {
    const typographyVars = readProjectFile('app/assets/css/typography/variables.css')
    expect(typographyVars).toContain('--font-black')
  })

  it('defines every CSS custom property used without a fallback', () => {
    const cssFiles = readCssFiles('app/assets/css')
    const definitions = new Set<string>()
    const missing: string[] = []

    for (const file of cssFiles) {
      const content = stripCssComments(readProjectFile(file))

      for (const match of content.matchAll(/(^|[;{\s])(--[\w-]+)\s*:/g)) {
        definitions.add(match[2]!)
      }
    }

    for (const file of cssFiles) {
      const content = stripCssComments(readProjectFile(file))

      for (const match of content.matchAll(/var\(\s*(--[\w-]+)\s*(,)?/g)) {
        const token = match[1]!
        const hasFallback = Boolean(match[2])

        if (!hasFallback && !definitions.has(token)) {
          const line = content.slice(0, match.index).split('\n').length
          missing.push(`${file}:${line} ${token}`)
        }
      }
    }

    expect(missing).toEqual([])
  })

  it('defines explicit stack and form-to-action spacing contracts', () => {
    const inputsCss = readProjectFile('app/assets/css/ui/forms/inputs.css')

    expect(inputsCss).toContain('.stack > * + *')
    expect(inputsCss).toContain('.form-grid + .page-actions')
    expect(inputsCss).toContain('.grid + .cta')
  })

  it('ships segmented control reusable styles', () => {
    const inputsCss = readProjectFile('app/assets/css/ui/forms/inputs.css')

    expect(inputsCss).toContain('.segmented-control')
    expect(inputsCss).toContain('.segmented-control__item')
  })

  it('keeps data-table readability defaults', () => {
    const dataTableCss = readProjectFile('app/assets/css/ui/content/data-table.css')

    expect(dataTableCss).toContain('table-layout: auto')
    expect(dataTableCss).toContain('.actions-col')
    expect(dataTableCss).toContain('min-width: 8.5rem')
  })

  it('keeps icon action hover contrast and button border contracts', () => {
    const buttonCss = readProjectFile('app/assets/css/ui/forms/buttons.css')

    expect(buttonCss).toContain('.btn-icon.btn-ghost:not(.btn-danger)')
    expect(buttonCss).toContain('.btn-primary')
    expect(buttonCss).toContain('border: 1px solid')
  })

  it('standardizes onepager scene wrapper contract via shared renderer', () => {
    const renderer = readProjectFile('app/components/organisms/SectionRenderer.vue')
    const sectionsCss = readProjectFile('app/assets/css/layout/sections.css')

    expect(renderer).toContain("'scene-full-bleed': useScrollytelling")
    expect(renderer).toContain('config?.useScrollytelling ?? false')
    expect(renderer).toContain('v-scrolly-scene')
    expect(sectionsCss).toContain('.onepager .scene-full-bleed')
    expect(sectionsCss).toContain('width: 100vw')
    expect(sectionsCss).toContain('max-width: var(--content-default)')
  })

  it('formalizes admin nav alignment contract by mode', () => {
    const adminHeaderCss = readProjectFile('app/assets/css/layout/admin-header.css')
    const sidebarNavCss = readProjectFile('app/assets/css/skeleton/nav.css')

    // Horizontal mode: centered nav cluster
    expect(adminHeaderCss).toContain('.admin-header-nav')
    expect(adminHeaderCss).toContain('justify-content: center')

    // Vertical mode: top-anchored navigation, footer pushed to bottom
    expect(sidebarNavCss).toContain('.sidebar-nav')
    expect(sidebarNavCss).toContain('flex: 1')
    expect(sidebarNavCss).toContain('.sidebar-footer')
    expect(sidebarNavCss).toContain('margin-block-start: auto')
  })

  it('switches the site header to mobile navigation before page desktop layout', () => {
    const breakpointsCss = readProjectFile('app/assets/css/layout/breakpoints.css')
    const headerCss = readProjectFile('app/assets/css/skeleton/header.css')

    expect(breakpointsCss).toContain('@custom-media --header-mobile (max-width: 1119px)')
    expect(breakpointsCss).toContain('@custom-media --header-desktop (min-width: 1120px)')
    expect(headerCss).toContain('@media (--header-mobile)')
    expect(headerCss).toContain('@media (--header-desktop)')
    expect(headerCss).toContain('.header-mobile-contact')
  })
})
