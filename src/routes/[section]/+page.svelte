<script lang="ts">
  /**
   * Section Page (SPA mode) — Renders a single section at its own route
   * Only used when FEATURES.onepager === false
   */
  import { page } from '$app/stores'
  import { error } from '@sveltejs/kit'
  import { browser } from '$app/environment'
  import { HOMEPAGE_SECTIONS } from '$lib/config/site'
  import SectionRenderer from '$lib/components/complex/SectionRenderer.svelte'

  const sectionId = $derived($page.params.section)
  const section = $derived(HOMEPAGE_SECTIONS.find(s => s.id === sectionId))

  // SSR guard: throw 404 during server render
  const _404 = $derived.by(() => {
    if (!section && !browser) {
      error(404, 'Section not found')
    }
  })
</script>

{#if section}
  <SectionRenderer sectionId={section.id} />
{:else if browser}
  <!-- Client-side fallback if section not found after navigation -->
  <div class="min-h-screen flex items-center justify-center">
    <p class="text-pm-text-muted">Section not found</p>
  </div>
{/if}
