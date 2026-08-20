<script lang="ts">
  /**
   * SectionHero — Hero section: title, subtitle, CTAs and parallax scene
   *
   * Renders the locale-aware hero title (broken into segments for the brand
   * highlight), subtitle, primary/secondary CTAs and the project's parallax
   * scene when FEATURES.heroParallax is enabled. The project-specific parallax
   * is prop-injected by the Onepager orchestrator (never imported here).
   *
   * @props {string} [title] — hero title text
   * @props {string} [subtitle] — hero subtitle text
   * @props {string} [primaryCta] — primary CTA label
   * @props {string} [primaryHref='/#focus'] — primary CTA href
   * @props {string} [secondaryCta] — secondary CTA label
   * @props {string} [secondaryHref='/#about'] — secondary CTA href
   * @props {Component} [parallaxComponent] — parallax scene component injected by the orchestrator
   * @props {((node: HTMLElement) => { destroy(): void } | null | undefined)} [parallaxIntro] — parallax intro action factory
   * @props {string} [class] — additional CSS classes merged via twMerge
   *
   * @example
   * <SectionHero />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { t } from '$lib/stores/content.svelte'
  import { FEATURES, HERO_MOBILE_TITLE_TOKEN_BY_LOCALE } from '$lib/config/site'
  import { localizedHref } from '$lib/utils/navigation'
  import { currentLocale } from '$lib/stores/locale.svelte'
  import { breakHeroTitle } from '$lib/utils/titleBreaker'
  import Logo from '$lib/components/atoms/Logo.svelte'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import type { Component } from 'svelte'

  let {
    title = t('hero.title', t('sections.hero')),
    subtitle = t('hero.subtitle', ''),
    primaryCta = t('hero.primaryCta', t('nav.contact')),
    primaryHref = '/#focus',
    secondaryCta = t('hero.secondaryCta', t('nav.portfolio')),
    secondaryHref = '/#about',
    // audit I-22 / E-7: the project-specific parallax scene is injected by the
    // orchestrator (Onepager) instead of imported from src/project/ here. This
    // keeps SectionHero a pure framework component — a new PM3 project only
    // needs to provide its parallax scene when it opts into heroParallax.
    parallaxComponent = undefined,
    parallaxIntro = undefined,
    class: className = ''
  }: {
    title?: string; subtitle?: string
    primaryCta?: string; primaryHref?: string; secondaryCta?: string; secondaryHref?: string
    parallaxComponent?: Component | undefined
    parallaxIntro?: ((node: HTMLElement) => { destroy(): void } | null | undefined) | undefined
    class?: string
  } = $props()

  const locale = $derived(currentLocale())
  const segments = $derived(breakHeroTitle(title, locale))
  // Per-locale mobile title override (config-driven — no hardcoded locale
  // checks). The map lives in site config (HERO_MOBILE_TITLE_TOKEN_BY_LOCALE);
  // token variants are defined in src/app.css as --text-hero-title-mobile-*.
  const mobileTitleClass = $derived(
    Object.entries(HERO_MOBILE_TITLE_TOKEN_BY_LOCALE)
      .find(([code]) => locale.startsWith(code))?.[1] ?? ''
  )
  const parallaxEnabled = $derived(FEATURES.heroParallax)
  // CTA hrefs are canonical targets (e.g. '/#focus'); derive the locale-aware
  // URL at render time so a non-default-locale visitor keeps the locale prefix.
  const primaryHrefLocalized = $derived(localizedHref(primaryHref, locale))
  const secondaryHrefLocalized = $derived(localizedHref(secondaryHref, locale))

  let logoEl = $state<HTMLElement | null>(null)
  $effect(() => {
    if (!logoEl || !parallaxEnabled || typeof parallaxIntro !== 'function') return
    const intro = parallaxIntro(logoEl)
    if (!intro) return
    return () => intro.destroy()
  })
</script>

<section id="hero" class={twMerge(clsx(
  'relative grid grid-cols-1 md:grid-cols-2 items-center',
  'min-h-dvh gap-[var(--space-8)]',
  'pt-[var(--pt-hero)] pb-[var(--space-16)]',
  'px-[max(var(--space-6),calc((100vw-var(--container-default))/2))]',
  'scroll-mt-0',
  'max-sm:min-h-svh max-sm:gap-[var(--space-2)] max-sm:px-[var(--space-2)]',
  className
))}>
  {#if parallaxEnabled && parallaxComponent}
    {@const P = parallaxComponent}
    <P />
  {/if}

  <div class="flex flex-col justify-center items-start w-full max-w-[var(--content-default)] mx-auto">
    <h1 class="text-fluid-hero font-black text-pm-text leading-[var(--hero-leading)] mb-[var(--space-5)] space-y-[var(--hero-title-line-gap)] max-sm:text-[var(--text-hero-title-mobile)] {mobileTitleClass}">
      {#each segments as segment}
        <span class="block w-fit" class:text-pm-brand-text={segment.brand}>
          {segment.text}
        </span>
      {/each}
    </h1>
    {#if subtitle}
      <p class="text-[var(--text-hero-subtitle)] font-normal text-pm-text-secondary leading-[var(--leading-hero-subtitle)] max-w-[var(--max-w-hero-subtitle)] mt-[1em] mb-[var(--space-8)] hyphens-auto break-words">
        <span>{subtitle}</span>
      </p>
    {/if}
    <div class="flex flex-wrap gap-[var(--gap-md)] max-sm:w-full">
      <CtaButton href={primaryHrefLocalized} variant="primary" size="lg" class="max-sm:w-full">
        <span>{primaryCta}</span>
      </CtaButton>
      <CtaButton href={secondaryHrefLocalized} variant="outline" size="lg" class="border max-sm:w-full">
        <span>{secondaryCta}</span>
      </CtaButton>
    </div>
  </div>

  <div bind:this={logoEl} class="flex items-center justify-center overflow-visible z-30">
    <div class="w-full max-w-[var(--hero-logo-max-w)] max-sm:max-w-[var(--hero-logo-max-w-mobile)]">
      <Logo shape="circle" />
    </div>
  </div>
</section>
