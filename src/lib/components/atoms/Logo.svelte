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
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { getTheme } from '$lib/stores/theme.svelte'
  import { LOGO } from '$lib/config/site'
  import * as runtime from '$lib/paraglide/runtime.js'

  const LOGO_BASE = LOGO.basePath
  const LOGO_AVAILABLE = new Set(LOGO.available)
  const LANG_FALLBACK = LOGO.langFallback as Record<string, string>

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
    // Check if this language has a direct logo variant
    const hasDirect = [...LOGO_AVAILABLE].some(name => name.endsWith(`_${lang}`))
    if (hasDirect) return lang
    // Use fallback from config
    if (LANG_FALLBACK[lang]) return LANG_FALLBACK[lang]
    // Ultimate fallback: english
    return 'en'
  })

  // PM v2: invert theme — dark mode uses 'light' logo, light mode uses 'dark' logo
  const themeStore = getTheme()
  const currentTheme = $derived(theme ?? themeStore.current)
  const invertedTheme = $derived(currentTheme === 'dark' ? 'light' : 'dark')

  // Build path with fallback chain: shape_theme_lang → shape_theme_en → horizontal_dark_en
  const src = $derived.by(() => {
    const primary = `${shape}_${invertedTheme}_${effectiveLang}`
    if (LOGO_AVAILABLE.has(primary)) return `${LOGO_BASE}/${primary}.svg`

    const fallback = `${shape}_${invertedTheme}_en`
    if (LOGO_AVAILABLE.has(fallback)) return `${LOGO_BASE}/${fallback}.svg`

    // Ultimate fallback
    return `${LOGO_BASE}/horizontal_dark_en.svg`
  })
</script>

{#if src}
  <img {src} {alt} class={twMerge(clsx('h-8 w-auto', className))} />
{/if}
