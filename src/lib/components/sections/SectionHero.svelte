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

<section id="hero" class="section-hero">
  {#if parallaxEnabled}
    <HeroParallaxScene />
  {/if}

  <!-- Left: Text content -->
  <div class="section-body">
    <!-- Hero title with brand-colored segments -->
    <h1 class="hero-title">
      {#each segments as segment}
        <span class="hero-title__line" class:hero-title__line--brand={segment.brand}>
          {segment.text}
        </span>
      {/each}
    </h1>
    {#if subtitle}
      <p class="text-fluid-xl text-pm-text-secondary max-w-prose leading-relaxed mb-5">{subtitle}</p>
    {/if}
    <div class="hero-actions">
      <CtaButton href={primaryHref} variant="primary" size="lg">{primaryCta}</CtaButton>
      <CtaButton href={secondaryHref} variant="outline" size="lg">{secondaryCta}</CtaButton>
    </div>
  </div>

  <!-- Right: Logo (PM2 .hero-logo) -->
  {#if showLogo}
    <div class="hero-logo">
      <div class="hero-logo__img">
        <Logo shape="circle" />
      </div>
    </div>
  {/if}
</section>
