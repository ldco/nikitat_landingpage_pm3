<script lang="ts">
  import type { PageData } from './$types'
  let { data }: { data: PageData } = $props()
  const items = $derived(data.items)
</script>

<div class="max-w-content mx-auto">
  <div class="flex items-center justify-between gap-4 py-4 mb-6 border-b border-pm-border">
    <h1 class="text-2xl font-bold text-pm-text">Translations</h1>
    <span class="text-sm text-pm-text-muted">{items.length} total</span>
  </div>

  <div class="bg-pm-bg-elevated border border-pm-border rounded-xl overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-pm-bg-sunken">
        <tr>
          <th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase">Key</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase">Locale</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase">Value</th>
          <th class="px-4 py-3 text-right text-xs font-medium text-pm-text-muted uppercase">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each items as item (item.id)}
          <tr class="border-b border-pm-border hover:bg-pm-bg-elevated transition-colors">
            <td class="px-4 py-3 font-mono text-xs text-pm-text">{item.key}</td>
            <td class="px-4 py-3"><span class="px-1.5 py-0.5 rounded text-xs font-mono bg-pm-bg-sunken text-pm-text-muted uppercase tracking-wider">{item.locale}</span></td>
            <td class="px-4 py-3 text-pm-text-muted max-w-[300px] truncate">{item.value}</td>
            <td class="px-4 py-3 text-right text-xs text-pm-text-muted">—</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if items.length === 0}
    <p class="text-center text-pm-text-muted py-8">No translations found.</p>
  {/if}
</div>
