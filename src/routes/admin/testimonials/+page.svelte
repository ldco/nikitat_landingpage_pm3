<script lang="ts">
  /**
   * Admin Testimonials — Manage testimonials
   */
  import type { PageData } from './$types'
  let { data }: { data: PageData } = $props()
  const items = $derived(data.items)
</script>

<div class="max-w-content mx-auto">
  <div class="flex items-center justify-between gap-4 py-4 mb-6 border-b border-pm-border">
    <h1 class="text-2xl font-bold text-pm-text">Testimonials</h1>
    <span class="text-sm text-pm-text-muted">{items.length} total</span>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    {#each items as item (item.id)}
      <div class="bg-pm-bg-elevated border border-pm-border rounded-xl p-5">
        <p class="text-sm text-pm-text-secondary italic mb-4 line-clamp-2">"{item.authorName}"</p>
        <div class="flex items-center justify-between text-xs text-pm-text-muted">
          <span>{item.authorCompany ?? '—'}</span>
          {#if item.rating}
            <span class="text-pm-warning">{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</span>
          {/if}
        </div>
      </div>
    {:else}
      <p class="text-center text-pm-text-muted py-16 col-span-full">No testimonials found.</p>
    {/each}
  </div>
</div>
