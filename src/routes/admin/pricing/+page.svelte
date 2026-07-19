<script lang="ts">
  import type { PageData } from './$types'
  let { data }: { data: PageData } = $props()
  const items = $derived(data.items)
</script>

<div class="max-w-content mx-auto">
  <div class="flex items-center justify-between gap-4 py-4 mb-6 border-b border-pm-border">
    <h1 class="text-2xl font-bold text-pm-text">Pricing Tiers</h1>
    <span class="text-sm text-pm-text-muted">{items.length} total</span>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    {#each items as item (item.id)}
      <div class="bg-pm-bg-elevated border border-pm-border rounded-xl p-5">
        <h3 class="font-semibold text-pm-text mb-1">{item.name}</h3>
        <p class="text-2xl font-bold text-pm-brand mb-2">{item.price ?? 'Custom'}</p>
        <div class="flex gap-2 text-xs text-pm-text-muted">
          <span>{item.slug}</span>
          {#if item.featured}<span class="px-1.5 py-0.5 rounded bg-pm-brand-subtle text-pm-brand">Featured</span>{/if}
        </div>
      </div>
    {:else}
      <p class="text-center text-pm-text-muted py-16 col-span-full">No tiers found.</p>
    {/each}
  </div>
</div>
