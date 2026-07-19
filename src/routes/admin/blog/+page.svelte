<script lang="ts">
  import type { PageData } from './$types'
  let { data }: { data: PageData } = $props()
  const items = $derived(data.items)
</script>

<div class="max-w-content mx-auto">
  <div class="flex items-center justify-between gap-4 py-4 mb-6 border-b border-pm-border">
    <h1 class="text-2xl font-bold text-pm-text">Blog</h1>
    <span class="text-sm text-pm-text-muted">{items.length} total</span>
  </div>

  <div class="flex flex-col gap-3">
    {#each items as item (item.id)}
      <div class="bg-pm-bg-elevated border border-pm-border rounded-xl p-5 flex gap-4 items-start">
        <div class="w-20 h-14 bg-pm-bg-sunken rounded-md flex-shrink-0"></div>
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-pm-text mb-1">{item.slug}</h3>
          <div class="flex flex-wrap gap-2 text-xs text-pm-text-muted">
            <span class:bg-pm-success-bg:text-pm-success={item.published} class:bg-pm-bg-sunken:text-pm-text-muted={!item.published} class="px-1.5 py-0.5 rounded">
              {item.published ? 'Published' : 'Draft'}
            </span>
            {#if item.publishedAt}
              <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
            {/if}
          </div>
        </div>
      </div>
    {:else}
      <p class="text-center text-pm-text-muted py-16">No posts found.</p>
    {/each}
  </div>
</div>
