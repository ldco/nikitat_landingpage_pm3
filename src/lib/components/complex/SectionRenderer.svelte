<script lang="ts">
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

  type Cmp = typeof SectionAbout

  const COMPONENT_MAP: Record<string, Cmp> = {
    SectionAbout, SectionFocus, SectionF22, SectionPortfolio,
    SectionContact, SectionBlog, SectionFeatures, SectionFaq,
    SectionPricing, SectionTeam, SectionTestimonials, SectionClients
  }

  let {
    sectionId,
    class: className = ''
  }: { sectionId?: string; class?: string } = $props()

  const section = $derived(
    sectionId ? HOMEPAGE_SECTIONS.find(s => s.id === sectionId && s.enabled) : null
  )

  const Cmp = $derived(section ? COMPONENT_MAP[section.component] : null)
</script>

{#if Cmp}
  <div class={twMerge(clsx(className))}>
    <Cmp />
  </div>
{:else if section}
  <p class="text-sm text-pm-muted text-center py-8">Unknown section: {section.component}</p>
{/if}
