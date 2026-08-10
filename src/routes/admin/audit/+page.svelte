<script lang="ts">
  /**
   * Admin Audit Logs — View log entries
   */
  import { page } from '$app/stores'
import { t } from '$lib/stores/content.svelte'
  import { getAdminT } from '$lib/utils/admin-translations'
  import type { PageData } from './$types'
  let { data }: { data: PageData } = $props()
  const items = $derived(data.items)
  const adminT = $derived(getAdminT($page.data))
</script>

<div class="max-w-[var(--max-w-content)] mx-auto">
  <div class="flex items-center justify-between gap-4 py-4 mb-6 border-b border-pm-border">
    <h1 class="text-2xl font-bold text-pm-text">{adminT['admin.auditLog'] || 'Audit Log'}</h1>
    <span class="text-sm text-pm-text-muted">{items.length} {adminT['admin.entries'] || 'entries'}</span>
  </div>

  <div class="bg-pm-bg-elevated border border-pm-border rounded-xl overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-pm-bg-sunken">
        <tr>
          <th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase">{adminT['admin.action'] || 'Action'}</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase">{adminT['admin.user'] || 'User'}</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase">{adminT['admin.date'] || 'Date'}</th>
        </tr>
      </thead>
      <tbody>
        {#each items as item (item.id)}
          <tr class="border-b border-pm-border">
            <td class="px-4 py-3 font-mono text-xs text-pm-text">{item.action}</td>
            <td class="px-4 py-3 text-pm-text-muted">{item.userId}</td>
            <td class="px-4 py-3 text-pm-text-muted text-xs">{item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if items.length === 0}
    <p class="text-center text-pm-text-muted py-8">{adminT['admin.noItems'] || t('common.noResults')}</p>
  {/if}
</div>
