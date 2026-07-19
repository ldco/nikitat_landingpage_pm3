<script lang="ts">
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

<section id="clients" class={twMerge(clsx('section section-bg-sunken', className))}>
  <div class="w-full mx-auto" style="max-width: var(--content-default, 80rem); padding-inline: clamp(1rem, 3vw, 3rem);">
    <h2 class="section-title">{m.sections_clients()}</h2>

    <div class="clients-strip">
      {#each clients as client}
        {#if client.websiteUrl}
          <a href={client.websiteUrl} target="_blank" rel="noopener noreferrer" class="client-logo-link">
            {#if client.logoUrl}
              <img src={client.logoUrl} alt={client.name} class="client-logo" />
            {:else}
              <span class="client-name">{client.name}</span>
            {/if}
          </a>
        {:else}
          {#if client.logoUrl}
            <img src={client.logoUrl} alt={client.name} class="client-logo" />
          {:else}
            <span class="client-name">{client.name}</span>
          {/if}
        {/if}
      {:else}
        <p class="text-center text-pm-muted col-span-full py-16">{m.common_note()}</p>
      {/each}
    </div>
  </div>
</section>

<style>
  .section {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-block-start: calc(var(--header-height, 72px) + var(--space-12));
    padding-block-end: var(--space-16);
    scroll-margin-top: 0;
  }
  .section-bg-sunken { background: var(--color-pm-bg-sunken); }
  .section-title {
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: var(--font-weight-bold);
    line-height: var(--leading-tight);
    margin-block-end: var(--space-8);
    text-align: center;
  }
  .clients-strip {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: var(--gap-lg);
    opacity: 0.5;
    filter: grayscale(1);
    transition: opacity 0.5s, filter 0.5s;
  }
  .clients-strip:hover { opacity: 1; filter: grayscale(0); }
  .client-logo-link { display: block; }
  .client-logo { height: 2rem; width: auto; }
  .client-name { font-size: var(--text-sm); font-weight: var(--font-weight-medium); color: var(--color-pm-text-muted); }
</style>
