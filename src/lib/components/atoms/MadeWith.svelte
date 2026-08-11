<script lang="ts">
  /**
   * MadeWith — "Made with Puppet Master" with horizontal logo (PM v2 parity)
   * Links to the Puppet Master website. Shows theme-appropriate logo.
   * Logo comes from /public/puppetmaster/ — framework-specific, not client assets.
   *
   * Locale/asset resolution uses the SAME shared branding rule as Logo.svelte,
   * MadeBy.svelte and SectionF22.svelte: direct locale match when a file exists,
   * else the configured `assetLangFallback`, else the project default locale
   * (FOOTER_MADE_WITH config). No ad-hoc locale ternaries.
   *
   * Theme variants are explicit (PM v2 getLogo): light UI → 'dark' file,
   * dark UI → 'light' file, selected via CSS `dark:` classes.
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { t } from '$lib/stores/content.svelte'
  import { currentLocale } from '$lib/stores/locale.svelte'
  import { LOCALES, FOOTER_MADE_WITH } from '$lib/config/site'
  import { madeByLogoSrc, type MadeByLogoConfig } from '$lib/utils/made-by-logo'

  interface Props {
    url?: string
    class?: string
  }

  let { url = FOOTER_MADE_WITH.url, class: className = '' }: Props = $props()

  const logoConfig = $derived<MadeByLogoConfig>({
    basePath: FOOTER_MADE_WITH.basePath,
    available: FOOTER_MADE_WITH.available,
    // Branding-asset fallback (not i18n): locales without a direct made-with
    // logo file resolve through FOOTER_MADE_WITH.assetLangFallback (config).
    assetLangFallback: FOOTER_MADE_WITH.assetLangFallback,
    defaultLang: LOCALES[0] ?? ''
  })
  const lang = $derived(currentLocale())
  // Explicit light/dark variants (PM v2 getLogo): light UI → 'dark' file,
  // dark UI → 'light' file. No pre-inversion before calling madeByLogoSrc.
  const lightLogo = $derived(madeByLogoSrc(logoConfig, lang, 'light'))
  const darkLogo = $derived(madeByLogoSrc(logoConfig, lang, 'dark'))
  const base = 'inline-flex items-center gap-1.5 text-xs text-pm-text-muted'
</script>

{#if url}
  <div class={twMerge(clsx(base, className))}>
    <span>{t('footer.madeWith')}</span>
    <a href={url} target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-pm-brand hover:text-pm-brand-light transition-colors">
      <img
        src={lightLogo}
        alt="Puppet Master"
        class="h-4 w-auto block dark:hidden"
      />
      <img
        src={darkLogo}
        alt="Puppet Master"
        class="h-4 w-auto hidden dark:block"
      />
    </a>
  </div>
{/if}
