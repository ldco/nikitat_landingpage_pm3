<script lang="ts">
  /**
   * Legal Page — Renders markdown legal documents
   * Rule #1: class prop + twMerge
   */
  import { SEO } from '$lib/config/site'
  import type { PageData } from './$types'
  let { data }: { data: PageData } = $props()
</script>

<svelte:head>
  <title>Legal — {SEO.title}</title>
</svelte:head>

<article class="w-full mx-auto max-w-[65ch] px-6 md:px-8 py-24 prose-headings:text-pm-text prose-p:text-pm-text-secondary prose-a:text-pm-brand">
  {data.markdown}
</article>
