<script lang="ts">
  /**
  * SectionClients — Client logos (PM3 rule 6)
 *
 * @example <SectionClients />
  */
  import { clsx } from 'clsx'
  import * as m from '$lib/i18n'
  import { FEATURES, MODULES } from '$lib/config/site'
  import Section from '$lib/components/atoms/Section.svelte'
  import SectionContent from '$lib/components/molecules/SectionContent.svelte'

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
    <h2 class="text-fluid-3xl font-bold leading-tight mb-8 text-center">{m.sections_clients()}</h2>
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
        <p class="text-center text-pm-muted col-span-full py-16">{m.common_note()}</p>
      {/each}
    </div>
  </SectionContent>
</Section>
