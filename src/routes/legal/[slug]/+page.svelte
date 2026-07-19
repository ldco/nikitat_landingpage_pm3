<script lang="ts">
  /**
   * Legal Page — Renders markdown legal documents
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { FEATURES, SEO } from '$lib/config/site'
  import type { PageData } from './$types'
  let { data }: { data: PageData } = $props()
  const isContained = $derived(FEATURES.bodyWidthMode === 'contained')
</script>

<svelte:head>
  <title>Legal — {SEO.title}</title>
</svelte:head>

<article class={clsx('w-full mx-auto px-6 md:px-8 py-24 prose-headings:text-pm-text prose-p:text-pm-text-secondary prose-a:text-pm-brand', isContained && 'max-w-[65ch]')}>
  {data.markdown}
</article>
