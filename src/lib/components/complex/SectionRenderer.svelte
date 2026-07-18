<script lang="ts">
  /**
   * SectionRenderer — Dynamic section loader (onepager/SPA aware)
   *
   * Renders section components by name using a registry map.
   * Supports both onepager (anchor) and SPA (route) modes via config.
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { HOMEPAGE_SECTIONS } from '$lib/config/site'

  // Dynamic component registry — imported here so they're code-split
  const registry: Record<string, any> = {
    SectionHero: () => import('../sections/SectionHero.svelte'),
    SectionAbout: () => import('../sections/SectionAbout.svelte'),
    SectionFocus: () => import('../sections/SectionFocus.svelte'),
    SectionF22: () => import('../sections/SectionF22.svelte'),
    SectionPortfolio: () => import('../sections/SectionPortfolio.svelte'),
    SectionContact: () => import('../sections/SectionContact.svelte'),
    SectionBlog: () => import('../sections/SectionBlog.svelte'),
    SectionFeatures: () => import('../sections/SectionFeatures.svelte'),
    SectionFaq: () => import('../sections/SectionFaq.svelte'),
    SectionPricing: () => import('../sections/SectionPricing.svelte'),
    SectionTeam: () => import('../sections/SectionTeam.svelte'),
    SectionTestimonials: () => import('../sections/SectionTestimonials.svelte'),
    SectionClients: () => import('../sections/SectionClients.svelte')
  }

  let {
    sectionId,
    class: className = ''
  }: {
    sectionId?: string
    class?: string
  } = $props()

  // If sectionId provided, render only that section
  // Otherwise render all enabled homepage sections
  const sections = $derived(
    sectionId
      ? HOMEPAGE_SECTIONS.filter(s => s.id === sectionId && s.enabled)
      : HOMEPAGE_SECTIONS.filter(s => s.enabled)
  )
</script>

<div class={twMerge(clsx(className))}>
  {#each sections as section (section.id)}
    <section id={section.id} class="scroll-mt-16">
      <!-- Sections are loaded dynamically via their component wrappers -->
      <!-- Will use <svelte:component> or dynamic import in Phase 6 -->
      <p class="text-sm text-pm-muted text-center py-8">
        Section: {section.component} ({section.id})
      </p>
    </section>
  {/each}
</div>
