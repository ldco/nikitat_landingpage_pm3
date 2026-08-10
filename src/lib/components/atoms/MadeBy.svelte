<script lang="ts">
  /**
   * MadeBy — Developer/project attribution with light/dark logos
   *
   * Theme handling matches SectionF22's explicit variant pattern: light UI
   * shows the 'dark' file, dark UI shows the 'light' file. madeByLogoSrc()
   * applies the theme inversion internally — the ACTUAL theme is passed, never
   * a pre-inverted value (pre-inverting caused a double inversion that picked
   * the wrong asset for light/dark modes).
   *
   * Locale comes from the active Paraglide language tag (not URL pathname
   * slicing), so the logo follows the selected language even when the default
   * locale has no URL prefix.
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { t } from '$lib/stores/content.svelte'
  import { languageTag } from '$lib/paraglide/runtime.js'
  import { LOCALES } from '$lib/config/site'
  import { FOOTER_MADE_BY } from '$lib/config/site'
  import { madeByLogoSrc, type MadeByLogoConfig } from '$lib/utils/made-by-logo'

  let {
    text = t('footer.madeBy'),
    url = 'https://fabrica22.pro',
    basePath = '/madebylogos',
    class: className = ''
  }: {
    text?: string
    url?: string
    basePath?: string
    class?: string
  } = $props()

  const logoConfig = $derived<MadeByLogoConfig>({
    basePath,
    available: FOOTER_MADE_BY.available,
    // Branding-asset fallback (not i18n): locales without a direct made-by
    // logo file resolve through FOOTER_MADE_BY.assetLangFallback (config).
    assetLangFallback: FOOTER_MADE_BY.assetLangFallback,
    defaultLang: LOCALES[0] ?? ''
  })
  // Active Paraglide locale — the same source the header Logo and SectionF22 use.
  const lang = $derived(languageTag())
  // Explicit light/dark variants (PM v2 getLogo): light UI → 'dark' file,
  // dark UI → 'light' file. No pre-inversion before calling madeByLogoSrc.
  const lightLogo = $derived(madeByLogoSrc(logoConfig, lang, 'light'))
  const darkLogo = $derived(madeByLogoSrc(logoConfig, lang, 'dark'))

  const base = 'inline-flex items-center gap-2 text-sm text-pm-text-muted'
</script>

<div class={twMerge(clsx(base, className))}>
  <span>{text}</span>
  <a href={url} target="_blank" rel="noopener noreferrer" class="opacity-80 hover:opacity-100 transition-opacity">
    <picture>
      <source srcset={darkLogo} media="(prefers-color-scheme: dark)" />
      <img src={lightLogo} alt={t('footer.madeByLogoAlt', 'Fabrica 22')} class="h-3.5 w-auto" />
    </picture>
  </a>
</div>
