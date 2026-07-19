<script lang="ts">
  let items: Array<{ id: number; name: string; logoUrl?: string; websiteUrl?: string }> = []
</script>

<div class="max-w-content mx-auto">
  <div class="flex items-center justify-between gap-4 py-4 mb-6 border-b border-pm-border">
    <h1 class="text-2xl font-bold text-pm-text">Clients</h1>
    <span class="text-sm text-pm-text-muted">{items.length} total</span>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {#each items as item (item.id)}
      <div class="bg-pm-bg-elevated border border-pm-border rounded-xl p-5">
        <div class="flex gap-3 items-center mb-2">
          <div class="size-12 bg-pm-bg-sunken rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
            {#if item.logoUrl}<img src={item.logoUrl} alt={item.name} class="max-w-full max-h-full object-contain" />
            {:else}<span class="text-sm font-bold text-pm-text-muted">{item.name.charAt(0)}</span>{/if}
          </div>
          <h3 class="font-semibold text-pm-text">{item.name}</h3>
        </div>
        <p class="text-xs text-pm-text-muted">{item.websiteUrl ?? '—'}</p>
      </div>
    {:else}
      <p class="text-center text-pm-text-muted py-16 col-span-full">No clients found.</p>
    {/each}
  </div>
</div>
