<script lang="ts">
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
  'relative grid grid-cols-1 md:grid-cols-2 items-center gap-8 min-h-dvh',
  'px-[max(1.5rem,calc((100vw-1280px)/2))]',
  'pt-[calc(clamp(56px,8vh,72px)+2rem)] pb-4',
  'bg-pm-bg',
  className
))}>
  <!-- Left: Text -->
  <div class="flex flex-col justify-center z-10 min-w-0">
    <h1 class="text-[clamp(2.5rem,6vw,4.5rem)] font-black leading-[0.9] tracking-normal text-pm-text mb-5 space-y-2">
      {#each segments as segment}
        <span class="block w-fit" class:text-pm-brand={segment.brand}>
          {segment.text}
        </span>
      {/each}
    </h1>
    {#if subtitle}
      <p class="text-[clamp(1.125rem,2.5vw,1.5rem)] text-pm-text-secondary max-w-[700px] leading-relaxed mb-8">
        {subtitle}
      </p>
    {/if}
    <div class="flex flex-wrap gap-[var(--gap-md)] max-sm:w-full">
      <CtaButton href={primaryHref} variant="primary" size="lg" class="max-sm:w-full">{primaryCta}</CtaButton>
      <CtaButton href={secondaryHref} variant="outline" size="lg" class="max-sm:w-full">{secondaryCta}</CtaButton>
    </div>
  </div>

  <!-- Right: Logo -->
  {#if showLogo}
    <div class="flex items-center justify-center overflow-visible z-[3]">
      <div class="w-full max-w-[min(420px,42vw)] max-sm:max-w-[min(280px,65vw)]">
        <Logo shape="circle" />
      </div>
    </div>
  {/if}
</section>
