<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import IconPhoto from '@tabler/icons-svelte/icons/photo'
  import * as m from '$lib/i18n'
  import { FEATURES } from '$lib/config/site'
  import { t } from '$lib/stores/content.svelte'

  let {
    class: className = ''
  }: {
    class?: string
  } = $props()

  const isContained = $derived(FEATURES.bodyWidthMode === 'contained')
  const title = $derived(t('about.title', m.sections_about()))
  const paragraph1 = $derived(t('about.paragraph1', ''))
  const paragraph2 = $derived(t('about.paragraph2', ''))
  const hasContent = $derived(paragraph1.length > 0)
</script>

<section id="about" class={twMerge(clsx(
  'flex flex-col items-center',
  'pt-[var(--pt-section)] pb-16',
  className
))}>
  <div class={clsx('w-full mx-auto', isContained && 'max-w-container')} style="padding-inline: var(--px-container);">
    <h2 class="section-title text-center">
      {title}
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-[var(--gap-xl)] items-center">
      <div class="aspect-4/3 bg-pm-bg-sunken rounded-xl overflow-hidden flex items-center justify-center text-pm-text-muted">
        <IconPhoto class="size-12" />
      </div>
      <div class="space-y-4">
        {#if hasContent}
          <p class="text-fluid-xl text-pm-text font-medium leading-relaxed">{paragraph1}</p>
          {#if paragraph2}
            <p class="text-fluid-lg text-pm-text-secondary leading-relaxed">{paragraph2}</p>
          {/if}
        {:else}
          <p class="text-fluid-2xl text-pm-text-secondary leading-relaxed">{m.common_note()}</p>
        {/if}
      </div>
    </div>
  </div>
</section>
