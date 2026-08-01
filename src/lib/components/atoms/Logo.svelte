<script lang="ts">
  /**
   * Logo — Theme+locale aware SVG logo
   * PM v2: useLogo.ts (117 lines)
   *
   * THEME INVERSION: 'dark' mode → 'light' logo, 'light' mode → 'dark' logo
   * (White logo on dark background, dark logo on light background)
   *
   * Fallback chain: shape_theme_lang → shape_theme_en → horizontal_dark_en
   *
   * Rule #1: class prop + twMerge
   */
  import { browser } from '$app/environment'
  import { onMount } from 'svelte'
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { getTheme } from '$lib/stores/theme.svelte'
  import { LOGO, LOCALES } from '$lib/config/site'
  import * as runtime from '$lib/paraglide/runtime.js'

  const LOGO_BASE = LOGO.basePath
  const LOGO_AVAILABLE = new Set(LOGO.available)
  function makeFallbackMap(list: readonly string[]): Record<string, string> {
    const map: Record<string, string> = {}
    const first = list[0]
    if (first) for (const l of list) map[l] = first
    return map
  }
  const FALLBACK_MAP = makeFallbackMap(LOCALES)
  function resolveLang(lang: string): string {
    return FALLBACK_MAP[lang] ?? LOCALES[0] ?? ''
  }

  type Shape = 'horizontal' | 'circle'

  let {
    shape = 'horizontal',
    locale,
    theme,
    alt = '',
    class: className = ''
  }: {
    shape?: Shape
    locale?: string
    theme?: 'light' | 'dark'
    alt?: string
    class?: string
  } = $props()

  // Resolve locale with fallback chain
  const currentLocale = $derived(locale ?? runtime.languageTag())
  const effectiveLang = $derived.by(() => {
    const lang = currentLocale
    const hasDirect = [...LOGO_AVAILABLE].some(name => name.endsWith(`_${lang}`))
    if (hasDirect) return lang
    return resolveLang(lang)
  })

  // PM v2: invert theme — dark mode uses 'light' logo, light mode uses 'dark' logo
  const themeStore = getTheme()
  const currentTheme = $derived(theme ?? themeStore.current)
  const invertedTheme = $derived(currentTheme === 'dark' ? 'light' : 'dark')

  // Build reactive src path (client-side)
  const src = $derived.by(() => {
    const primary = `${shape}_${invertedTheme}_${effectiveLang}`
    if (LOGO_AVAILABLE.has(primary)) return `${LOGO_BASE}/${primary}.svg`
    const fallback = `${shape}_${invertedTheme}_en`
    if (LOGO_AVAILABLE.has(fallback)) return `${LOGO_BASE}/${fallback}.svg`
    return `${LOGO_BASE}/horizontal_dark_en.svg`
  })

  // SSR fallback paths (app-nuxt: ssrLightLogo / ssrDarkLogo)
  const ssrDarkSrc = $derived(`${LOGO_BASE}/${shape}_light_${effectiveLang}.svg`)
  const ssrLightSrc = $derived(`${LOGO_BASE}/${shape}_dark_${effectiveLang}.svg`)

  // Mounted flag for ClientOnly-like behavior (avoids SSR hydration mismatch)
  let mounted = $state(false)
  onMount(() => { mounted = true })

  const imgClass = $derived(twMerge(clsx('h-full w-auto object-contain', className)))
</script>

{#if src}
  {#if mounted}
    <img {src} {alt} class={imgClass} />
  {:else}
    <picture>
      <source srcset={ssrDarkSrc} media="(prefers-color-scheme: dark)" />
      <img src={ssrLightSrc} {alt} class={imgClass} />
    </picture>
  {/if}
{/if}
