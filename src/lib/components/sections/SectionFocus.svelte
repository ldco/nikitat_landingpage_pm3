<script lang="ts">
  /**
  * SectionFocus — Focus grid: 6 capability cards with dev/design categories (PM3 rule 6)
 *
 * Content from content store: focus.card1-6.title/.desc
 *
 * @props {string} [class] — additional CSS classes merged via twMerge
 * @example <SectionFocus />
  */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { t } from '$lib/stores/content.svelte'
  import Section from '$lib/components/atoms/Section.svelte'
  import EmptyState from '$lib/components/atoms/EmptyState.svelte'
  import Card from '$lib/components/atoms/Card.svelte'
  import SectionContent from '$lib/components/molecules/SectionContent.svelte'
  import SectionHeading from '$lib/components/molecules/SectionHeading.svelte'
  import IconCpu from '@tabler/icons-svelte/icons/cpu'
  import IconBuilding from '@tabler/icons-svelte/icons/building'
  import IconCode from '@tabler/icons-svelte/icons/code'
  import IconPalette from '@tabler/icons-svelte/icons/palette'
  import IconComponents from '@tabler/icons-svelte/icons/components'
  import IconTemplate from '@tabler/icons-svelte/icons/template'

  let {
    class: className = ''
  }: {
    class?: string
  } = $props()

  const title = $derived(t('focus.title', t('sections.services')))
  const devLabel = $derived(t('focus.dev', t('sections.services')))
  const designLabel = $derived(t('focus.design', t('sections.services')))
  type FocusCard = { title: string; desc: string; category: 'dev' | 'design'; icon: typeof IconCpu }
  const cards = $derived.by(() => {
    const icons = [IconCpu, IconBuilding, IconCode, IconPalette, IconComponents, IconTemplate]
    const result: FocusCard[] = []
    for (let i = 1; i <= 6; i++) {
      const ct = t(`focus.card${i}.title`, '')
      const cd = t(`focus.card${i}.desc`, '')
      if (ct) result.push({ title: ct, desc: cd, category: i <= 3 ? 'dev' : 'design', icon: icons[i - 1] ?? IconCode })
    }
    return result
  })
</script>

<Section id="focus" class={className}>
  <SectionContent>
    <SectionHeading title={title} align="center" />
    {#if cards.length > 0}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--gap-lg)]">
        {#each cards as card}
          <Card class={twMerge(clsx(
            'flex flex-col items-start shadow-frosted rounded-[var(--radius-xl)]',
            'border-t-[var(--focus-card-accent-height)] border-t-solid border-t-transparent',
            'transition-[transform,box-shadow] duration-200 ease-smooth',
            card.category === 'dev' ? 'border-t-pm-brand' : 'border-t-pm-brand-subtle'
          ))}>
            <span class={twMerge(clsx(
              'inline-flex items-center px-[var(--space-2)] py-[var(--space-1)] text-xs font-semibold leading-none rounded-full uppercase tracking-[0.08em]',
              card.category === 'dev' ? 'bg-pm-brand text-pm-white' : 'bg-pm-brand-subtle text-pm-brand'
            ))}>
              {card.category === 'dev' ? devLabel : designLabel}
            </span>
            <div class={twMerge(clsx(
              'size-12 flex items-center justify-center rounded-lg',
              card.category === 'dev' ? 'bg-pm-brand' : 'bg-pm-brand-subtle'
            ))}>
              <card.icon size={24} class={card.category === 'dev' ? 'text-pm-white' : 'text-pm-brand'} />
            </div>
            <h3 class="text-xl font-semibold mb-[var(--space-2)] text-pm-text">{card.title}</h3>
            <p class="text-base text-pm-text-secondary leading-relaxed">{card.desc}</p>
          </Card>
        {/each}
      </div>
    {:else}
      <EmptyState size="compact" title={t('common.note')} />
    {/if}
  </SectionContent>
</Section>
