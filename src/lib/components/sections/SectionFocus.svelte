<script lang="ts">
  /**
  * SectionFocus — Focus grid: 6 capability cards with dev/design categories (PM3 rule 6)
 *
 * Content from content store: focus.card1-6.title/.desc
 *
 * @example <SectionFocus />
  */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import { t } from '$lib/stores/content.svelte'
  import Section from '$lib/components/atoms/Section.svelte'
  import SectionContent from '$lib/components/molecules/SectionContent.svelte'
  import SectionHeading from '$lib/components/molecules/SectionHeading.svelte'
  import IconCpu from '@tabler/icons-svelte/icons/cpu'
  import IconBuilding from '@tabler/icons-svelte/icons/building'
  import IconCode from '@tabler/icons-svelte/icons/code'
  import IconPalette from '@tabler/icons-svelte/icons/palette'
  import IconComponents from '@tabler/icons-svelte/icons/components'
  import IconTemplate from '@tabler/icons-svelte/icons/template'

  const title = $derived(t('focus.title', m.sections_services()))
  const devLabel = $derived(t('focus.dev', m.sections_services()))
  const designLabel = $derived(t('focus.design', m.sections_services()))
  type Card = { title: string; desc: string; category: 'dev' | 'design'; icon: typeof IconCpu }
  const cards = $derived.by(() => {
    const icons = [IconCpu, IconBuilding, IconCode, IconPalette, IconComponents, IconTemplate]
    const result: Card[] = []
    for (let i = 1; i <= 6; i++) {
      const ct = t(`focus.card${i}.title`, '')
      const cd = t(`focus.card${i}.desc`, '')
      if (ct) result.push({ title: ct, desc: cd, category: i <= 3 ? 'dev' : 'design', icon: icons[i - 1] ?? IconCode })
    }
    return result
  })
</script>

<Section id="focus" background="sunken">
  <SectionContent>
    <SectionHeading title={title} align="center" />
    {#if cards.length > 0}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--gap-lg)]">
        {#each cards as card}
          <div class={twMerge(clsx('focus-card', card.category === 'dev' ? 'focus-card-branded' : 'focus-card-subtle'))}>
            <span class={card.category === 'dev' ? 'focus-badge focus-badge-dev' : 'focus-badge focus-badge-design'}>
              {card.category === 'dev' ? devLabel : designLabel}
            </span>
            <div class={card.category === 'dev' ? 'focus-icon-box focus-icon-box-dev' : 'focus-icon-box focus-icon-box-design'}>
              <card.icon size={24} class={card.category === 'dev' ? 'text-pm-white' : 'text-pm-brand'} />
            </div>
            <h3 class="text-xl font-semibold mb-[var(--space-2)] text-pm-text">{card.title}</h3>
            <p class="text-base text-pm-text-secondary leading-relaxed">{card.desc}</p>
          </div>
        {/each}
      </div>
    {:else}
      <p class="text-center text-pm-muted py-12">{m.common_note()}</p>
    {/if}
  </SectionContent>
</Section>
