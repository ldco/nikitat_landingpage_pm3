<script lang="ts">
  import type { PageData } from './$types'
  let { data }: { data: PageData } = $props()
  const items = $derived(data.items)
</script>

<div class="max-w-[62.5rem] mx-auto">
  <div class="flex items-center justify-between gap-4 py-4 mb-6 border-b border-pm-border">
    <h1 class="text-2xl font-bold text-pm-text">Team</h1>
    <span class="text-sm text-pm-text-muted">{items.length} total</span>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    {#each items as item (item.id)}
      <div class="bg-pm-bg-elevated border border-pm-border rounded-xl p-5 flex gap-4 items-start">
        <div class="size-12 rounded-full bg-pm-bg-sunken flex items-center justify-center text-lg font-bold text-pm-text-muted flex-shrink-0">
          {item.name.charAt(0)}
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-pm-text">{item.name}</h3>
          <p class="text-sm text-pm-text-muted mb-2">{item.position ?? '—'}</p>
          <div class="flex gap-2 text-xs text-pm-text-muted">
            <span>{item.slug}</span>
            <span class:bg-pm-success-bg:text-pm-success={item.published} class:bg-pm-bg-sunken:text-pm-text-muted={!item.published} class="px-1.5 py-0.5 rounded">
              {item.published ? 'Active' : 'Hidden'}
            </span>
          </div>
        </div>
      </div>
    {:else}
      <p class="text-center text-pm-text-muted py-16 col-span-full">No team members found.</p>
    {/each}
  </div>
</div>
