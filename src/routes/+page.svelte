<script lang="ts">
  import { FEATURES, HOMEPAGE_SECTIONS } from '$lib/config/site'
  import SectionHero from '$lib/components/sections/SectionHero.svelte'
  import SectionRenderer from '$lib/components/complex/SectionRenderer.svelte'
  import * as m from '$lib/i18n'
  import { t } from '$lib/stores/content.svelte'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  const isOnepager = $derived(FEATURES.onepager)

  // PM v2 parity: sections render from HOMEPAGE_SECTIONS enabled flag only.
  const sections = $derived(
    HOMEPAGE_SECTIONS.filter(s =>
      s.id !== 'hero' && s.enabled && s.renderMode !== 'page'
    )
  )
</script>

{#if isOnepager}
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
        <SectionRenderer sectionId={section.id} content={data.sectionContent} />
      </div>
    {/each}
  </div>
{/if}
