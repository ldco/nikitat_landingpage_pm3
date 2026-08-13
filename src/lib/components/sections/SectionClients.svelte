<script lang="ts">
  /**
  * SectionClients — Client logos (PM3 rule 6)
 *
 * @props {Array<{id: number; name: string; logoUrl?: string; websiteUrl?: string}>} [clients=[]] — client logos to display in the strip
 * @props {string} [class] — additional CSS classes merged via twMerge
 *
 * @example <SectionClients />
  */
  import { clsx } from 'clsx'
  import { t } from '$lib/stores/content.svelte'
  import { FEATURES, MODULES } from '$lib/config/site'
  import Section from '$lib/components/atoms/Section.svelte'
  import SectionContent from '$lib/components/molecules/SectionContent.svelte'
  import SectionHeading from '$lib/components/molecules/SectionHeading.svelte'

  let {
    clients = [] as Array<{ id: number; name: string; logoUrl?: string; websiteUrl?: string }>,
    class: className = ''
  }: {
    clients?: Array<{ id: number; name: string; logoUrl?: string; websiteUrl?: string }>
    class?: string
  } = $props()

  const isContained = $derived(FEATURES.bodyWidthMode === 'contained')
  const clientsModule = MODULES.clients as { config?: { grayscale?: boolean; hoverColor?: boolean } } | undefined
  const clientsConfig = clientsModule?.config ?? { grayscale: true, hoverColor: true }
</script>

<Section id="clients" background="sunken" class={className}>
  <SectionContent width={isContained ? 'default' : 'full'}>
    <SectionHeading title={t('sections.clients')} align="center" />
    <div class={clsx('flex flex-wrap items-center justify-center gap-8 transition-all duration-500',
      clientsConfig.grayscale && 'opacity-50 grayscale hover:opacity-100 hover:grayscale-0',
    )}>
      {#each clients as client}
        {#if client.websiteUrl}
          <a href={client.websiteUrl} target="_blank" rel="noopener noreferrer">
            {#if client.logoUrl}
              <img src={client.logoUrl} alt={client.name} class="h-8 w-auto" />
            {:else}
              <span class="text-sm font-medium text-pm-muted">{client.name}</span>
            {/if}
          </a>
        {:else}
          {#if client.logoUrl}
            <img src={client.logoUrl} alt={client.name} class="h-8 w-auto" />
          {:else}
            <span class="text-sm font-medium text-pm-muted">{client.name}</span>
          {/if}
        {/if}
      {:else}
        <p class="text-center text-pm-muted col-span-full py-16">{t('common.note')}</p>
      {/each}
    </div>
  </SectionContent>
</Section>
