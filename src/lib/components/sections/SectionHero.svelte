<script lang="ts">
  import * as m from '$lib/i18n'
  import { FEATURES } from '$lib/config/site'
  import { t } from '$lib/stores/content.svelte'
  import { breakHeroTitle } from '$lib/utils/titleBreaker'
  import { languageTag } from '$lib/paraglide/runtime.js'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import Logo from '$lib/components/atoms/Logo.svelte'
  import HeroParallaxScene from '../../../project/HeroParallaxScene.svelte'

  let {
    title = t('hero.title', m.sections_hero()),
    subtitle = t('hero.subtitle', ''),
    showLogo = true,
    primaryCta = t('hero.primaryCta', m.nav_contact()),
    primaryHref = '/#contact',
    secondaryCta = t('hero.secondaryCta', m.nav_portfolio()),
    secondaryHref = '/portfolio',
  }: {
    title?: string; subtitle?: string; showLogo?: boolean
    primaryCta?: string; primaryHref?: string; secondaryCta?: string; secondaryHref?: string
  } = $props()

  const locale = $derived(languageTag())
  const segments = $derived(breakHeroTitle(title, locale))
  const parallaxEnabled = $derived(FEATURES.heroParallax)
</script>

<section id="hero" class="relative grid grid-cols-1 md:grid-cols-2 items-center gap-[var(--space-8)]
       min-h-dvh pt-[var(--pt-section)] pb-[var(--space-4)]
       px-[max(var(--space-6),calc((100vw-var(--max-w-container))/2))]
       bg-pm-bg scroll-mt-0
       max-sm:min-h-svh max-sm:gap-[var(--space-2)] max-sm:px-[var(--space-2)]">
  {#if parallaxEnabled}
    <HeroParallaxScene />
  {/if}

  <!-- Left: Text -->
  <div class="flex flex-col justify-center">
    <h1 class="text-fluid-hero font-black text-pm-text mb-[var(--space-5)] space-y-[var(--space-2)]
              leading-[var(--hero-leading)] tracking-normal
              max-sm:text-[var(--hero-title-mobile)] max-sm:leading-[var(--hero-leading-mobile)]">
      {#each segments as segment}
        <span class="block w-fit" class:text-pm-brand={segment.brand}>
          {segment.text}
        </span>
      {/each}
    </h1>
    {#if subtitle}
      <p class="text-fluid-xl text-pm-text-secondary max-w-prose leading-relaxed mb-[var(--space-5)]">{subtitle}</p>
    {/if}
    <div class="flex flex-wrap gap-[var(--gap-md)] mt-[var(--space-4)] max-sm:w-full">
      <CtaButton href={primaryHref} variant="primary" size="lg" class="max-sm:w-full">{primaryCta}</CtaButton>
      <CtaButton href={secondaryHref} variant="outline" size="lg" class="max-sm:w-full">{secondaryCta}</CtaButton>
    </div>
  </div>

  <!-- Right: Logo -->
  {#if showLogo}
    <div class="flex items-center justify-center overflow-visible z-30">
      <div class="w-full max-w-[var(--hero-logo-max-w)] max-sm:max-w-[var(--hero-logo-max-w-mobile)]">
        <Logo shape="circle" />
      </div>
    </div>
  {/if}
</section>
