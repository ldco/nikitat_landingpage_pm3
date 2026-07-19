<script lang="ts">
  /**
   * Logo — Theme+locale aware SVG logo
   *
   * Resolves path as: /logos/{shape}_{theme}_{lang}.svg
   * Falls back: shape → shape_dark_en → empty
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { getTheme } from '$lib/stores/theme.svelte'
  import { LOGO } from '$lib/config/site'
  import * as runtime from '$lib/paraglide/runtime.js'

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

  const currentLocale = $derived(locale ?? runtime.languageTag())
  const langFallback: Record<string, string> = LOGO.langFallback as Record<string, string>
  const resolvedLang = $derived(langFallback[currentLocale] ?? 'en')

  // Try: horizontal_dark_en, then horizontal_dark, then horizontal, then empty
  const available = $derived(new Set(LOGO.available))
  const themeStore = getTheme()
  const currentTheme = $derived(theme ?? themeStore.current)
  const src = $derived.by(() => {
    const themeVar = theme ?? themeStore.current
    const t = `${shape}_${themeVar}_${resolvedLang}`
    const t2 = `${shape}_${themeVar}`
    const t3 = shape
    const urls = [t, t2, t3]
    for (const v of urls) {
      if (available.has(v)) return `${LOGO.basePath}/${v}.svg`
    }
    return ''
  })
</script>

{#if src}
  <img {src} {alt} class={twMerge(clsx('h-8 w-auto', className))} />
{/if}
