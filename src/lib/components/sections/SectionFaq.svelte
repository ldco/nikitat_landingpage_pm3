<script lang="ts">
  /**
  * SectionFaq — FAQ accordion (PM3 rule 6)
 *
 * @props {Array<{id: number; question: string; answer: string}>} [items=[]] — FAQ items to render in the accordion
 * @props {string} [class] — additional CSS classes merged via twMerge
 *
 * @example <SectionFaq />
  */
  import { clsx } from 'clsx'
  import { t } from '$lib/stores/content.svelte'
  import { FEATURES, MODULES } from '$lib/config/site'
  import IconChevronDown from '@tabler/icons-svelte/icons/chevron-down'
  import Section from '$lib/components/atoms/Section.svelte'
  import EmptyState from '$lib/components/atoms/EmptyState.svelte'
  import SectionContent from '$lib/components/molecules/SectionContent.svelte'
  import SectionHeading from '$lib/components/molecules/SectionHeading.svelte'

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
  // Expand first item when data is loaded. A Set holds the open ids so the
  // module's allowMultipleOpen flag genuinely controls multi-open vs single.
  let openIds = $state<Set<number>>(new Set())
  $effect(() => {
    if (faqConfig.expandFirst && items.length > 0) {
      const first = items[0]
      if (first && openIds.size === 0) openIds = new Set([first.id])
    }
  })
  function toggle(id: number) {
    const next = new Set(openIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    openIds = allowMultiple ? next : next.has(id) ? new Set([id]) : new Set()
  }
  const isContained = $derived(FEATURES.bodyWidthMode === 'contained')
</script>

<Section id="faq" background="elevated" class={className}>
  <SectionContent width={isContained ? 'narrow' : 'full'}>
    <SectionHeading title={t('sections.faq')} align="center" />
    <div class="flex flex-col gap-[var(--gap-sm)]">
      {#each items as item}
        <div class="rounded-xl border border-pm-border bg-pm-bg overflow-hidden">
          <button class="flex items-center justify-between w-full px-6 py-4 text-left font-medium text-pm-text bg-transparent border-none cursor-pointer hover:bg-pm-bg-sunken transition-colors" onclick={() => toggle(item.id)} aria-expanded={openIds.has(item.id)}>
            <span>{item.question}</span>
            <IconChevronDown class={clsx('size-5 text-pm-text-muted flex-shrink-0 transition-transform', openIds.has(item.id) && 'rotate-180')} />
          </button>
          {#if openIds.has(item.id)}
            <div class="px-6 pb-4 text-sm text-pm-text-secondary leading-relaxed">
              {item.answer}
            </div>
          {/if}
        </div>
      {:else}
        <EmptyState size="compact" title={t('common.note')} />
      {/each}
    </div>
  </SectionContent>
</Section>
