<script lang="ts">
  /**
   * TheFooter — PM v2 footer with full grid + legal bar
   *
   * Source: app-nuxt/app/assets/css/skeleton/footer.css (478 lines)
   * Layout: grid-cols-[auto_1fr] with brand left, actions right
   * Legal bar with links, separators, copyright
   * Theme-aware logos via CSS (light-logo/dark-logo)
   * RTL support for logos
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import { SEO, FRAMEWORK } from '$lib/config/site'
  import NavLinks from '$lib/components/molecules/NavLinks.svelte'
  import MadeBy from '$lib/components/atoms/MadeBy.svelte'
  import MadeWith from '$lib/components/atoms/MadeWith.svelte'

  let {
    class: className = ''
  }: {
    class?: string
  } = $props()

  const year = new Date().getFullYear()
</script>

<footer class={twMerge(clsx('border-t border-pm-border/50 bg-pm-bg py-8 md:py-8', className))}>
  <div class="w-full mx-auto" style="max-width: var(--content-default, 80rem); padding-inline: clamp(1rem, 3vw, 3rem);">
    <!-- Footer Grid: brand left, actions right -->
    <div class="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 md:gap-8 items-start">
      <!-- Brand column (left) -->
      <div class="flex flex-col items-center md:items-start gap-2 min-w-0">
        <MadeBy />
        {#if FRAMEWORK.url}
          <MadeWith url={FRAMEWORK.url} />
        {/if}
      </div>

      <!-- Actions column (right) -->
      <div class="flex flex-col items-center md:items-end gap-3 w-full min-w-0">
        <NavLinks />

      </div>
    </div>

    <!-- Legal Bar -->
    <div class="flex flex-col gap-1 mt-4 pt-4 border-0 text-xs text-pm-text-muted">
      <div class="flex flex-wrap items-center gap-x-1 gap-y-0.5
        justify-center md:justify-between">
        <span>&copy; {year} {SEO.title}. {m.footer_rights()}.</span>
        <div class="flex gap-2 text-sm">
          <a href="/legal/privacy-policy" class="text-pm-text-muted underline underline-offset-2 decoration-1 hover:text-pm-text transition-colors decoration-pm-border/50">{'Privacy Policy'}</a>
          <a href="/legal/terms-of-service" class="text-pm-text-muted underline underline-offset-2 decoration-1 hover:text-pm-text transition-colors decoration-pm-border/50">{'Terms of Service'}</a>
        </div>
      </div>
    </div>
  </div>
</footer>
