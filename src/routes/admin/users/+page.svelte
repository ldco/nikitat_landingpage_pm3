<script lang="ts">
  /**
   * Admin Users — Manage user accounts
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
    <h1 class="text-2xl font-bold text-pm-text">{t['admin.users'] || 'Users'}</h1>
    <span class="text-sm text-pm-text-muted">{items.length} {t['admin.total'] || 'total'}</span>
  </div>

  <div class="bg-pm-bg-elevated border border-pm-border rounded-xl overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-pm-bg-sunken">
        <tr>
          <th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">{t['admin.id'] || 'ID'}</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">{t['admin.email'] || m.common_email()}</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">{t['admin.name'] || m.common_name()}</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">{t['admin.role'] || 'Role'}</th>
          <th class="px-4 py-3 text-right text-xs font-medium text-pm-text-muted uppercase tracking-wider">{t['admin.actions'] || 'Actions'}</th>
        </tr>
      </thead>
      <tbody>
        {#each items as item (item.id)}
          <tr class="border-b border-pm-border hover:bg-pm-bg-elevated transition-colors">
            <td class="px-4 py-3 text-pm-text-muted">{item.id}</td>
            <td class="px-4 py-3 text-pm-text">{item.email}</td>
            <td class="px-4 py-3 text-pm-text-muted">{item.name ?? '—'}</td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full"
                class:bg-pm-brand-subtle:text-pm-brand={item.role === 'master'}>
                {item.role}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <span class="text-xs text-pm-text-muted">—</span>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if items.length === 0}
    <p class="text-center text-pm-text-muted py-8">{t['admin.noItems'] || m.common_noResults()}</p>
  {/if}
</div>
