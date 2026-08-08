<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { t } from '$lib/stores/content.svelte'
  import { FEATURES } from '$lib/config/site'
  import { breakHeroTitle } from '$lib/utils/titleBreaker'
  import { languageTag } from '$lib/paraglide/runtime.js'
  import Logo from '$lib/components/atoms/Logo.svelte'
  import HeroParallaxScene from '../../../project/HeroParallaxScene.svelte'
  import { gsapIntro } from '../../../project/gsapIntro'

  let {
    title = t('hero.title', t('sections.hero')),
    subtitle = t('hero.subtitle', ''),
    primaryCta = t('hero.primaryCta', t('nav.contact')),
    primaryHref = '/#focus',
    secondaryCta = t('hero.secondaryCta', t('nav.portfolio')),
    secondaryHref = '/#about',
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

<section id="hero" class={twMerge(clsx(
  'relative grid grid-cols-1 md:grid-cols-2 items-center',
  'min-h-dvh gap-[var(--space-8)]',
  'pt-[calc(var(--h-header)+var(--space-8))] pb-[var(--space-16)]',
  'px-[max(var(--space-6),calc((100vw-var(--container-default))/2))]',
  'bg-pm-bg scroll-mt-0',
  'max-sm:min-h-svh max-sm:gap-[var(--space-2)] max-sm:px-[var(--space-2)]',
  className
))}>
  {#if parallaxEnabled}
    <HeroParallaxScene />
  {/if}

  <div class="max-w-container mx-auto px-container">
    <h1 class="text-fluid-hero font-black text-pm-text leading-[var(--hero-leading)] mb-[var(--space-5)] space-y-[var(--hero-title-line-gap)] max-sm:text-hero-sm {locale.startsWith('ru') ? 'max-sm:text-hero-sm-ru' : ''}">
      {#each segments as segment}
        <span class="block w-fit" class:text-pm-brand={segment.brand}>
          {segment.text}
        </span>
      {/each}
    </h1>
    {#if subtitle}
      <p class="text-[var(--text-base)] font-normal text-pm-text-secondary leading-[1.6] max-w-[34rem] mb-[var(--space-8)]">
        <span>{subtitle}</span>
      </p>
    {/if}
    <div class="flex flex-wrap gap-[var(--gap-md)] max-sm:w-full">
      <a href={primaryHref} class="inline-flex items-center justify-center rounded-md font-normal text-[var(--text-lg)] px-[var(--space-6)] py-[var(--space-3)] gap-[var(--gap-xs)] bg-pm-brand text-pm-white hover:bg-pm-brand-light active:bg-pm-brand-dark transition-colors duration-150 max-sm:w-full">
        <span>{primaryCta}</span>
      </a>
      <a href={secondaryHref} class="inline-flex items-center justify-center rounded-md font-normal text-[var(--text-lg)] px-[var(--space-6)] py-[var(--space-3)] gap-[var(--gap-xs)] border border-pm-brand text-pm-text bg-transparent hover:bg-pm-brand hover:text-pm-white active:bg-pm-brand-dark active:text-pm-white transition-colors duration-150 max-sm:w-full">
        <span>{secondaryCta}</span>
      </a>
    </div>
  </div>

  <div bind:this={logoEl} class="flex items-center justify-center overflow-visible z-30">
    <div class="w-full max-w-[var(--hero-logo-max-w)] max-sm:max-w-[var(--hero-logo-max-w-mobile)]">
      <Logo shape="circle" />
    </div>
  </div>
</section>
