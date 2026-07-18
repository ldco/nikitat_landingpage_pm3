<script lang="ts">
  /**
   * Homepage — Renders all enabled sections via SectionRenderer
   * Onepager mode: all sections as anchors on one page
   * SPA mode: only hero section, others via routes
   */
  import { FEATURES } from '$lib/config/site'
  import SectionRenderer from '$lib/components/complex/SectionRenderer.svelte'
</script>

<SectionRenderer />
