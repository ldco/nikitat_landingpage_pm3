<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import { FEATURES } from '$lib/config/site'
  import { t } from '$lib/stores/content.svelte'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'

  let {
    class: className = ''
  }: {
    class?: string
  } = $props()

  const isContained = $derived(FEATURES.bodyWidthMode === 'contained')
  const title = $derived(t('f22.title', m.nav_f22()))
  const description = $derived(t('f22.description', ''))
  const ctaText = $derived(t('f22.cta', m.nav_contact()))
</script>

<section id="f22" class={twMerge(clsx(
  'flex flex-col items-center bg-pm-bg-sunken',
  'pt-[var(--pt-section)] pb-16',
  className
))}>
  <div class={clsx('w-full mx-auto', isContained && 'max-w-container')} style="padding-inline: var(--px-container);">
    <h2 class="section-title text-center">{title}</h2>
    <div class="flex flex-col items-center text-center max-w-2xl mx-auto">
      <p class="text-fluid-2xl text-pm-text-secondary leading-relaxed mb-8">
        {description || m.common_note()}
      </p>
      <CtaButton href="/#contact" variant="primary" size="lg">{ctaText}</CtaButton>
    </div>
  </div>
</section>
