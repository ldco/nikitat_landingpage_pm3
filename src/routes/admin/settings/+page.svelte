<script lang="ts">
  import type { PageData } from './$types'
  let { data }: { data: PageData } = $props()
  const items = $derived(data.items)
</script>

<h1 class="text-2xl font-bold text-pm-text mb-6">Settings</h1>

<div class="bg-pm-bg-elevated border border-pm-border rounded-xl overflow-hidden">
  <table class="w-full">
    <thead class="bg-pm-bg-sunken">
      <tr>
        <th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">ID</th><th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">Key</th><th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">Value</th><th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">Group</th>
      </tr>
    </thead>
    <tbody>
      {#each items as item}
        <tr class="border-b border-pm-border">
          <td class="px-4 py-3 text-sm text-pm-text-muted">item.id</td><td class="px-4 py-3 text-sm text-pm-text-muted">item.key</td><td class="px-4 py-3 text-sm text-pm-text-muted">item.value ?? ""</td><td class="px-4 py-3 text-sm text-pm-text-muted">item.group ?? ""</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

{#if items.length === 0}<p class="text-center text-pm-text-muted py-8">No settings found.</p>{/if}
