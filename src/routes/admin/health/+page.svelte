<script lang="ts">
  import type { PageData } from './$types'
  let { data }: { data: PageData } = $props()
  const items = $derived(data.items)
</script>

<h1 class="text-2xl font-bold text-pm-text mb-6">Health</h1>

<div class="bg-pm-bg-elevated border border-pm-border rounded-xl overflow-hidden">
  <table class="w-full">
    <thead class="bg-pm-bg-sunken">
      <tr>
        <th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">Metric</th><th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">Value</th>
      </tr>
    </thead>
    <tbody>
      {#each items as [key, value]}
        <tr class="border-b border-pm-border">
          <td class="px-4 py-3 text-sm font-medium text-pm-text">{key}</td>
          <td class="px-4 py-3 text-sm text-pm-text-muted">{value}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>


