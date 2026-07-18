<script lang="ts">
  /**
   * BackToTop — Scroll-to-top button with visibility detection
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  let {
    threshold = 300,
    class: className = ''
  }: {
    threshold?: number
    class?: string
  } = $props()

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

  const base = 'fixed bottom-6 right-6 z-40 flex items-center justify-center w-10 h-10 rounded-full bg-pm-brand text-white shadow-lg hover:bg-pm-brand-light transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pm-brand'
</script>

{#if visible}
  <button class={twMerge(clsx(base, className))} onclick={scrollToTop} aria-label="Back to top">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  </button>
{/if}
