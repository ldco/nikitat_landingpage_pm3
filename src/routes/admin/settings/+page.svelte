<script lang="ts">
  /**
   * Admin Settings — Edit site settings
   */
  import { page } from '$app/stores'
  import * as m from '$lib/i18n'
  import { getAdminT } from '$lib/utils/admin-translations'
  import type { PageData } from './$types'
  let { data }: { data: PageData } = $props()
  const items = $derived(data.items)
  const t = $derived(getAdminT($page.data))
</script>

<div class="max-w-content mx-auto">
  <div class="flex items-center justify-between gap-4 py-4 mb-6 border-b border-pm-border">
    <h1 class="text-2xl font-bold text-pm-text">{t['admin.settings'] || 'Settings'}</h1>
    <span class="text-sm text-pm-text-muted">{items.length} {t['admin.total'] || 'total'}</span>
  </div>

  <div class="bg-pm-bg-elevated border border-pm-border rounded-xl overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-pm-bg-sunken">
        <tr>
          <th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">{t['admin.key'] || 'Key'}</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">{t['admin.value'] || 'Value'}</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">{t['admin.group'] || 'Group'}</th>
          <th class="px-4 py-3 text-right text-xs font-medium text-pm-text-muted uppercase tracking-wider">{t['admin.actions'] || 'Actions'}</th>
        </tr>
      </thead>
      <tbody>
        {#each items as item (item.id)}
          <tr class="border-b border-pm-border hover:bg-pm-bg-elevated transition-colors">
            <td class="px-4 py-3 font-mono text-xs text-pm-text">{item.key}</td>
            <td class="px-4 py-3 text-pm-text-muted max-w-72 truncate">{item.value ?? '—'}</td>
            <td class="px-4 py-3 text-pm-text-muted">{item.group}</td>
            <td class="px-4 py-3 text-right"><span class="text-xs text-pm-text-muted">—</span></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if items.length === 0}
    <p class="text-center text-pm-text-muted py-8">{t['admin.noItems'] || m.common_noResults()}</p>
  {/if}
</div>
