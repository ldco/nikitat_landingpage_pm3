<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import IconPhoto from '@tabler/icons-svelte/icons/photo'
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
        <IconPhoto class="size-12" />
      </div>
      <div>
        <p class="text-fluid-2xl text-pm-text-secondary leading-relaxed">{m.common_note()}</p>
      </div>
    </div>
  </div>
</section>
