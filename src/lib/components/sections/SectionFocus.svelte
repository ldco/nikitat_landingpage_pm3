<script lang="ts">
  import * as m from '$lib/i18n'
  import { t } from '$lib/stores/content.svelte'
  import IconCpu from '@tabler/icons-svelte/icons/cpu'
  import IconBuilding from '@tabler/icons-svelte/icons/building'
  import IconCode from '@tabler/icons-svelte/icons/code'
  import IconPalette from '@tabler/icons-svelte/icons/palette'
  import IconComponents from '@tabler/icons-svelte/icons/components'
  import IconTemplate from '@tabler/icons-svelte/icons/template'

  const title = $derived(t('focus.title', m.sections_services()))

  type Card = { title: string; desc: string; category: 'dev' | 'design'; icon: typeof IconCpu }
  const cards = $derived.by(() => {
    const result: Card[] = []
    const icons: Array<typeof IconCpu> = [IconCpu, IconBuilding, IconCode, IconPalette, IconComponents, IconTemplate]
    for (let i = 1; i <= 6; i++) {
      const cardTitle = t(`focus.card${i}.title`, '')
      const cardDesc = t(`focus.card${i}.desc`, '')
      if (cardTitle) {
        result.push({
          title: cardTitle,
          desc: cardDesc,
          category: i <= 3 ? 'dev' : 'design',
          icon: icons[i - 1] ?? IconCode
        })
      }
    }
    return result
  })
</script>

<section id="focus" class="section section-bg-sunken">
  <div class="section-body" style="padding-inline: var(--px-container);">
    <h2 class="section-title text-center">{title}</h2>

    {#if cards.length > 0}
      <div class="focus-grid">
        {#each cards as card}
          <div class="focus-card" class:focus-card--dev={card.category === 'dev'} class:focus-card--design={card.category === 'design'}>
            <span class="focus-card__badge" class:focus-card__badge--dev={card.category === 'dev'} class:focus-card__badge--design={card.category === 'design'}>
              {card.category === 'dev' ? 'dev' : 'design'}
            </span>
            <div class="focus-card__icon">
              <card.icon size={24} />
            </div>
            <h3 class="focus-card__title text-xl font-semibold">{card.title}</h3>
            <p class="focus-card__desc text-pm-text-secondary">{card.desc}</p>
          </div>
        {/each}
      </div>
    {:else}
      <p class="text-center text-pm-muted py-12">{m.common_note()}</p>
    {/if}
  </div>
</section>
