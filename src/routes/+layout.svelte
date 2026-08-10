<script lang="ts">
  /**
   * Root Layout — Shell: header, footer, theme, content store, page transitions
   */
  import '../app.css'
  import { clsx } from 'clsx'
  import { page } from '$app/stores'
  import { fade, slide, scale, fly } from 'svelte/transition'
  import { FEATURES } from '$lib/config/site'
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

import { setLanguageTag, isAvailableLanguageTag } from '$lib/paraglide/runtime.js'
import { browser } from '$app/environment'

// Ensure Paraglide locale matches the SSR lang attribute BEFORE hydration
// (Paraglide-SvelteKit strategy may not fire early enough, causing
// system translations to render in the default locale on the client)
if (browser) {
  const lang = document.documentElement.lang
  if (lang && isAvailableLanguageTag(lang)) {
    setLanguageTag(lang)
  }
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
  initContent(data.contentTranslations ?? {})
  useSettings(data.publicSettings as Record<string, string | null> ?? {})
  $effect(() => {
    // SSR needs sync init; $effect for client nav. data captured at init is intentional.
  initContent(data.contentTranslations ?? {})
  })
  const transitionType = $derived(!isOnepager ? FEATURES.pageTransitions : '')
  const isVerticalNav = $derived(FEATURES.verticalNav)
</script>

<OverlayProvider>
{#if !$page.url.pathname.startsWith('/admin')}
  <ProjectAmbient />
  <TheHeader />
{/if}
<main id="main-content" class={clsx('min-h-screen', !$page.url.pathname.startsWith('/admin') && (isVerticalNav ? 'ms-16' : ''))} use:scrollSpy>
  {#key $page.url.pathname}
    {#if transitionType === 'fade'}
      <div transition:fade={{ duration: 200 }}>{@render children?.()}</div>
    {:else if transitionType === 'slide-left'}
      <div transition:slide={{ duration: 200, axis: 'x' }}>{@render children?.()}</div>
    {:else if transitionType === 'slide-up'}
      <div transition:slide={{ duration: 200, axis: 'y' }}>{@render children?.()}</div>
    {:else if transitionType === 'scale'}
      <div transition:scale={{ duration: 200, start: 0.95 }}>{@render children?.()}</div>
    {:else if transitionType === 'zoom'}
      <div transition:scale={{ duration: 200, start: 1.1 }}>{@render children?.()}</div>
    {:else if transitionType === 'flip'}
      <div transition:fly={{ duration: 200, x: 300 }}>{@render children?.()}</div>
    {:else}
      <div transition:fade={{ duration: 200 }}>{@render children?.()}</div>
    {/if}
  {/key}
</main>
{#if !$page.url.pathname.startsWith('/admin')}
    <TheFooter legalDocs={data.legalDocuments} />
{#if FEATURES.backToTop}
<BackToTop />
{/if}
  <CookieConsent />
{/if}
</OverlayProvider>
