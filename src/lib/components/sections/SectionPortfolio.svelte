<script lang="ts">
  /**
  * SectionPortfolio — Portfolio items grid (PM3 rule 6)
 *
 * @example <SectionPortfolio />
  */
  import IconPhoto from '@tabler/icons-svelte/icons/photo'
  import * as m from '$lib/i18n'
  import { FEATURES, MODULES } from '$lib/config/site'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import Section from '$lib/components/atoms/Section.svelte'
  import SectionContent from '$lib/components/molecules/SectionContent.svelte'

  let {
    items = [] as Array<{ id: number; slug: string; name: string; type: string; coverImageUrl?: string }>,
    class: className = ''
  }: {
    items?: Array<{ id: number; slug: string; name: string; type: string; coverImageUrl?: string }>
    class?: string
  } = $props()

  const isContained = $derived(FEATURES.bodyWidthMode === 'contained')
</script>

<Section id="portfolio" background="elevated" class={className}>
  <SectionContent width={isContained ? 'default' : 'full'}>
    <h2 class="text-fluid-3xl font-bold leading-tight mb-8 text-center">{m.sections_portfolio()}</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--gap-lg)]">
      {#each items as item (item.id)}
        <a href="/portfolio/{item.slug}" class="relative block rounded-xl overflow-hidden aspect-4/3 transition-transform hover:-translate-y-0.5 hover:shadow-lg">
          {#if item.coverImageUrl}
            <img src={item.coverImageUrl} alt={item.name} class="w-full h-full object-cover" />
          {:else}
            <div class="w-full h-full bg-pm-bg-sunken flex items-center justify-center text-pm-text-muted">
              <IconPhoto class="size-12" />
            </div>
          {/if}
          <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4 text-white">
            <span class="text-lg font-semibold">{item.name}</span>
            <span class="text-sm opacity-80">{item.type}</span>
          </div>
        </a>
      {:else}
        <p class="text-center text-pm-muted col-span-full py-12">{m.common_note()}</p>
      {/each}
    </div>
    <div class="flex justify-center mt-10">
      <CtaButton href="/portfolio" variant="outline" size="lg">{m.common_more()}</CtaButton>
    </div>
  </SectionContent>
</Section>
