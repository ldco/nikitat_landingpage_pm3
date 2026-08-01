<script lang="ts">
  /**
   * HeroAnimation — GSAP-powered hero intro animation
   *
   * Isolated component (Rule #4): handles its own lifecycle and cleanup.
   * NEVER import GSAP in pages — use this pre-built component.
   *
   * Sequence:
   *   1. Logo zoom-out (scale 5→1)
   *   2. Tagline/heading fade-in-up
   *   3. Subtitle fade-in with slight delay
   *   4. CTA buttons fade-in
   *
   * Respects prefers-reduced-motion.
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { onMount } from 'svelte'
  import gsap from 'gsap'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import * as m from '$lib/i18n'

  let {
    subtitle = '',
    class: className = '',
    children
  }: {
    subtitle?: string
    class?: string
    children?: import('svelte').Snippet
  } = $props()

  let logoRef = $state.raw() as HTMLDivElement
  let headingRef: HTMLHeadingElement
  let subtitleRef: HTMLParagraphElement
  let buttonsRef: HTMLDivElement

  let reduced = $state(false)

  onMount(() => {
    reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    // 1. Logo zoom-out
    if (logoRef) {
      tl.fromTo(logoRef,
        { scale: 5, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.2 },
        0
      )
    }

    // 2. Heading fade-in-up
    if (headingRef) {
      tl.fromTo(headingRef,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        0.4
      )
    }

    // 3. Subtitle
    if (subtitleRef) {
      tl.fromTo(subtitleRef,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        0.7
      )
    }

    // 4. CTA buttons
    if (buttonsRef) {
      tl.fromTo(buttonsRef,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        0.9
      )
    }

    return () => {
      tl.kill()
    }
  })
</script>

<div
  class={twMerge(clsx('relative flex flex-col items-center justify-center min-h-hero px-4 text-center', className))}
>
  {#if children}
    <div bind:this={logoRef}>
      {@render children()}
    </div>
  {/if}

  <div class="max-w-3xl mx-auto">
    <!-- Heading -->
    <h1 bind:this={headingRef} class="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-pm-text font-display">
      {m.sections_hero()}
    </h1>

    <!-- Subtitle -->
    <p bind:this={subtitleRef} class="mt-6 text-lg sm:text-xl text-pm-text-muted max-w-2xl mx-auto">
      {subtitle || ' '}
    </p>

    <!-- CTA Buttons -->
    <div bind:this={buttonsRef} class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
      <CtaButton href="/#contact" variant="primary" size="lg">{m.nav_contact()}</CtaButton>
      <CtaButton href="/portfolio" variant="outline" size="lg">{m.nav_portfolio()}</CtaButton>
    </div>
  </div>
</div>
