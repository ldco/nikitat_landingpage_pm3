<script lang="ts">
  /**
   * Admin Pricing List — CRUD listing
   */
  import type { PageData } from './$types'
  import { page } from '$app/stores'
  import { getAdminT } from '$lib/utils/admin-translations'
  let { data }: { data: PageData } = $props()
  const items = $derived(data.items)
  const t = $derived(getAdminT($page.data))
</script>

<div class="max-w-[var(--max-w-content)] mx-auto">
  <div class="flex items-center justify-between gap-4 py-4 mb-6 border-b border-pm-border">
    <h1 class="text-2xl font-bold text-pm-text">{t['admin.pricing']}</h1>
    <span class="text-sm text-pm-text-muted">{items.length} {t['admin.total']}</span>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    {#each items as item (item.id)}
      <div class="bg-pm-bg-elevated border border-pm-border rounded-xl p-5">
        <h3 class="font-semibold text-pm-text mb-1">{item.name}</h3>
        <p class="text-2xl font-bold text-pm-brand mb-2">{item.price ?? t['admin.customPrice']}</p>
        <div class="flex gap-2 text-xs text-pm-text-muted">
          <span>{item.slug}</span>
          {#if item.featured}<span class="px-1.5 py-0.5 rounded bg-pm-brand-subtle text-pm-brand">{t['admin.featured'] || 'Featured'}</span>{/if}
        </div>
      </div>
    {:else}
      <p class="text-center text-pm-text-muted py-16 col-span-full">{t['admin.noItems']}</p>
    {/each}
  </div>
</div>
