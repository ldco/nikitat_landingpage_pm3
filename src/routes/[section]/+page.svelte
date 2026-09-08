<script lang="ts">
  /**
   * Section Page (SPA mode) — Renders a single section at its own route.
   * Only used when FEATURES.onepager === false.
   *
   * The section is validated server-side (+page.server.ts throws 404 for
   * unknown ids) and the typed SectionContent is loaded there too, so
   * SectionRenderer receives the same typed data as on the homepage.
   */
  import { HOMEPAGE_SECTIONS } from '$lib/config/site'
  import SectionRenderer from '$lib/components/complex/SectionRenderer.svelte'
  import type { SectionContent } from '$lib/components/sections/types'

  let { data }: {
    data: {
      section: (typeof HOMEPAGE_SECTIONS)[number]
      sectionContent: SectionContent
      legalReady: boolean
    }
  } = $props()

  const section = $derived(data.section)
  // data is server-loaded — init is intentional
</script>

<SectionRenderer sectionId={section.id} content={data.sectionContent} legalReady={data.legalReady} />
