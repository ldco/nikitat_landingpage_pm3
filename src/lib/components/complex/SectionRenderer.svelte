<script lang="ts">
  /**
   * SectionRenderer — Resolves and renders a section via the registry (ADR-003)
   *
   * Reads HOMEPAGE_SECTIONS config to find the section, resolves the component
   * DIRECTLY from SECTION_REGISTRY (framework + project sections), and spreads
   * the props produced by the typed prop-adapter (sections/props.ts).
   *
   * Project sections extend the framework catalog — no framework edits needed:
   * they register in src/project/registry.ts and render here with `{}` props
   * unless the adapter explicitly maps a content slice to them.
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
  import { buildSectionProps } from '../sections/props'
  import type { SectionContent } from '../sections/types'

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
    blog: [], portfolios: [], pricing: [], faq: [], features: [],
    team: [], testimonials: [], clients: [], locale: ''
  })

  const SectionComponent = $derived(section ? SECTION_REGISTRY[section.component] : null)
  const sectionProps = $derived(section ? buildSectionProps(section.component, sectionData) : {})
</script>

{#if section && SectionComponent}
  {@const Comp = SectionComponent}
  <div class={twMerge(clsx(className))}>
    <Comp {...sectionProps} />
  </div>
{:else if section}
  <p class="text-sm text-pm-muted text-center py-8">{t('common.sectionComponentNotFound', { section: section.component })}</p>
{/if}
