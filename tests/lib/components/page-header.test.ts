import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/svelte'
import { createRawSnippet } from 'svelte'
import { compile } from 'svelte/compiler'
import { render as renderSSR } from 'svelte/server'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import PageHeader from '$lib/components/atoms/PageHeader.svelte'

const REPO_ROOT = join(__dirname, '..', '..', '..')

/**
 * Regression test (review comment 1): the admin page title used to be gated on
 * a client-side media query (useMediaQuery defaulting to desktop during SSR).
 * That rendered the desktop <h1> into the mobile SSR HTML, so the title was
 * duplicated on phones until hydration — or forever with JavaScript disabled.
 *
 * The regression is asserted on RUNTIME output in two layers:
 *   1. Component (post-hydration): with the media query reporting a mobile
 *      viewport, the h1 must stay mounted and be hidden purely via CSS.
 *   2. SSR HTML (before hydration / no JS): the title block must be present
 *      in the server-rendered markup WITH Tailwind breakpoint visibility
 *      classes (`hidden lg:block`), so a mobile viewport hides it without JS.
 */
function installMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    media: '',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn()
  })
}

/**
 * Server-side render PageHeader to HTML from its actual source, so the
 * assertion depends on the real SSR output (not on source-text patterns).
 */
async function renderPageHeaderSSR(props: Record<string, unknown>): Promise<string> {
  const source = readFileSync(
    join(REPO_ROOT, 'src/lib/components/atoms/PageHeader.svelte'),
    'utf-8'
  )
  const { js } = compile(source, { generate: 'server', filename: 'PageHeader.svelte' })

  // The compiler emits ESM with bare specifiers; remap them to absolute file
  // URLs so the module can be evaluated without Vite's client transform.
  const require = createRequire(import.meta.url)
  const toFileUrl = (p: string) => pathToFileURL(p).href
  const code = js.code
    .replaceAll(
      "'svelte/internal/server'",
      JSON.stringify(toFileUrl(join(REPO_ROOT, 'node_modules/svelte/src/internal/server/index.js')))
    )
    .replaceAll("'clsx'", JSON.stringify(toFileUrl(require.resolve('clsx'))))
    .replaceAll("'tailwind-merge'", JSON.stringify(toFileUrl(require.resolve('tailwind-merge'))))

  const mod = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'))
  const { html } = renderSSR(mod.default, { props })
  return html
}

describe('PageHeader — SSR-visible title (no viewport-based DOM gating)', () => {
  afterEach(() => {
    cleanup()
    // restoreAllMocks only unwraps spies; the window.matchMedia assignment
    // (jsdom has no native matchMedia) must be removed explicitly.
    vi.restoreAllMocks()
    delete (window as { matchMedia?: unknown }).matchMedia
  })

  it('SSR HTML always contains the title block with CSS breakpoint visibility (before hydration / no JS)', async () => {
    const html = await renderPageHeaderSSR({ title: 'Dashboard', subtitle: 'Overview' })

    // The h1 is always present in the server-rendered markup (single title
    // source per route) — NOT removed by a JS media query. A mobile viewport
    // hides it purely via the `hidden lg:block` classes, so no duplicate
    // title is visible before hydration or with JavaScript disabled.
    expect(html).toContain('<div class="hidden lg:block min-w-0">')
    expect(html).toContain('<h1 class="text-3xl font-bold leading-tight">Dashboard</h1>')
    // Subtitle lives in the same SSR-visible, CSS-hidden block.
    expect(html).toContain('Overview')
  })

  it('keeps the h1 in the DOM on a mobile viewport after hydration, hidden below lg via CSS only', () => {
    // Simulate hydration on a phone: the media query reports "not desktop".
    // Before the fix, this removed the h1 from the DOM (JS-dependent), and the
    // SSR HTML (defaultMatch = desktop) showed the duplicate title pre-hydration.
    installMatchMedia(false)
    render(PageHeader, { props: { title: 'Dashboard', subtitle: 'Overview' } })

    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent).toBe('Dashboard')

    // The title block must stay mounted regardless of viewport — visibility is
    // delegated to Tailwind breakpoint classes, so no JS is needed to hide it
    // on phones and the initial SSR HTML is correct on every viewport.
    const titleBlock = h1.parentElement
    expect(titleBlock).not.toBeNull()
    expect(titleBlock!.className).toContain('hidden lg:block')
    expect(titleBlock!.className).toContain('min-w-0')

    // Subtitle lives in the same SSR-visible, CSS-hidden block.
    expect(screen.getByText('Overview').textContent).toBe('Overview')
  })

  it('renders the h1 with the correct size variant (sm)', () => {
    installMatchMedia(true)
    render(PageHeader, { props: { title: 'Create', size: 'sm' } })

    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent).toBe('Create')
    expect(h1.className).toContain('text-xl font-bold')
  })

  it('keeps itemCount and actions visible on every viewport (not part of the hidden title block)', () => {
    installMatchMedia(false)
    const actions = createRawSnippet(() => ({ render: () => '<button type="button">Add</button>' }))
    render(PageHeader, { props: { title: 'Users', itemCount: 3, actions } })

    expect(screen.getByText('3').textContent).toBe('3')
    expect(screen.getByRole('button', { name: 'Add' })).toBeTruthy()
  })
})
