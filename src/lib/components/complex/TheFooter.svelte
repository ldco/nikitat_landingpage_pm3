<script lang="ts">
  /**
   * TheFooter — PM v2 footer (matches app-nuxt TheFooter.vue structure)
   *
   * Structure (app-nuxt exact):
   * ┌───────────────────────────────────────────────────┐
   * │ LOGO  [Social icons]    [CTA]  [FooterNav links] │  ← footer-grid
   * ├───────────────────────────────────────────────────┤
   * │ © year · legal links                              │  ← legal-bar
   * ├───────────────────────────────────────────────────┤
   * │            Made by [Fabrica22]                     │  ← footer-attributions
   * │            Made with [PuppetMaster]                │
   * └───────────────────────────────────────────────────┘
   *
   * Rule #1: class prop + twMerge
   *
   * @props {Array<{slug: string; file: string}>} [legalDocs=[]] — legal documents rendered in the legal bar
   * @props {string} [class] — additional CSS classes merged via twMerge
   *
   * @example
   * <TheFooter legalDocs={legalDocs} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { t } from '$lib/stores/content.svelte'
  import { FEATURES, FRAMEWORK } from '$lib/config/site'
  import MadeBy from '$lib/components/atoms/MadeBy.svelte'
  import MadeWith from '$lib/components/atoms/MadeWith.svelte'
  import Logo from '$lib/components/atoms/Logo.svelte'
  import SocialNav from '$lib/components/molecules/SocialNav.svelte'
  import FooterNav from '$lib/components/molecules/FooterNav.svelte'
  import FooterCta from '$lib/components/molecules/FooterCta.svelte'
  import LegalInfo from '$lib/components/molecules/LegalInfo.svelte'

  interface LegalDoc {
    slug: string
    file: string
  }

  let {
    legalDocs = [] as LegalDoc[],
    class: className = ''
  }: {
    legalDocs?: LegalDoc[]
    class?: string
  } = $props()

  const year = new Date().getFullYear()
  const isFullWidth = $derived(FEATURES.headerFooterWidthMode === 'full')
  const showNav = $derived(FEATURES.footerNav)
  const showLegalLinks = $derived(FEATURES.footerLegalLinks)
  const showMadeBy = $derived(FEATURES.footerMadeBy)
  const showMadeWith = $derived(FEATURES.footerMadeWith)
  const showFooterCta = $derived(FEATURES.footerCta)

  /** Resolve translated title for a legal document file (typed, no dynamic indexing) */
  function legalDocLabel(file: string): string {
    if (file === 'privacy-policy') return t('footer.privacy')
    if (file === 'personal-data-policy') return t('footer.personalData')
    return t('footer.terms')
  }
</script>

<footer class={twMerge(clsx(
  'border-t border-pm-border',
  // Deliberate alternate shade: the public page uses ONE shared surface by
  // default (sections render transparent over the body bg); the footer is the
  // single intentional elevated surface that separates it from the page.
  'bg-pm-bg-elevated',
  'backdrop-blur-glass',
  'py-8 md:py-8',
  className
))}>
  <div class={clsx('w-full', !isFullWidth && 'mx-auto max-w-[var(--max-w-container)]', 'px-[var(--px-container)]')}>
    <!-- ═══ Footer Grid: Logo+Social | CTA+FooterNav (app-nuxt: .footer-grid) ═══ -->
    {#if showNav || showFooterCta}
    <div class="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
      <!-- Left: Logo + Social (app-nuxt: .footer-brand) -->
      <div class="flex flex-col items-center sm:items-start gap-2 min-w-0">
        <Logo shape="horizontal" class="h-[var(--footer-logo-height)] max-w-[var(--footer-logo-max-width)] w-auto" />
        <SocialNav class="justify-center sm:justify-start" />
      </div>

      <!-- Right: CTA + FooterNav (app-nuxt: .footer-actions) -->
      <div class="flex flex-col items-center sm:items-end gap-4 w-full min-w-0">
        {#if showFooterCta}
          <FooterCta />
        {/if}
        <FooterNav />
      </div>
    </div>
    {/if}

    <!-- ═══ Legal Bar (app-nuxt: .legal-bar) ═══ -->
    <div class="flex flex-col sm:flex-row flex-wrap items-center justify-between gap-2 mt-8 pt-4 border-t border-pm-border text-xs text-pm-text-muted">
      <LegalInfo />
      {#if showLegalLinks && legalDocs.length > 0}
      <div class="flex gap-3">
        {#each legalDocs as doc (doc.slug)}
          <a href={`/legal/${doc.slug}`} class="text-pm-text-muted underline underline-offset-2 decoration-1 hover:text-pm-text transition-colors decoration-pm-border/50">{legalDocLabel(doc.file)}</a>
        {/each}
      </div>
      {/if}
    </div>

    <!-- ═══ Attributions: MadeBy + MadeWith at bottom (app-nuxt: .footer-attributions) ═══ -->
    {#if showMadeBy || showMadeWith}
    <div class="flex flex-col items-center gap-2 mt-6 pt-4 border-t border-pm-border text-center">
      {#if showMadeBy}
        <MadeBy />
      {/if}
      {#if showMadeWith}
        <MadeWith url={FRAMEWORK.url} />
      {/if}
    </div>
    {/if}
  </div>
</footer>
