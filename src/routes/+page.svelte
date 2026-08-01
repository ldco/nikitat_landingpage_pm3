<script lang="ts">
  import { FEATURES, HOMEPAGE_SECTIONS, MODULES } from '$lib/config/site'
  import SectionHero from '$lib/components/sections/SectionHero.svelte'
  import SectionRenderer from '$lib/components/complex/SectionRenderer.svelte'
  import * as m from '$lib/i18n'

  const isOnepager = $derived(FEATURES.onepager)

  const sections = $derived(
    HOMEPAGE_SECTIONS.filter(s =>
      s.id !== 'hero' && s.enabled && (MODULES[s.id]?.enabled !== false)
    )
  )
</script>

{#if isOnepager}
  <div class="has-scrolly-bg">
    <div class="scene-full-bleed">
      <SectionHero
        title={m.sections_hero()}
        primaryCta={m.nav_contact()}
        secondaryCta={m.nav_portfolio()}
      />
    </div>

    {#each sections as section (section.id)}
      <div class="scene-full-bleed">
        <SectionRenderer sectionId={section.id} />
      </div>
    {/each}
  </div>
{/if}
