<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import { languageTag } from '$lib/paraglide/runtime.js'
  import { FEATURES } from '$lib/config/site'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import Logo from '$lib/components/atoms/Logo.svelte'
  import { breakHeroTitle } from '$lib/utils/titleBreaker'
  import HeroParallaxScene from '../../../project/HeroParallaxScene.svelte'

  let {
    title = m.sections_hero(),
    subtitle = '',
    showLogo = true,
    primaryCta = m.nav_contact(),
    primaryHref = '/#contact',
    secondaryCta = m.nav_portfolio(),
    secondaryHref = '/portfolio',
    class: className = ''
  }: {
    title?: string
    subtitle?: string
    showLogo?: boolean
    primaryCta?: string
    primaryHref?: string
    secondaryCta?: string
    secondaryHref?: string
    class?: string
  } = $props()

  const locale = $derived(languageTag())
  const segments = $derived(breakHeroTitle(title, locale))
  const parallaxEnabled = $derived(FEATURES.heroParallax)
</script>

<section id="hero" class={twMerge(clsx(
  'relative grid grid-cols-1 md:grid-cols-2 items-center gap-8 min-h-dvh',
  parallaxEnabled && 'z-10',
  'px-hero-edge',
  'pt-[var(--pt-section)] pb-4',
  'bg-pm-bg',
  className
))}>
  <!-- Parallax layers (behind content) -->
  {#if parallaxEnabled}
    <HeroParallaxScene />
  {/if}

  <!-- Left: Text -->
  <div class="flex flex-col justify-center z-10 min-w-0">
    <h1 class="hero-title text-pm-text mb-5 space-y-2">
      {#each segments as segment}
        <span class="block w-fit" class:text-pm-brand={segment.brand}>
          {segment.text}
        </span>
      {/each}
    </h1>
    {#if subtitle}
      <p class="text-fluid-xl text-pm-text-secondary max-w-prose leading-relaxed mb-8">
        {subtitle}
      </p>
    {/if}
    <div class="flex flex-wrap gap-md-custom max-sm:w-full">
      <CtaButton href={primaryHref} variant="primary" size="lg" class="max-sm:w-full">{primaryCta}</CtaButton>
      <CtaButton href={secondaryHref} variant="outline" size="lg" class="max-sm:w-full">{secondaryCta}</CtaButton>
    </div>
  </div>

  <!-- Right: Logo -->
  {#if showLogo}
    <div class="flex items-center justify-center overflow-visible z-30">
      <div class="w-full max-w-hero-logo max-sm:max-w-hero-logo-mobile">
        <Logo shape="circle" />
      </div>
    </div>
  {/if}
</section>
