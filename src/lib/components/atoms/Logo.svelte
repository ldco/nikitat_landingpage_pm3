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
  import { resolveBrandLogoLang, type BrandLogoConfig } from '$lib/utils/brand-logo'
  import * as runtime from '$lib/paraglide/runtime.js'

  const logoConfig: BrandLogoConfig = {
    basePath: LOGO.basePath,
    available: LOGO.available,
    // Branding-asset fallback (not i18n): locales without a direct logo file
    // resolve through LOGO.assetLangFallback (project config); locales with
    // a direct file (detected from `available`) never consult the map.
    assetLangFallback: LOGO.assetLangFallback,
    defaultLang: LOCALES[0] ?? ''
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

  // Resolve locale with the SHARED branding rule (same as made-by flow).
  const currentLocale = $derived(locale ?? runtime.languageTag())
  const effectiveLang = $derived(resolveBrandLogoLang(logoConfig, currentLocale))

  // PM v2: invert theme — dark mode uses 'light' logo, light mode uses 'dark' logo
  const themeStore = getTheme()
  const currentTheme = $derived(theme ?? themeStore.current)
  const invertedTheme = $derived(currentTheme === 'dark' ? 'light' : 'dark')

  // Build reactive src path (client-side)
  const src = $derived.by(() => {
    const logoAvailable = new Set(logoConfig.available)
    const primary = `${shape}_${invertedTheme}_${effectiveLang}`
    if (logoAvailable.has(primary)) return `${logoConfig.basePath}/${primary}.svg`
    const fallback = `${shape}_${invertedTheme}_en`
    if (logoAvailable.has(fallback)) return `${logoConfig.basePath}/${fallback}.svg`
    return `${logoConfig.basePath}/horizontal_dark_en.svg`
  })

  // SSR fallback paths (app-nuxt: ssrLightLogo / ssrDarkLogo)
  const ssrDarkSrc = $derived(`${logoConfig.basePath}/${shape}_light_${effectiveLang}.svg`)
  const ssrLightSrc = $derived(`${logoConfig.basePath}/${shape}_dark_${effectiveLang}.svg`)

  // Mounted flag for ClientOnly-like behavior (avoids SSR hydration mismatch)
  let mounted = $state(false)
  onMount(() => { mounted = true })

  const sizeClass = $derived(shape === 'circle' ? 'w-full h-auto' : 'h-[var(--logo-desktop-height)] w-auto')
const imgClass = $derived(twMerge(clsx(sizeClass, 'object-contain', className)))
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
