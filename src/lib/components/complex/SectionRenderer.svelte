<script lang="ts">
  /**
   * SectionRenderer — Maps sectionId to its Svelte component (PM3 rule 6)
   *
   * Reads HOMEPAGE_SECTIONS config to resolve component + enabled state.
   * Passes section-specific content from the page server load (rule 8).
   *
   * @props sectionId?: string — section id from HOMEPAGE_SECTIONS
   * @props content?: Record<string, unknown> — content from +page.server.ts
   * @props class?: string — merged Tailwind classes
   * @example <SectionRenderer sectionId="about" content={data.sectionContent} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { HOMEPAGE_SECTIONS } from '$lib/config/site'
  import SectionAbout from '../sections/SectionAbout.svelte'
  import SectionFocus from '../sections/SectionFocus.svelte'
  import SectionF22 from '../sections/SectionF22.svelte'
  import SectionPortfolio from '../sections/SectionPortfolio.svelte'
  import SectionContact from '../sections/SectionContact.svelte'
  import SectionBlog from '../sections/SectionBlog.svelte'
  import SectionFeatures from '../sections/SectionFeatures.svelte'
  import SectionFaq from '../sections/SectionFaq.svelte'
  import SectionPricing from '../sections/SectionPricing.svelte'
  import SectionTeam from '../sections/SectionTeam.svelte'
  import SectionTestimonials from '../sections/SectionTestimonials.svelte'
  import SectionClients from '../sections/SectionClients.svelte'

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
      <SectionAbout />
    {:else if section.component === 'SectionFocus'}
      <SectionFocus />
    {:else if section.component === 'SectionF22'}
      <SectionF22 />
    {:else if section.component === 'SectionPortfolio'}
      <SectionPortfolio items={(sectionData.portfolioItems ?? []) as PortfolioItem[]} />
    {:else if section.component === 'SectionContact'}
      <SectionContact />
    {:else if section.component === 'SectionBlog'}
      <SectionBlog posts={(sectionData.blog ?? []) as BlogPost[]} />
    {:else if section.component === 'SectionFeatures'}
      <SectionFeatures features={(sectionData.features ?? []) as FeatureItem[]} />
    {:else if section.component === 'SectionFaq'}
      <SectionFaq items={(sectionData.faq ?? []) as FaqItem[]} />
    {:else if section.component === 'SectionPricing'}
      <SectionPricing tiers={(sectionData.pricing ?? []) as PricingTier[]} />
    {:else if section.component === 'SectionTeam'}
      <SectionTeam />
    {:else if section.component === 'SectionTestimonials'}
      <SectionTestimonials />
    {:else if section.component === 'SectionClients'}
      <SectionClients />
    {:else}
      <p class="text-sm text-pm-muted text-center py-8">Unknown section: {section.component}</p>
    {/if}
  </div>
{/if}
