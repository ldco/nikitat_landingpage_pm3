<script lang="ts">
  /**
   * SectionHero — PM v2 hero (layout/sections.css 485 lines)
   *
   * Features:
   * - Line-break algorithm with brand-colored segments
   * - 2-col grid [text | hero-logo]
   * - Fluid typography, RTL support
   * - GSAP intro animation (Phases 2 — see gsapIntro.ts)
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import { languageTag } from '$lib/paraglide/runtime.js'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import Logo from '$lib/components/atoms/Logo.svelte'
  import { breakHeroTitle } from '$lib/utils/titleBreaker'

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
</script>

<section id="home" class={twMerge(clsx(
  'section-hero',
  className
))}>
  <!-- Left: Text -->
  <div class="flex flex-col justify-center z-10 min-w-0">
    <h1 class="hero-title">
      {#each segments as segment}
        <span class="hero-title__line" class:hero-title__line--brand={segment.brand}>
          <span class="hero-title__plain">{segment.text}</span>
        </span>
      {/each}
    </h1>
    {#if subtitle}
      <p class="hero-subtitle">{subtitle}</p>
    {/if}
    <div class="hero-actions">
      <CtaButton href={primaryHref} variant="primary" size="lg">{primaryCta}</CtaButton>
      <CtaButton href={secondaryHref} variant="outline" size="lg">{secondaryCta}</CtaButton>
    </div>
  </div>

  <!-- Right: Logo -->
  {#if showLogo}
    <div class="hero-logo">
      <div class="hero-logo__img">
        <Logo shape="circle" />
      </div>
    </div>
  {/if}
</section>

<style>
  /* PM v2 hero styles — translated from layout/sections.css
   * Keeping as scoped style because these are section-specific layout patterns
   * that don't need to be reusable global classes */
  .section-hero {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    gap: var(--space-8);
    min-height: 100dvh;
    padding-inline: max(1.5rem, calc((100vw - 1280px) / 2));
    padding-block-start: calc(var(--header-height, 72px) + var(--space-8));
    padding-block-end: var(--space-4);
    position: relative;
    background: var(--color-pm-bg);
  }

  .hero-title {
    font-size: clamp(2.5rem, 6vw, 4.5rem);
    font-weight: 900;
    line-height: 0.9;
    letter-spacing: 0;
    color: var(--color-pm-text);
    margin-block-end: var(--space-5);
  }

  .hero-title__line {
    display: block;
    position: relative;
    inline-size: fit-content;
    overflow: visible;
    line-height: inherit;
  }

  .hero-title__line--brand {
    color: var(--color-pm-brand);
  }

  .hero-title__plain {
    display: block;
  }

  .hero-title__line + .hero-title__line {
    margin-block-start: var(--space-2);
  }

  .hero-subtitle {
    font-size: clamp(1.125rem, 2.5vw, 1.5rem);
    font-weight: 400;
    color: var(--color-pm-text-secondary);
    max-inline-size: 700px;
    line-height: 1.6;
    margin-block-end: var(--space-8);
  }

  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--gap-md);
  }

  .hero-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: visible;
    z-index: 3;
  }

  .hero-logo__img {
    width: 100%;
    max-width: min(420px, 42vw);
    height: auto;
  }

  @media (max-width: 639px) {
    .section-hero {
      grid-template-columns: 1fr;
      gap: var(--space-4);
      min-height: 100svh;
      padding-inline: var(--space-4);
      padding-block-start: calc(var(--header-height, 72px) + var(--space-2));
    }

    .hero-title {
      font-size: clamp(1.75rem, 9.6vw, 2.55rem);
      line-height: 0.85;
    }

    .hero-title__line {
      inline-size: 100%;
      max-inline-size: 100%;
    }

    .hero-logo__img {
      max-width: min(280px, 65vw);
    }

    .hero-actions {
      width: 100%;
    }

    .hero-actions > :global(*) {
      width: 100%;
    }
  }

  @media (forced-colors: active) {
    .section-hero { border: 1px solid currentColor; }
  }
</style>
