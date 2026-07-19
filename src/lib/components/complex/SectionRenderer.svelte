<script lang="ts">
  /**
   * SectionRenderer — Renders section components by name
   *
   * Maps HOMEPAGE_SECTIONS config to actual Svelte components.
   * Supports both onepager (anchor) and SPA (route) modes.
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { HOMEPAGE_SECTIONS } from '$lib/config/site'

  // Direct imports for all section components (code-split by Vite)
  import SectionHero from '../sections/SectionHero.svelte'
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
    class: className = ''
  }: {
    sectionId?: string
    class?: string
  } = $props()

  const sections = $derived(
    sectionId
      ? HOMEPAGE_SECTIONS.filter(s => s.id === sectionId && s.enabled)
      : HOMEPAGE_SECTIONS.filter(s => s.enabled)
  )
</script>

<div class={twMerge(clsx(className))}>
  {#each sections as section (section.id)}
    <section id={section.id} class="scroll-mt-16">
      {#if section.component === 'SectionHero'}
        <SectionHero />
      {:else if section.component === 'SectionAbout'}
        <SectionAbout />
      {:else if section.component === 'SectionFocus'}
        <SectionFocus />
      {:else if section.component === 'SectionF22'}
        <SectionF22 />
      {:else if section.component === 'SectionPortfolio'}
        <SectionPortfolio />
      {:else if section.component === 'SectionContact'}
        <SectionContact />
      {:else if section.component === 'SectionBlog'}
        <SectionBlog />
      {:else if section.component === 'SectionFeatures'}
        <SectionFeatures />
      {:else if section.component === 'SectionFaq'}
        <SectionFaq />
      {:else if section.component === 'SectionPricing'}
        <SectionPricing />
      {:else if section.component === 'SectionTeam'}
        <SectionTeam />
      {:else if section.component === 'SectionTestimonials'}
        <SectionTestimonials />
      {:else if section.component === 'SectionClients'}
        <SectionClients />
      {:else}
        <p class="text-sm text-pm-muted text-center py-8">Unknown section: {section.component}</p>
      {/if}
    </section>
  {/each}
</div>
