<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import { FEATURES } from '$lib/config/site'
  import { t } from '$lib/stores/content.svelte'

  let {
    class: className = ''
  }: {
    class?: string
  } = $props()

  const isContained = $derived(FEATURES.bodyWidthMode === 'contained')
  const title = $derived(t('focus.title', m.sections_services()))

  const cards = $derived.by(() => {
    const result: Array<{ title: string; desc: string }> = []
    for (let i = 1; i <= 6; i++) {
      const cardTitle = t(`focus.card${i}.title`, '')
      const cardDesc = t(`focus.card${i}.desc`, '')
      if (cardTitle) result.push({ title: cardTitle, desc: cardDesc })
    }
    return result
  })
</script>

<section id="focus" class={twMerge(clsx(
  'flex flex-col items-center bg-pm-bg-elevated',
  'pt-[var(--pt-section)] pb-16',
  className
))}>
  <div class={clsx('w-full mx-auto', isContained && 'max-w-container')} style="padding-inline: var(--px-container);">
    <h2 class="section-title text-center">{title}</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--gap-lg)]">
      {#each cards as card}
        <div class="bg-pm-bg border border-pm-border rounded-xl p-6 transition-transform hover:-translate-y-0.5 hover:shadow-md">
          <h3 class="text-xl font-semibold mb-3 text-pm-text">{card.title}</h3>
          <p class="text-base text-pm-text-secondary leading-relaxed">{card.desc}</p>
        </div>
      {:else}
        <p class="text-center text-pm-muted col-span-full py-12">{m.common_note()}</p>
      {/each}
    </div>
  </div>
</section>
