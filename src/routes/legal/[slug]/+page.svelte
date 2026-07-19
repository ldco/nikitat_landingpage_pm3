<script lang="ts">
  /**
   * Legal Page — Renders markdown legal documents
   * Rule #1: class prop + twMerge
   */
  import type { PageData } from './$types'
  let { data }: { data: PageData } = $props()
</script>

<svelte:head>
  <title>Legal — Puppet Master</title>
</svelte:head>

<article class="container-prose py-24 prose-headings:text-pm-text prose-p:text-pm-text-secondary prose-a:text-pm-brand">
  {data.markdown}
</article>
