<script lang="ts">
  /**
   * Section Page (SPA mode) — Renders a single section at its own route
   * Only used when FEATURES.onepager === false
   */
  import { page } from '$app/stores'
  import { error } from '@sveltejs/kit'
  import { HOMEPAGE_SECTIONS } from '$lib/config/site'
  import SectionRenderer from '$lib/components/complex/SectionRenderer.svelte'

  const sectionId = $derived($page.params.section)
  const section = $derived(HOMEPAGE_SECTIONS.find(s => s.id === sectionId))

  // If section not found, 404
  $effect(() => {
    if (!section) {
      error(404, 'Section not found')
    }
  })
</script>

{#if section}
  <SectionRenderer sectionId={section.id} />
{/if}
