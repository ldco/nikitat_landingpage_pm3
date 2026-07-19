<script lang="ts">
  import type { PageData } from './$types'
  let { data }: { data: PageData } = $props()
  const items = $derived(data.items)
</script>

<h1 class="text-2xl font-bold text-pm-text mb-6">Contacts</h1>

<div class="bg-pm-bg-elevated border border-pm-border rounded-xl overflow-hidden">
  <table class="w-full">
    <thead class="bg-pm-bg-sunken">
      <tr>
        <th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">ID</th><th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">Name</th><th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">Email</th><th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">Date</th>
      </tr>
    </thead>
    <tbody>
      {#each items as item}
        <tr class="border-b border-pm-border">
          <td class="px-4 py-3 text-sm text-pm-text-muted">{item.id}</td><td class="px-4 py-3 text-sm text-pm-text-muted">{item.name}</td><td class="px-4 py-3 text-sm text-pm-text-muted">{item.email}</td><td class="px-4 py-3 text-sm text-pm-text-muted">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

{#if items.length === 0}<p class="text-center text-pm-text-muted py-8">No contacts found.</p>{/if}
