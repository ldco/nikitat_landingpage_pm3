<script lang="ts">
  /**
   * Onepager — Framework onepager orchestrator (ADR-004)
   *
   * Renders the single-page section flow:
   *   - Hero in its own scene-full-bleed wrapper
   *   - Remaining enabled sections via SectionRenderer, each in scene-full-bleed
   *
   * Extracted from +page.svelte so every PM3 project reuses the same
   * scrollytelling chrome without duplicating orchestration logic.
   *
   * @props sections — enabled non-hero homepage sections (from HOMEPAGE_SECTIONS)
   * @props content — section content from the page server load
   * @example <Onepager sections={enabledSections} content={data.sectionContent} />
   */
  import { t } from '$lib/stores/content.svelte'
  import SectionHero from '$lib/components/sections/SectionHero.svelte'
  import SectionRenderer from '$lib/components/complex/SectionRenderer.svelte'
  import type { HomepageSection } from '$lib/config/site'
  import type { SectionContent } from '../sections/types'

  let {
    sections,
    content
  }: {
    sections: HomepageSection[]
    content?: SectionContent
  } = $props()
</script>

<div class="has-scrolly-bg">
  <div class="scene-full-bleed">
    <SectionHero
      title={t('hero.title', t('sections.hero'))}
      subtitle={t('hero.subtitle', '')}
      primaryCta={t('hero.primaryCta', t('nav.contact'))}
      secondaryCta={t('hero.secondaryCta', t('nav.portfolio'))}
    />
  </div>

  {#each sections as section (section.id)}
    <div class="scene-full-bleed">
      <SectionRenderer sectionId={section.id} content={content} />
    </div>
  {/each}
</div>
