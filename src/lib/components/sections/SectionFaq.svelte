<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import { FEATURES, MODULES } from '$lib/config/site'

  let {
    items = [] as Array<{ id: number; question: string; answer: string }>,
    class: className = ''
  }: {
    items?: Array<{ id: number; question: string; answer: string }>
    class?: string
  } = $props()

  const faqModule = MODULES.faq
  const faqConfig = faqModule ? faqModule.config : { expandFirst: true, allowMultipleOpen: false }
  const allowMultiple = faqConfig.allowMultipleOpen
  // Expand first item when data is loaded
  let openId = $state<number | null>(null)
  $effect(() => {
    if (faqConfig.expandFirst && items.length > 0) {
      const first = items[0]
      if (first && openId === null) openId = first.id
    }
  })
  function toggle(id: number) {
    if (allowMultiple) {
      openId = openId === id ? null : id
    } else {
      openId = openId === id ? null : id
    }
  }
  const isContained = $derived(FEATURES.bodyWidthMode === 'contained')
</script>

<section id="faq" class={twMerge(clsx(
  'flex flex-col items-center bg-pm-bg-elevated',
  'pt-[var(--pt-section)] pb-16',
  className
))}>
  <div class={clsx('w-full mx-auto', isContained && 'max-w-narrow')} style="padding-inline: var(--px-container);">
    <h2 class="text-fluid-3xl font-bold leading-tight mb-8 text-center">{m.sections_faq()}</h2>
    <div class="flex flex-col gap-[var(--gap-sm)]">
      {#each items as item}
        <div class="rounded-xl border border-pm-border bg-pm-bg overflow-hidden">
          <button class="flex items-center justify-between w-full px-6 py-4 text-left font-medium text-pm-text bg-transparent border-none cursor-pointer hover:bg-pm-bg-sunken transition-colors" onclick={() => toggle(item.id)} aria-expanded={openId === item.id}>
            <span>{item.question}</span>
            <svg class="w-5 h-5 text-pm-text-muted flex-shrink-0 transition-transform" class:rotate-180={openId === item.id} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9" /></svg>
          </button>
          {#if openId === item.id}
            <div class="px-6 pb-4 text-sm text-pm-text-secondary leading-relaxed">
              {item.answer}
            </div>
          {/if}
        </div>
      {:else}
        <p class="text-center text-pm-muted py-16">{m.common_note()}</p>
      {/each}
    </div>
  </div>
</section>
