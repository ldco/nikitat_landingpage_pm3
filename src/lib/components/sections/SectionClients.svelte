<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import { FEATURES, MODULES } from '$lib/config/site'

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

<section id="clients" class={twMerge(clsx(
  'flex flex-col items-center bg-pm-bg-sunken',
  'pt-[var(--pt-section)] pb-16',
  className
))}>
  <div class={clsx('w-full mx-auto', isContained && 'max-w-container')} style="padding-inline: var(--px-container);">
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
  </div>
</section>
