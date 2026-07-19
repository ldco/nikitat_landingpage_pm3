<script lang="ts">
  /**
   * TheFooter — PM v2 footer (skeleton/footer.css 478 lines)
   *
   * Desktop: grid [brand | actions], legal bar
   * Mobile: single column centered
   * Frosted glass background with backdrop-filter
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import { FEATURES, FRAMEWORK } from '$lib/config/site'
  import MadeBy from '$lib/components/atoms/MadeBy.svelte'
  import MadeWith from '$lib/components/atoms/MadeWith.svelte'
  import SocialNav from '$lib/components/molecules/SocialNav.svelte'

  let {
    class: className = ''
  }: {
    class?: string
  } = $props()

  const year = new Date().getFullYear()
  const isFullWidth = $derived(FEATURES.headerFooterWidthMode === 'full')
  const showNav = $derived(FEATURES.footerNav)
  const showLegalLinks = $derived(FEATURES.footerLegalLinks)
  const showMadeBy = $derived(FEATURES.footerMadeBy)
  const showFooterCta = $derived(FEATURES.footerCta)
</script>

<footer class={twMerge(clsx(
  'border-t border-pm-border/50 bg-pm-bg/85 dark:bg-pm-bg/85',
  'backdrop-blur-[16px] dark:backdrop-blur-[16px]',
  'py-8 md:py-8',
  className
))}>
  <div class={clsx('w-full', !isFullWidth && 'mx-auto max-w-[80rem]')} style="padding-inline: clamp(1rem, 3vw, 3rem);">
    {#if showMadeBy || FRAMEWORK.url || showNav}
    <!-- Footer Grid: brand | actions -->
    <div class="grid grid-cols-1 sm:grid-cols-[auto_minmax(0,1fr)] gap-6 sm:gap-8 items-start">
      <!-- Brand column (left) — centered on mobile, flex-start on desktop -->
      <div class="flex flex-col items-center sm:items-start gap-2 min-w-0">
        {#if showMadeBy}
          <MadeBy />
        {/if}
        {#if FRAMEWORK.url}
          <MadeWith url={FRAMEWORK.url} />
        {/if}
      </div>

      <!-- Actions column (right) — centered on mobile, flex-end on desktop -->
      {#if showNav}
      <div class="flex flex-col items-center sm:items-end gap-4 w-full min-w-0">
        {#if showFooterCta}
          <a href="/#contact" class="px-5 py-2.5 text-sm font-medium bg-pm-brand text-pm-white rounded-md hover:bg-pm-brand-light transition-colors">{m.nav_contact()}</a>
        {/if}
        <SocialNav class="justify-center sm:justify-end" />
      </div>
      {/if}
    </div>
    {/if}

    <!-- Legal Bar — copyright + legal links -->
    <div class="flex flex-col sm:flex-row flex-wrap items-center justify-between gap-2 mt-8 pt-4 border-t border-pm-border text-xs text-pm-text-muted">
      <span>&copy; {year} {m.footer_rights()}</span>
      {#if showLegalLinks}
      <div class="flex gap-3">
        <a href="/legal/privacy-policy" class="text-pm-text-muted underline underline-offset-2 decoration-1 hover:text-pm-text transition-colors decoration-pm-border/50">{m.footer_privacy()}</a>
        <a href="/legal/terms-of-service" class="text-pm-text-muted underline underline-offset-2 decoration-1 hover:text-pm-text transition-colors decoration-pm-border/50">{m.footer_terms()}</a>
      </div>
      {/if}
    </div>
  </div>
</footer>
