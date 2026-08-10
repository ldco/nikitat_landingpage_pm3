<script lang="ts">
  /**
   * Homepage — Onepager sections via framework Onepager orchestrator
   */
  import { FEATURES, HOMEPAGE_SECTIONS } from '$lib/config/site'
  import Onepager from '$lib/components/complex/Onepager.svelte'
  import Seo from '$lib/components/atoms/Seo.svelte'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  const isOnepager = $derived(FEATURES.onepager)

  // Hero is rendered by Onepager; only remaining enabled section-mode sections
  const sections = $derived(
    HOMEPAGE_SECTIONS.filter(s =>
      s.id !== 'hero' && s.enabled && s.renderMode !== 'page'
    )
  )
</script>

<!-- Homepage metadata: resolved site title + description (settings → i18n). -->
<Seo />

{#if isOnepager}
  <Onepager sections={sections} content={data.sectionContent} />
{/if}
