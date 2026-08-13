<script lang="ts">
  /**
   * SectionF22 — Fabrica22 partnership section (project-specific)
   *
   * PM v2 parity (SectionF22.vue):
   * - Title + sanitized HTML description (with <a> links to fabrica22.pro / zinnatov.ru)
   * - Made-by logo link (locale-aware, theme-aware, links to fabrica22.pro)
   *
   * Content from content store: f22.title, f22.description
   * Logos from FOOTER_MADE_BY project config.
   *
   * @props
   * @example
   * <SectionF22 />
   */
  import { t } from '$lib/stores/content.svelte'
  import { FOOTER_MADE_BY, LOCALES } from '$lib/config/site'
  import { sanitizeHtml } from '$lib/utils/sanitize'
  import { madeByLogoSrc, type MadeByLogoConfig } from '$lib/utils/made-by-logo'
  import { currentLocale } from '$lib/stores/locale.svelte'
  import Section from '$lib/components/atoms/Section.svelte'
  import SectionContent from '$lib/components/molecules/SectionContent.svelte'
  import SectionHeading from '$lib/components/molecules/SectionHeading.svelte'

  const title = $derived(t('f22.title', t('nav.f22')))
  const description = $derived(sanitizeHtml(t('f22.description', '')))

  const logoConfig: MadeByLogoConfig = {
    basePath: FOOTER_MADE_BY.basePath,
    available: FOOTER_MADE_BY.available,
    assetLangFallback: FOOTER_MADE_BY.assetLangFallback,
    defaultLang: LOCALES[0] ?? ''
  }
  const madeByUrl = FOOTER_MADE_BY.url
  const madeByAlt = t(FOOTER_MADE_BY.logoAlt, 'Fabrica 22')

  // PM v2 getLogo: theme inversion — light mode shows 'dark' logo file, dark mode shows 'light'.
  // Locale is the active Paraglide tag (not URL pathname slicing), matching the
  // shared made-by flow.
  const activeLang = $derived(currentLocale())
  const lightLogo = $derived(madeByLogoSrc(logoConfig, activeLang, 'light'))
  const darkLogo = $derived(madeByLogoSrc(logoConfig, activeLang, 'dark'))
</script>

<Section id="f22">
  <SectionContent width="content" class="flex flex-col items-center text-center">
    <SectionHeading title={title} align="center" />

    <div class="flex flex-col items-center">
      {#if description}
        <!-- eslint-disable-next-line -->
        <div class="text-fluid-2xl text-pm-text-secondary leading-relaxed mb-[var(--space-8)]">{@html description}</div>
      {:else}
        <p class="text-fluid-2xl text-pm-text-secondary leading-relaxed mb-[var(--space-8)]">{t('common.note')}</p>
      {/if}

      <!-- Made-by logo link (PM2 .made-by): locale-aware, theme-aware, links to fabrica22.pro -->
      <a
        href={madeByUrl}
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center opacity-80 transition-opacity hover:opacity-100"
      >
        <img src={lightLogo} alt={madeByAlt} class="h-6 w-auto dark:hidden" />
        <img src={darkLogo} alt={madeByAlt} class="h-6 w-auto hidden dark:block" />
      </a>
    </div>
  </SectionContent>
</Section>
