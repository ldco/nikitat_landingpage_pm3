<script lang="ts">
  /**
   * SectionRenderer — Resolves and renders a section via the registry (ADR-003)
   *
   * Reads HOMEPAGE_SECTIONS config to find the section, then dispatches to the
   * component registered in SECTION_REGISTRY (framework + project sections).
   * Project sections extend the framework catalog — no framework edits needed.
   *
   * Content is typed via SectionContent — the boundary contract from
   * +page.server.ts. Sections receive typed props; no `unknown` casts.
   *
   * @props sectionId?: string — section id from HOMEPAGE_SECTIONS
   * @props content?: SectionContent — typed content from +page.server.ts
   * @props class?: string — merged Tailwind classes
   * @example <SectionRenderer sectionId="about" content={data.sectionContent} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { t } from '$lib/stores/content.svelte'
  import { HOMEPAGE_SECTIONS } from '$lib/config/site'
  import { SECTION_REGISTRY } from '../sections/registry'
  import type { SectionContent } from '../sections/types'

  const REG = SECTION_REGISTRY

  let {
    sectionId,
    content,
    class: className = ''
  }: {
    sectionId?: string
    content?: SectionContent
    class?: string
  } = $props()

  const section = $derived(
    sectionId ? HOMEPAGE_SECTIONS.find(s => s.id === sectionId && s.enabled) : null
  )

  const sectionData = $derived<SectionContent>(content ?? {
    blog: [], portfolioItems: [], pricing: [], faq: [], features: [], locale: ''
  })
</script>

{#if section}
  <div class={twMerge(clsx(className))}>
    {#if section.component === 'SectionAbout'}
      <REG.SectionAbout />
    {:else if section.component === 'SectionFocus'}
      <REG.SectionFocus />
    {:else if section.component === 'SectionF22'}
      <REG.SectionF22 />
    {:else if section.component === 'SectionPortfolio'}
      <REG.SectionPortfolio items={sectionData.portfolioItems} />
    {:else if section.component === 'SectionContact'}
      <REG.SectionContact />
    {:else if section.component === 'SectionBlog'}
      <REG.SectionBlog posts={sectionData.blog} />
    {:else if section.component === 'SectionFeatures'}
      <REG.SectionFeatures features={sectionData.features} />
    {:else if section.component === 'SectionFaq'}
      <REG.SectionFaq items={sectionData.faq} />
    {:else if section.component === 'SectionPricing'}
      <REG.SectionPricing tiers={sectionData.pricing} />
    {:else if section.component === 'SectionTeam'}
      <REG.SectionTeam />
    {:else if section.component === 'SectionTestimonials'}
      <REG.SectionTestimonials />
    {:else if section.component === 'SectionClients'}
      <REG.SectionClients />
    {:else}
      <p class="text-sm text-pm-muted text-center py-8">{t('common.sectionComponentNotFound', { section: section.component })}</p>
    {/if}
  </div>
{/if}
