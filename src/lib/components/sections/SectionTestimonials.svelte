<script lang="ts">
  /**
  * SectionTestimonials — Testimonial cards (PM3 rule 6)
  *
  * @props testimonials?: TestimonialCard[] — typed payload from SectionContent.testimonials
  * @props class?: string — merged Tailwind classes
  * @example <SectionTestimonials testimonials={content.testimonials} />
  */
  import { clsx } from 'clsx'
  import { t } from '$lib/stores/content.svelte'

  import { FEATURES, MODULES } from '$lib/config/site'
  import type { TestimonialCard } from './types'
  import IconChevronLeft from '@tabler/icons-svelte/icons/chevron-left'
  import IconChevronRight from '@tabler/icons-svelte/icons/chevron-right'
  import Section from '$lib/components/atoms/Section.svelte'
  import SectionContent from '$lib/components/molecules/SectionContent.svelte'

  let {
    testimonials = [] as TestimonialCard[],
    class: className = ''
  }: {
    testimonials?: TestimonialCard[]
    class?: string
  } = $props()

  let current = $state(0)
  function next() { current = (current + 1) % Math.max(testimonials.length, 1) }
  function prev() { current = (current - 1 + testimonials.length) % Math.max(testimonials.length, 1) }
  const isContained = $derived(FEATURES.bodyWidthMode === 'contained')

  // Module sub-configs
  const testimonialModule = MODULES.testimonials as { enabled?: boolean; config: { autoPlay?: boolean; autoPlayInterval?: number } } | undefined
  const testimonialConfig = testimonialModule ? testimonialModule.config : { autoPlay: false, autoPlayInterval: 5000 }

  $effect(() => {
    if (!testimonialConfig.autoPlay || testimonials.length <= 1) return
    const interval = setInterval(next, testimonialConfig.autoPlayInterval ?? 5000)
    return () => clearInterval(interval)
  })
</script>

<Section id="testimonials" background="default" class={className}>
  <SectionContent width={isContained ? 'narrow' : 'full'}>
    <h2 class="text-fluid-3xl font-bold leading-tight mb-8 text-center">{t('sections.testimonials')}</h2>
    {#if testimonials.length > 0}
      <div class="text-center p-8 rounded-xl bg-pm-bg-elevated border border-pm-border shadow-md">
        <blockquote class="text-lg text-pm-text-secondary italic leading-relaxed">"{testimonials[current]?.quote}"</blockquote>
        <div class="mt-6">
          <p class="font-bold text-pm-text">{testimonials[current]?.authorName}</p>
          {#if testimonials[current]?.authorTitle || testimonials[current]?.authorCompany}
            <p class="text-sm text-pm-text-muted mt-1">{testimonials[current]?.authorTitle}{testimonials[current]?.authorTitle && testimonials[current]?.authorCompany ? ', ' : ''}{testimonials[current]?.authorCompany}</p>
          {/if}
        </div>
        {#if testimonials.length > 1}
          <div class="flex items-center justify-center gap-4 mt-6">
            <button aria-label={t('testimonials.previous')} class="p-2 rounded-full border border-pm-border text-pm-text-secondary hover:bg-pm-bg-sunken transition-colors cursor-pointer" onclick={prev}>
              <IconChevronLeft class="size-4" />
            </button>
            <div class="flex gap-2">
              {#each testimonials as _, i}
                <button aria-label={t('testimonials.goTo', { i: i + 1 })} class="w-2 h-2 rounded-full transition-colors cursor-pointer" class:bg-pm-brand={i === current} class:bg-pm-text-muted={i !== current} onclick={() => current = i}></button>
              {/each}
            </div>
            <button aria-label={t('testimonials.next')} class="p-2 rounded-full border border-pm-border text-pm-text-secondary hover:bg-pm-bg-sunken transition-colors cursor-pointer" onclick={next}>
              <IconChevronRight class="size-4" />
            </button>
          </div>
        {/if}
      </div>
    {:else}
      <p class="text-center text-pm-muted py-16">{t('common.note')}</p>
    {/if}
  </SectionContent>
</Section>
