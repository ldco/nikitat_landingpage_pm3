<script lang="ts">
  import type { PageData } from './$types'
  let { data }: { data: PageData } = $props()
  const items = $derived(data.items)
</script>

<div class="max-w-[62.5rem] mx-auto">
  <div class="flex items-center justify-between gap-4 py-4 mb-6 border-b border-pm-border">
    <h1 class="text-2xl font-bold text-pm-text">Users</h1>
    <span class="text-sm text-pm-text-muted">{items.length} total</span>
  </div>

  <div class="bg-pm-bg-elevated border border-pm-border rounded-xl overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-pm-bg-sunken">
        <tr>
          <th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">ID</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">Email</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">Name</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">Role</th>
          <th class="px-4 py-3 text-right text-xs font-medium text-pm-text-muted uppercase tracking-wider">Actions</th>
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
    <p class="text-center text-pm-text-muted py-8">No users found.</p>
  {/if}
</div>
