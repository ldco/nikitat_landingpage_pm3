<script lang="ts">
  /**
   * SectionClients — Client logo strip (from API)
   * i18n: sections_clients
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'

  let {
    clients = [] as Array<{ id: number; name: string; logoUrl?: string; websiteUrl?: string }>,
    class: className = ''
  }: {
    clients?: Array<{ id: number; name: string; logoUrl?: string; websiteUrl?: string }>
    class?: string
  } = $props()
</script>

<section class={twMerge(clsx('py-16 md:py-20', className))}>
  <div class="container-wide">
    <h2 class="text-2xl font-bold text-pm-gray-900 dark:text-pm-white font-display text-center mb-8">
      {m.sections_clients()}
    </h2>
    <div class="flex flex-wrap items-center justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
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
        <p class="text-center text-pm-muted">{m.common_note()}</p>
      {/each}
    </div>
  </div>
</section>
