<script lang="ts">
  /**
   * SectionF22 — F22 project feature section
   * i18n: sections_home, nav_f22 (if available)
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'

  let {
    title = '',
    description = '',
    class: className = ''
  }: {
    title?: string
    description?: string
    class?: string
  } = $props()
</script>

<section class={twMerge(clsx('py-20 md:py-28', className))}>
  <div class="container-wide">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div>
        <h2 class="text-3xl sm:text-4xl font-bold text-pm-text font-display">
          {title}
        </h2>
        <p class="mt-6 text-lg text-pm-text-muted leading-relaxed">
          {description}
        </p>
        <div class="mt-8">
          <CtaButton href="/portfolio" variant="primary">{m.common_more()}</CtaButton>
        </div>
      </div>
      <div class="aspect-video rounded-xl overflow-hidden bg-pm-bg-sunken flex items-center justify-center text-pm-muted text-lg">
        {title || 'Project'}
      </div>
    </div>
  </div>
</section>
