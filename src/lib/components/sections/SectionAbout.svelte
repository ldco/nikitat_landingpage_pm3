<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import { FEATURES } from '$lib/config/site'

  let {
    class: className = ''
  }: {
    class?: string
  } = $props()

  const isContained = $derived(FEATURES.bodyWidthMode === 'contained')
</script>

<section id="about" class={twMerge(clsx(
  'flex flex-col items-center',
  'pt-[var(--pt-section)] pb-16',
  className
))}>
  <div class={clsx('w-full mx-auto', isContained && 'max-w-container')} style="padding-inline: var(--px-container);">
    <h2 class="text-fluid-3xl font-bold leading-tight mb-8 text-center">
      {m.sections_about()}
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-[var(--gap-xl)] items-center">
      <div class="aspect-4/3 bg-pm-bg-sunken rounded-xl overflow-hidden flex items-center justify-center text-pm-text-muted">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
      </div>
      <div>
        <p class="text-fluid-2xl text-pm-text-secondary leading-relaxed">{m.common_note()}</p>
      </div>
    </div>
  </div>
</section>
