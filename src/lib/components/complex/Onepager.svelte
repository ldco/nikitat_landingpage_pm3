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
  import * as m from '$lib/i18n'
  import { t } from '$lib/stores/content.svelte'
  import SectionHero from '$lib/components/sections/SectionHero.svelte'
  import SectionRenderer from '$lib/components/complex/SectionRenderer.svelte'
  import type { HomepageSection } from '$lib/config/site'

  let {
    sections,
    content
  }: {
    sections: HomepageSection[]
    content?: Record<string, unknown>
  } = $props()
</script>

<div class="has-scrolly-bg">
  <div class="scene-full-bleed">
    <SectionHero
      title={t('hero.title', m.sections_hero())}
      subtitle={t('hero.subtitle', '')}
      primaryCta={t('hero.primaryCta', m.nav_contact())}
      secondaryCta={t('hero.secondaryCta', m.nav_portfolio())}
    />
  </div>

  {#each sections as section (section.id)}
    <div class="scene-full-bleed">
      <SectionRenderer sectionId={section.id} content={content} />
    </div>
  {/each}
</div>
