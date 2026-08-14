<script lang="ts">
  /**
   * Lightbox — Shared image lightbox for portfolio viewers
   *
   * Wraps the existing PortfolioLightbox molecule with a simpler API.
   *
   * Rule #1: class prop + twMerge
   */
  import PortfolioLightbox from '$lib/components/molecules/PortfolioLightbox.svelte'

  let {
    src = '',
    images = [] as Array<{ src: string; alt?: string; caption?: string }>,
    open = $bindable(false),
    class: className = ''
  }: {
    src?: string
    images?: Array<{ src: string; alt?: string; caption?: string }>
    open?: boolean
    class?: string
  } = $props()

  // If single src, wrap as one-image gallery
  const gallery = $derived(images.length > 0 ? images : (src ? [{ src }] : []))
  let index = $state(0)
</script>

{#if gallery.length > 0}
  <!-- Forward the COMPUTED gallery (single-src fallback included) — never the
       raw `images` prop, or a one-image `src` lightbox would render empty. -->
  <PortfolioLightbox {open} bind:index images={gallery} class={className} />
{/if}
