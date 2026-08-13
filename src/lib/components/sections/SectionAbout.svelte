<script lang="ts">
  /**
   * SectionAbout — About section: brand bar, bio paragraphs, before/after visual
   *
   * PM v2 parity (SectionAbout.vue + runtime/section-about.css):
   * - Visual in squircle frame (border-radius 40%, 24px padding, l-bg bg)
   * - BeforeAfterSlider with /images/about/{2.png,2_r.png}
   * - Lead paragraph: brand accent bar (48×3px), section-body typography
   *
   * Content from content store: about.title, about.paragraph1, about.paragraph2
   *
   * @props {string} [class] — additional CSS classes merged via twMerge
   * @example <SectionAbout />
   */
  import { t } from '$lib/stores/content.svelte'
  import Section from '$lib/components/atoms/Section.svelte'
  import SectionContent from '$lib/components/molecules/SectionContent.svelte'
  import SectionHeading from '$lib/components/molecules/SectionHeading.svelte'
  import BeforeAfterSlider from '$lib/components/molecules/BeforeAfterSlider.svelte'

  let {
    class: className = ''
  }: {
    class?: string
  } = $props()

  const title = $derived(t('about.title', t('sections.about')))
  const paragraph1 = $derived(t('about.paragraph1', ''))
  const paragraph2 = $derived(t('about.paragraph2', ''))
  const hasContent = $derived(paragraph1.length > 0)
</script>

<Section id="about" class={className}>
  <SectionContent>
    <SectionHeading title={title} align="center" />

    <div class="flex flex-col items-center gap-[var(--gap-xl)]">
      <div class="w-[var(--about-visual-width)] aspect-square bg-pm-bg-sunken rounded-[var(--about-visual-radius)] flex items-center justify-center overflow-hidden text-pm-text-muted">
        <!-- PM2: .about-visual__border → 40% radius, l-bg, 24px padding -->
        <div class="w-full h-full rounded-[var(--about-visual-radius)] bg-pm-bg p-[var(--space-6)] box-border">
          <!-- PM2: .about-visual__squircle → 40% radius, overflow hidden -->
          <div class="w-full h-full rounded-[var(--about-visual-radius)] overflow-hidden">
            <BeforeAfterSlider
              beforeSrc="/images/about/2_r.png"
              afterSrc="/images/about/2.png"
              width={500}
              height={500}
              initial={0}
            />
          </div>
        </div>
      </div>

      <div class="w-full">
        {#if hasContent}
          <!-- Brand accent bar (PM2 .about-content__lead::before) -->
          <div class="w-12 h-[var(--about-accent-height)] bg-pm-brand rounded-full mb-[var(--space-4)]"></div>
          <!-- PM2 .section-body typography: font-size clamp(1.4-1.875), weight 400, color t-secondary -->
          <p class="mb-[var(--space-5)] text-[var(--text-section-body)] font-normal text-pm-text-secondary leading-relaxed">
            {paragraph1}
          </p>
          {#if paragraph2}
            <p class="text-[var(--text-section-body)] font-normal text-pm-text-secondary leading-relaxed">{paragraph2}</p>
          {/if}
        {:else}
          <p class="text-fluid-2xl text-pm-text-secondary leading-relaxed text-center">{t('common.note')}</p>
        {/if}
      </div>
    </div>
  </SectionContent>
</Section>
