<script lang="ts">
  /**
   * SectionHero — Full-viewport hero: title segments, subtitle, CTAs, brand tile.
   *
   * Content from content store: hero.title, hero.subtitle, hero.primaryCta, hero.secondaryCta
   *
   * Design spec: left column (headline + paragraph + buttons), right column
   * (large rust-red brand tile with barcode glyph). Centered in viewport.
   * Headline: 700-800 weight, cream #F5ECDF + rust #A63B28, 60-64px, lh 1.05-1.1.
   * Paragraph: regular weight, taupe #C7B4A6, 18px, lh 2.0, max-w 580px.
   * Buttons: 52px height, 16px/26px padding, 8px radius, 16px gap.
   *
   * @props title?: string — hero title (default from content store)
   * @props subtitle?: string — hero subtitle
   * @props primaryCta?: string — primary button label
   * @props primaryHref?: string — primary link (default /#contact)
   * @props secondaryCta?: string — secondary button label
   * @props secondaryHref?: string — secondary link (default /portfolio)
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
  import HeroParallaxScene from '../../../project/HeroParallaxScene.svelte'
  import BrandTile from '../../../project/BrandTile.svelte'
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
  const isContained = $derived(FEATURES.bodyWidthMode === 'contained')

  let tileEl = $state<HTMLElement | null>(null)
  $effect(() => {
    if (!tileEl) return
    const intro = gsapIntro(tileEl)
    if (!intro) return
    return () => intro.destroy()
  })
</script>

<section id="hero" class={twMerge(clsx(
  'relative grid grid-cols-1 md:grid-cols-2 items-center gap-[var(--space-8)]',
  'min-h-dvh pt-[var(--pt-hero)] pb-[var(--space-8)]',
  'px-container',
  'bg-pm-bg scroll-mt-0',
  isContained && 'max-w-container mx-auto',
  'max-sm:min-h-svh max-sm:gap-[var(--space-2)] max-sm:px-[var(--space-2)] max-sm:pt-[var(--pt-hero-mobile)]',
  className
))}>
  {#if parallaxEnabled}
    <HeroParallaxScene />
  {/if}

  <!-- Left: Text -->
  <div class="flex flex-col justify-center">
    <h1 class="font-bold text-[clamp(2.5rem,5vw,4rem)] text-pm-text leading-[1.08] tracking-normal mb-10
              max-sm:text-[var(--hero-title-mobile)] max-sm:leading-[var(--hero-leading-mobile)]
              {locale.startsWith('ru') ? 'max-sm:text-[var(--hero-title-mobile-ru)]' : ''}">
      {#each segments as segment}
        <span class="block w-fit" class:text-pm-brand={segment.brand}>
          {segment.text}
        </span>
      {/each}
    </h1>
    {#if subtitle}
      <p class="text-fluid-xl font-normal text-[#C7B4A6] leading-[2] max-w-[580px] mb-10">{subtitle}</p>
    {/if}
    <div class="flex flex-wrap gap-4 max-sm:w-full">
      <CtaButton href={primaryHref} variant="primary" size="lg" class="h-[52px] px-[26px] text-[15px] font-semibold rounded-lg max-sm:w-full">{primaryCta}</CtaButton>
      <CtaButton href={secondaryHref} variant="outline" size="lg" class="h-[52px] px-[26px] text-[15px] font-semibold rounded-lg max-sm:w-full">{secondaryCta}</CtaButton>
    </div>
  </div>

  <!-- Right: Brand Tile -->
  <div class="flex items-center justify-center overflow-visible z-30">
    <div bind:this={tileEl}>
      <BrandTile />
    </div>
  </div>
</section>
