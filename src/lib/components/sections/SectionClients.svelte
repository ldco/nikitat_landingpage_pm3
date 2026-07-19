<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import * as m from '$lib/i18n'
  import { FEATURES } from '$lib/config/site'

  let {
    clients = [] as Array<{ id: number; name: string; logoUrl?: string; websiteUrl?: string }>,
    class: className = ''
  }: {
    clients?: Array<{ id: number; name: string; logoUrl?: string; websiteUrl?: string }>
    class?: string
  } = $props()

  const isContained = $derived(FEATURES.bodyWidthMode === 'contained')
</script>

<section id="clients" class={twMerge(clsx(
  'flex flex-col items-center bg-pm-bg-sunken',
  'pt-[calc(clamp(56px,8vh,72px)+3rem)] pb-16',
  className
))}>
  <div class={clsx('w-full mx-auto', isContained && 'max-w-[1280px]')} style="padding-inline: clamp(1rem, 3vw, 3rem);">
    <h2 class="text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight mb-8 text-center">{m.sections_clients()}</h2>
    <div class="flex flex-wrap items-center justify-center gap-8 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
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
