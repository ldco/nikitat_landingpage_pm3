<script lang="ts">
  /**
   * SectionRenderer — Resolves and renders a section via the registry (ADR-003)
   *
   * Reads HOMEPAGE_SECTIONS config to find the section, then dispatches to the
   * component registered in SECTION_REGISTRY (framework + project sections).
   * Project sections extend the framework catalog — no framework edits needed.
   *
   * @props sectionId?: string — section id from HOMEPAGE_SECTIONS
   * @props content?: Record<string, unknown> — content from +page.server.ts
   * @props class?: string — merged Tailwind classes
   * @example <SectionRenderer sectionId="about" content={data.sectionContent} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { t } from '$lib/stores/content.svelte'
  import { HOMEPAGE_SECTIONS } from '$lib/config/site'
  import { SECTION_REGISTRY } from '../sections/registry'

  const REG = SECTION_REGISTRY

  let {
    sectionId,
    content,
    class: className = ''
  }: {
    sectionId?: string
    content?: Record<string, unknown>
    class?: string
  } = $props()

  interface BlogPost { slug: string; title: string; excerpt?: string; coverImageUrl?: string; publishedAt?: string }
  interface PortfolioItem { id: number; slug: string; name: string; type: string; coverImageUrl?: string }
  interface PricingTier { id: string; name: string; description?: string; price: number | null; currency?: string; period?: string }
  interface FaqItem { id: number; question: string; answer: string }
  interface FeatureItem { title: string; description: string; icon?: string }

  const section = $derived(
    sectionId ? HOMEPAGE_SECTIONS.find(s => s.id === sectionId && s.enabled) : null
  )

  const sectionData = $derived(content ?? {})
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
      <REG.SectionPortfolio items={(sectionData.portfolioItems ?? []) as PortfolioItem[]} />
    {:else if section.component === 'SectionContact'}
      <REG.SectionContact />
    {:else if section.component === 'SectionBlog'}
      <REG.SectionBlog posts={(sectionData.blog ?? []) as BlogPost[]} />
    {:else if section.component === 'SectionFeatures'}
      <REG.SectionFeatures features={(sectionData.features ?? []) as FeatureItem[]} />
    {:else if section.component === 'SectionFaq'}
      <REG.SectionFaq items={(sectionData.faq ?? []) as FaqItem[]} />
    {:else if section.component === 'SectionPricing'}
      <REG.SectionPricing tiers={(sectionData.pricing ?? []) as PricingTier[]} />
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
