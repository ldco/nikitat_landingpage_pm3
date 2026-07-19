<script lang="ts">
  /**
   * SectionHero — PM v2 hero section (2-column grid + logo)
   *
   * Source: app-nuxt/app/assets/css/layout/sections.css (485 lines)
   * - 2-column grid: text | hero-logo
   * - hero-title: clamp(2.5rem, 6vw, 4.5rem), weight 900, line-height 0.9
   * - hero-logo: max-width min(420px, 42vw)
   * - Mobile: single column, smaller title
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'

  let {
    subtitle = '',
    showLogo = true,
    class: className = ''
  }: {
    subtitle?: string
    showLogo?: boolean
    class?: string
  } = $props()
</script>

<section class={twMerge(clsx(
  'relative grid grid-cols-1 md:grid-cols-2 items-center gap-8',
  'min-h-screen md:min-h-[80vh]',
  'px-6 md:px-[max(1.5rem,calc((100vw-1280px)/2))]',
  'pt-[clamp(56px,8vh,72px)] pb-4',
  className
))}>
  <!-- Left: Text content -->
  <div class="flex flex-col justify-center z-10 max-w-none">
    <h1 class="
      text-[clamp(2.5rem,6vw,4.5rem)]
      font-black leading-[0.9] tracking-normal
      text-pm-text font-display
    ">
      {m.sections_hero()}
    </h1>
    {#if subtitle}
      <p class="mt-5 max-w-[34rem] text-[clamp(1rem,1.5vw,1.25rem)] text-pm-text-secondary leading-relaxed">
        {subtitle}
      </p>
    {/if}
    <div class="flex flex-wrap gap-4 mt-8">
      <CtaButton href="/#contact" variant="primary" size="lg">{m.nav_contact()}</CtaButton>
      <CtaButton href="/portfolio" variant="outline" size="lg">{m.nav_portfolio()}</CtaButton>
    </div>
  </div>

  <!-- Right: Hero Logo (optional) -->
  {#if showLogo}
    <div class="flex items-center justify-center">
      <div class="w-full max-w-[min(420px,42vw)]">
        <!-- Hero logo SVG seal — will be animated by GSAP HeroAnimation -->
        <svg viewBox="0 0 400 400" class="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
          <circle cx="200" cy="200" r="180" fill="none" stroke="currentColor" stroke-width="2" opacity="0.2"/>
          <circle cx="200" cy="200" r="140" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
          <text x="200" y="170" text-anchor="middle" font-size="48" font-weight="900" fill="currentColor">PM</text>
          <text x="200" y="220" text-anchor="middle" font-size="14" fill="currentColor" opacity="0.6">SVELTEKIT</text>
          <text x="200" y="240" text-anchor="middle" font-size="10" fill="currentColor" opacity="0.4">META-FRAMEWORK</text>
        </svg>
      </div>
    </div>
  {/if}
</section>
