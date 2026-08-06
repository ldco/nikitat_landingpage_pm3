<script lang="ts">
  /**
   * BackToTop — Scroll-to-top button (PM v2 design)
   *
   * Source: app-nuxt/app/assets/css/ui/content/back-to-top.css (68 lines)
   * - bg-pm-bg-elevated by default, turns bg-pm-brand on hover
   * - Fixed bottom-right, z-sticky
   * - rounded-full with shadow
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import IconChevronUp from '@tabler/icons-svelte/icons/chevron-up'
  import { t } from '$lib/stores/content.svelte'
  import { FEATURES } from '$lib/config/site'

  let {
    threshold = 300,
    class: className = ''
  }: {
    threshold?: number
    class?: string
  } = $props()

  const backToTopEnabled = $derived(FEATURES.backToTop)

  let visible = $state(false)

  $effect(() => {
    const handler = () => {
      visible = window.scrollY > threshold
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  })

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // PM v2: bg-elevated with border, turns brand on hover
  // z-sticky = 200, fixed inset-6
  const base =
    'fixed bottom-6 right-6 z-sticky ' +
    'flex items-center justify-center ' +
    'size-11 rounded-full ' +
    'bg-pm-bg-elevated text-pm-text-secondary ' +
    'border border-pm-border shadow-lg ' +
    'hover:bg-pm-brand hover:text-pm-white hover:-translate-y-0.5 hover:shadow-xl ' +
    'active:translate-y-0 ' +
    'transition-all duration-200 ' +
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pm-focus-ring'
</script>

{#if backToTopEnabled && visible}
  <button class={twMerge(clsx(base, className))} onclick={scrollToTop} aria-label={t('footer.backToTop')}>
    <IconChevronUp class="size-5" />
  </button>
{/if}
