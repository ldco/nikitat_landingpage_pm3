<script lang="ts">
  /**
   * Root Layout — Shell: header, footer, theme, content store, page transitions
   */
  import '../app.css'
  import { clsx } from 'clsx'
  import { untrack } from 'svelte'
  import { page } from '$app/stores'
  import { fade, slide, scale, fly } from 'svelte/transition'
  import { FEATURES, LOCALES } from '$lib/config/site'
  import { initTheme } from '$lib/stores/theme.svelte'
import { useSettings } from '$lib/stores/settings.svelte'
  import { initContent } from '$lib/stores/content.svelte'
  import { checkA11y } from '$lib/utils/a11y'
  import { scrollSpy } from '$lib/actions/scrollSpy'
  import { initPerformance, resetPerformance, sendPerformanceReport } from '$lib/utils/performance'
  import { afterNavigate } from '$app/navigation'
  import TheHeader from '$lib/components/complex/TheHeader.svelte'
  import TheFooter from '$lib/components/complex/TheFooter.svelte'
  import BackToTop from '$lib/components/atoms/BackToTop.svelte'
  import CookieConsent from '$lib/components/complex/CookieConsent.svelte'
  import OverlayProvider from '$lib/components/complex/OverlayProvider.svelte'
  import ProjectAmbient from '../project/ProjectAmbient.svelte'
  import type { LayoutData } from './$types'

import { browser } from '$app/environment'
import { syncLocaleFromHtml } from '$lib/stores/locale.svelte'

// BOOTSTRAP-ONLY hydration sync: align the reactive locale store with the SSR
// <html lang> attribute BEFORE the first render (the Paraglide strategy may
// not fire early enough on the client). It runs once per page load and is NOT
// the language-switch mechanism — subsequent locale changes are handled by
// LangSwitcher (setLocale() + client-side goto), which updates the runtime
// locale, the reactive store, and the <html lang>/dir attributes.
if (browser) {
  syncLocaleFromHtml()
}


  let { data, children }: { data: LayoutData; children?: import('svelte').Snippet } = $props()
  const isOnepager = $derived(FEATURES.onepager)
  
  // Initialize theme
  initTheme()
  // Core Web Vitals monitoring (client-only, no-op server-side)
  if (browser) {
    initPerformance()
    // SPA navigations never fire pagehide — report + reset per navigation
    afterNavigate(() => {
      sendPerformanceReport()
      resetPerformance()
    })
    // Runtime WCAG 2.1 AA audit (dev only, axe-core) — PM v2 useA11y parity
    if (import.meta.env.DEV) {
      void checkA11y('#main-content')
    }
  }
  // Content translations: call synchronously during setup (SSR needs this)
  // and in $effect for client-side navigation updates (locale changes)
  // SSR needs sync init; $effect for client nav. data captured at init is intentional.
  initContent(untrack(() => data.contentTranslations ?? {}))
  useSettings(untrack(() => data.publicSettings ?? {}))
  $effect(() => {
    // SSR needs sync init; $effect for client nav. data captured at init is intentional.
  initContent(data.contentTranslations ?? {})
  })
  const transitionType = $derived(!isOnepager ? FEATURES.pageTransitions : '')
  const isVerticalNav = $derived(FEATURES.verticalNav)

  // One config map drives every page-transition branch — no repeated
  // `{#if transitionType === ...}` blocks with duplicated duration literals.
  // Destructured to plain identifiers so the `transition:` directive (which
  // requires a bare identifier, not a member expression) can use them.
  const { fn: transitionFn, params: transitionParams } = $derived.by(() => {
    const duration = 200
    switch (transitionType) {
      case 'slide-left': return { fn: slide, params: { duration, axis: 'x' as const } }
      case 'slide-up': return { fn: slide, params: { duration, axis: 'y' as const } }
      case 'scale': return { fn: scale, params: { duration, start: 0.95 } }
      case 'zoom': return { fn: scale, params: { duration, start: 1.1 } }
      case 'flip': return { fn: fly, params: { duration, x: 300 } }
      default: return { fn: fade, params: { duration } }
    }
  })

  // Admin shell detection. $page.url.pathname is the ADDRESS-BAR URL — during
  // a locale switch the client navigates to the same rerouted admin route but
  // with a locale prefix in the URL, so pathname.startsWith('/admin') fails
  // and the website header would render over the admin page. $page.route.id is
  // the canonical (rerouted) route id, so it is the reliable source; the
  // pathname check is kept as a fallback after stripping any locale prefix.
  // Strip any locale prefix from the pathname before the /admin check.
  // Built from LOCALES so the pattern never drifts from the configured set.
  const localePrefixPattern = $derived(
    new RegExp(`^/(${LOCALES.map(l => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?=/|$)`)
  )
  const isAdminRoute = $derived(
    ($page.route.id ?? '').startsWith('/admin') ||
    (() => {
      const pathname = $page.url.pathname
      const withoutLocale = pathname.replace(localePrefixPattern, '')
      return withoutLocale.startsWith('/admin')
    })()
  )
</script>

<OverlayProvider>
{#if !isAdminRoute}
  <ProjectAmbient />
  <TheHeader />
{/if}
<main id="main-content" class={clsx(!isAdminRoute && 'min-h-screen', !isAdminRoute && (isVerticalNav ? 'ms-16' : ''))} use:scrollSpy>
  {#key $page.url.pathname}
    <div transition:transitionFn={{ ...transitionParams }}>{@render children?.()}</div>
  {/key}
</main>
{#if !isAdminRoute}
    <TheFooter legalDocs={data.legalDocuments} />
{#if FEATURES.backToTop}
<BackToTop />
{/if}
  <CookieConsent />
{/if}
</OverlayProvider>
