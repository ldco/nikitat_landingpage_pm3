<script lang="ts">
  import type { PageData } from './$types'
  let { data }: { data: PageData } = $props()
  const items = $derived(data.items)
</script>

<div class="max-w-[62.5rem] mx-auto">
  <div class="flex items-center justify-between gap-4 py-4 mb-6 border-b border-pm-border">
    <h1 class="text-2xl font-bold text-pm-text">Features</h1>
    <span class="text-sm text-pm-text-muted">{items.length} total</span>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    {#each items as item (item.id)}
      <div class="bg-pm-bg-elevated border border-pm-border rounded-xl p-5">
        <div class="flex items-start justify-between gap-3 mb-2">
          <h3 class="font-semibold text-pm-text">{item.slug}</h3>
          <span class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full"
            class:bg-pm-success-bg:text-pm-success={item.published} class:bg-pm-bg-sunken:text-pm-text-muted={!item.published}>
            {item.published ? 'Active' : 'Draft'}
          </span>
        </div>
        <p class="text-xs text-pm-text-muted">Order: {item.order}</p>
      </div>
    {:else}
      <p class="text-center text-pm-text-muted py-16 col-span-full">No features found.</p>
    {/each}
  </div>
</div>
