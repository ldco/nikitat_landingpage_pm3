<script lang="ts">
  /**
   * SectionHero — Original PM2 hero: grid 1fr 1fr, container, hero-logo.
   *
   * Structure matches original:
   * <section class="section-hero">
   *   <div class="max-w-container mx-auto px-container"> (text content)
   *     <h1 class="hero-title"><span class="hero-title__line">...</span></h1>
   *     <p class="hero-subtitle"><span>...</span></p>
   *     <div class="hero-actions">...</div>
   *   </div>
   *   <div class="hero-logo"><img width="420" height="420"></div>
   * </section>
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { t } from '$lib/stores/content.svelte'
  import { FEATURES } from '$lib/config/site'
  import { breakHeroTitle } from '$lib/utils/titleBreaker'
  import { languageTag } from '$lib/paraglide/runtime.js'
  import Logo from '$lib/components/atoms/Logo.svelte'
import { LOGO } from '$lib/config/site'
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

<!-- Original PM2 hero: grid 1fr 1fr, contained by padding-inline calc, header-offset -->
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

  <!-- Text content inside container -->
  <div class="max-w-container mx-auto px-container">
    <h1 class="text-[var(--text-fluid-hero)] font-black text-pm-text [line-height:inherit] mb-[var(--space-12)]
              max-sm:text-[var(--hero-title-mobile)]
              {locale.startsWith('ru') ? 'max-sm:text-[var(--hero-title-mobile-ru)]' : ''}">
      {#each segments as segment}
        <span class="block w-fit" class:text-pm-brand={segment.brand}>
          {segment.text}
        </span>
      {/each}
    </h1>
    {#if subtitle}
      <p class="text-[var(--text-base)] font-light text-pm-text-secondary leading-[var(--leading-relaxed)] max-w-[600px] mb-[var(--space-10)]">
        <span>{subtitle}</span>
      </p>
    {/if}
    <div class="flex flex-wrap gap-[var(--gap-lg)] max-sm:w-full">
      <a href={primaryHref} class="inline-flex items-center justify-center rounded-lg font-semibold text-[15px] h-[52px] px-[26px] gap-2 bg-pm-brand text-pm-white hover:bg-pm-brand-light active:bg-pm-brand-dark transition-colors duration-150 max-sm:w-full">
        <span>{primaryCta}</span>
      </a>
      <a href={secondaryHref} class="inline-flex items-center justify-center rounded-lg font-semibold text-[15px] h-[52px] px-[26px] gap-2 border-2 border-pm-brand text-pm-text bg-transparent hover:bg-pm-brand hover:text-pm-white active:bg-pm-brand-dark active:text-pm-white transition-colors duration-150 max-sm:w-full">
        <span>{secondaryCta}</span>
      </a>
    </div>
  </div>

  <!-- Hero logo: outside container, 420x420px matching original -->
  <div bind:this={logoEl} class="flex items-center justify-center overflow-visible z-30">
    <img src="{LOGO.basePath}/circle_dark_ru.svg" alt="" class="w-full max-w-[420px] h-auto max-sm:max-w-[280px]" />
  </div>
</section>
