<script lang="ts">
  import '../app.css'
  import { clsx } from 'clsx'
  import { page } from '$app/stores'
  import { fade, slide, scale, fly } from 'svelte/transition'
  import { FEATURES } from '$lib/config/site'
  import { scrollSpy } from '$lib/actions/scrollSpy'
  import TheHeader from '$lib/components/complex/TheHeader.svelte'
  import TheFooter from '$lib/components/complex/TheFooter.svelte'
  import BackToTop from '$lib/components/atoms/BackToTop.svelte'
  import CookieConsent from '$lib/components/complex/CookieConsent.svelte'
  import ToastContainer from '$lib/components/complex/ToastContainer.svelte'

  let { children }: { children?: import('svelte').Snippet } = $props()
  const isOnepager = $derived(FEATURES.onepager)
  const transitionType = $derived(!isOnepager ? FEATURES.pageTransitions : '')
  const isVerticalNav = $derived(FEATURES.verticalNav)
</script>

{#if !$page.url.pathname.startsWith('/admin')}
  <TheHeader />
{/if}
<main class={clsx('min-h-screen', !$page.url.pathname.startsWith('/admin') && (isVerticalNav ? 'ms-16' : 'pt-16'))} use:scrollSpy>
  {#key $page.url.pathname}
    {#if transitionType === 'fade'}
      <div transition:fade={{ duration: 200 }}>{@render children?.()}</div>
    {:else if transitionType === 'slide-left'}
      <div transition:slide={{ duration: 200, axis: 'x' }}>{@render children?.()}</div>
    {:else if transitionType === 'slide-up'}
      <div transition:slide={{ duration: 200, axis: 'y' }}>{@render children?.()}</div>
    {:else if transitionType === 'scale'}
      <div transition:scale={{ duration: 200, start: 0.95 }}>{@render children?.()}</div>
    {:else if transitionType === 'zoom'}
      <div transition:scale={{ duration: 200, start: 1.1 }}>{@render children?.()}</div>
    {:else if transitionType === 'flip'}
      <div transition:fly={{ duration: 200, x: 300 }}>{@render children?.()}</div>
    {:else}
      <div transition:fade={{ duration: 200 }}>{@render children?.()}</div>
    {/if}
  {/key}
</main>
{#if !$page.url.pathname.startsWith('/admin')}
  <TheFooter />
  <BackToTop />
  <CookieConsent />
{/if}
<ToastContainer />
