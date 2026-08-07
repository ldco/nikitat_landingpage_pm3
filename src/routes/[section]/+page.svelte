<script lang="ts">
  /**
   * Section Page (SPA mode) — Renders a single section at its own route.
   * Only used when FEATURES.onepager === false.
   *
   * The section is validated server-side (+page.server.ts throws 404 for
   * unknown ids). This page just renders the enabled section.
   */
  import { HOMEPAGE_SECTIONS } from '$lib/config/site'
  import SectionRenderer from '$lib/components/complex/SectionRenderer.svelte'

  let { data }: { data: { section: (typeof HOMEPAGE_SECTIONS)[number] } } = $props()

  const section = $derived(data.section)
  // data is server-loaded — init is intentional
</script>

<SectionRenderer sectionId={section.id} />
