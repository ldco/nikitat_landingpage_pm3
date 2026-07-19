<script lang="ts">
  /**
   * SectionFaq — FAQ accordion (from API)
   * i18n: sections_faq, nav_faq
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'

  let {
    items = [] as Array<{ id: number; question: string; answer: string }>,
    class: className = ''
  }: {
    items?: Array<{ id: number; question: string; answer: string }>
    class?: string
  } = $props()

  let openId = $state<number | null>(null)

  function toggle(id: number) {
    openId = openId === id ? null : id
  }
</script>

<section class={twMerge(clsx('py-20 md:py-28 bg-pm-bg-elevated', className))}>
  <div class="container-narrow">
    <h2 class="text-3xl sm:text-4xl font-bold text-pm-text font-display text-center">
      {m.sections_faq()}
    </h2>
    <div class="mt-12 space-y-3">
      {#each items as item}
        <div class="rounded-xl border border-pm-border bg-pm-bg overflow-hidden">
          <button class="flex items-center justify-between w-full px-6 py-4 text-left font-medium text-pm-text hover:bg-pm-bg-sunken dark:hover:bg-pm-gray-750 transition-colors" onclick={() => toggle(item.id)}>
            <span>{item.question}</span>
            <svg class={clsx('w-5 h-5 text-pm-muted transition-transform duration-200', openId === item.id && 'rotate-180')} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9" /></svg>
          </button>
          {#if openId === item.id}
            <div class="px-6 pb-4 text-sm text-pm-text-secondary">
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
