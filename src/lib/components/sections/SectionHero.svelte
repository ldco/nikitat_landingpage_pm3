<script lang="ts">
  /**
   * SectionHero — Hero section
   * i18n: sections_hero, nav_portfolio, common_submit
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'

  let {
    subtitle = 'SvelteKit Meta-Framework',
    class: className = ''
  }: {
    subtitle?: string
    class?: string
  } = $props()
</script>

<section class={twMerge(clsx('relative flex flex-col items-center justify-center min-h-[80vh] px-4 text-center', className))}>
  <div class="max-w-3xl mx-auto">
    <h1 class="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-pm-gray-900 dark:text-pm-white font-display">
      {m.sections_hero()}
    </h1>
    <p class="mt-6 text-lg sm:text-xl text-pm-muted dark:text-pm-muted-dark max-w-2xl mx-auto">
      {subtitle}
    </p>
    <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
      <CtaButton href="/#contact" variant="primary" size="lg">{m.nav_contact()}</CtaButton>
      <CtaButton href="/portfolio" variant="outline" size="lg">{m.nav_portfolio()}</CtaButton>
    </div>
  </div>
</section>
