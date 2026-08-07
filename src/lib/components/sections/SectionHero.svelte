<script lang="ts">
  /**
   * SectionHero — Full-viewport hero: title, subtitle, CTAs, brand logo.
   *
   * Layout follows the original PM2 hero CSS: grid 1fr 1fr, contained to
   * container-max (1280px), padding-inline via max(24px, (100vw-1280)/2).
   * Typography: Geologica, heading=font-black, body=font-light.
   *
   * @props class?: string — merged Tailwind classes
   * @example <SectionHero />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { t } from '$lib/stores/content.svelte'
  import { FEATURES } from '$lib/config/site'
  import { breakHeroTitle } from '$lib/utils/titleBreaker'
  import { languageTag } from '$lib/paraglide/runtime.js'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import Logo from '$lib/components/atoms/Logo.svelte'
  import HeroParallaxScene from '../../../project/HeroParallaxScene.svelte'
  import { gsapIntro } from '../../../project/gsapIntro'

  let {
    title = t('hero.title', t('sections.hero')),
    subtitle = t('hero.subtitle', ''),
    primaryCta = t('hero.primaryCta', t('nav.contact')),
    primaryHref = '/#contact',
    secondaryCta = t('hero.secondaryCta', t('nav.portfolio')),
    secondaryHref = '/portfolio',
    class: className = ''
  }: {
    title?: string; subtitle?: string
    primaryCta?: string; primaryHref?: string; secondaryCta?: string; secondaryHref?: string
    class?: string
  } = $props()

  const locale = $derived(languageTag())
  const segments = $derived(breakHeroTitle(title, locale))
  const parallaxEnabled = $derived(FEATURES.heroParallax)

  let logoEl = $state<HTMLElement | null>(null)
  $effect(() => {
    if (!logoEl) return
    const intro = gsapIntro(logoEl)
    if (!intro) return
    return () => intro.destroy()
  })
</script>

<!-- Original PM2 hero: grid 1fr 1fr, contained to 1280px, header-offset padding -->
<section id="hero" class={twMerge(clsx(
  'relative grid grid-cols-1 md:grid-cols-2 items-center',
  'min-h-dvh gap-[var(--space-8)]',
  'pt-[calc(var(--h-header)+var(--space-8))] pb-[var(--space-16)]',
  'px-[max(var(--space-6),calc((100vw-var(--max-w-container))/2))]',
  'bg-pm-bg scroll-mt-0',
  'max-sm:min-h-svh max-sm:gap-[var(--space-2)] max-sm:px-[var(--space-2)]',
  className
))}>
  {#if parallaxEnabled}
    <HeroParallaxScene />
  {/if}

  <!-- Left: Text content -->
  <div class="flex flex-col">
    <h1 class="text-[var(--heading-1)] font-black text-pm-text leading-[var(--leading-tight)] mb-[var(--space-12)]
              max-sm:leading-[var(--hero-leading-mobile)]
              {locale.startsWith('ru') ? 'max-sm:text-[var(--hero-title-mobile-ru)]' : ''}">
      {#each segments as segment}
        <span class="block w-fit" class:text-pm-brand={segment.brand}>
          {segment.text}
        </span>
      {/each}
    </h1>
    {#if subtitle}
      <p class="text-[var(--text-base)] font-light text-pm-text-secondary leading-[var(--leading-relaxed)] max-w-[600px] mb-[var(--space-10)]">{subtitle}</p>
    {/if}
    <div class="flex flex-wrap gap-[var(--gap-lg)] max-sm:w-full">
      <CtaButton href={primaryHref} variant="primary" size="lg" class="max-sm:w-full">{primaryCta}</CtaButton>
      <CtaButton href={secondaryHref} variant="outline" size="lg" class="max-sm:w-full">{secondaryCta}</CtaButton>
    </div>
  </div>

  <!-- Right: Brand logo -->
  <div class="flex items-center justify-center overflow-visible z-30">
    <div bind:this={logoEl} class="w-full max-w-[var(--hero-logo-max-w)] max-sm:max-w-[var(--hero-logo-max-w-mobile)]">
      <Logo shape="circle" />
    </div>
  </div>
</section>
