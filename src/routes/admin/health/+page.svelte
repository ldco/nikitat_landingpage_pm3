<script lang="ts">
  /**
   * Admin Health Dashboard — System metrics
   */
  import { page } from '$app/stores'
  import { getAdminT } from '$lib/utils/admin-translations'
  import type { PageData } from './$types'
  let { data }: { data: PageData } = $props()
  const items = $derived(data.items)
  const t = $derived(getAdminT($page.data))
</script>

<div class="max-w-[var(--max-w-content)] mx-auto">
  <div class="flex items-center justify-between gap-4 py-4 mb-6 border-b border-pm-border">
    <h1 class="text-2xl font-bold text-pm-text">{t['admin.health'] || 'Health'}</h1>
  </div>

  <div class="bg-pm-bg-elevated border border-pm-border rounded-xl overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-pm-bg-sunken">
        <tr>
          <th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase">{t['admin.check'] || 'Check'}</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase">{t['admin.status'] || 'Status'}</th>
        </tr>
      </thead>
      <tbody>
        {#each items as [label, status]}
          <tr class="border-b border-pm-border">
            <td class="px-4 py-3 font-medium text-pm-text">{label}</td>
            <td class="px-4 py-3">
              <span class="px-1.5 py-0.5 rounded text-xs" class:bg-pm-success-bg:text-pm-success={status === 'OK'} class:bg-pm-danger-bg:text-pm-danger={status !== 'OK'}>
                {status}
              </span>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
