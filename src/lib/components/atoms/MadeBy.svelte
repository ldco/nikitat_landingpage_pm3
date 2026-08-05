<script lang="ts">
  /**
   * MadeBy — Developer/project attribution with light/dark logos
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import { page } from '$app/stores'
  import { getTheme } from '$lib/stores/theme.svelte'
  import { LOCALES } from '$lib/config/site'
  import { FOOTER_MADE_BY } from '$lib/config/site'
  import { madeByLogoSrc, type MadeByLogoConfig } from '$lib/utils/made-by-logo'

  let {
    text = m.footer_madeBy(),
    url = 'https://fabrica22.pro',
    basePath = '/madebylogos',
    class: className = ''
  }: {
    text?: string
    url?: string
    basePath?: string
    class?: string
  } = $props()

  const themeStore = $derived(getTheme())
  // PM v2: invert theme — dark mode uses 'light' logo (white on dark bg)
  //         light mode uses 'dark' logo (dark on light bg)
  const invertedTheme = $derived(themeStore.current === 'dark' ? 'light' : 'dark')
  const lang = $derived($page.url.pathname.split('/')[1] || LOCALES[0])

  const logoConfig: MadeByLogoConfig = {
    basePath,
    available: FOOTER_MADE_BY.available,
    langFallback: FOOTER_MADE_BY.langFallback,
    defaultLang: LOCALES[0] ?? ''
  }
  const logoSrc = $derived(madeByLogoSrc(logoConfig, lang, invertedTheme))

  const base = 'inline-flex items-center gap-2 text-sm text-pm-text-muted'
</script>

<div class={twMerge(clsx(base, className))}>
  <span>{text}</span>
  <a href={url} target="_blank" rel="noopener noreferrer" class="opacity-80 hover:opacity-100 transition-opacity">
    <img src={logoSrc} alt="Fabrica 22" class="h-3.5 w-auto" />
  </a>
</div>
