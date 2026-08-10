<script lang="ts">
  /**
   * Admin Users — Manage user accounts + role assignment
   *
   * Each row exposes a role <select> backed by the roles table (built-in +
   * custom). Selecting a role PUTs `roleId` to /api/admin/users/:id so the
   * stored role relationship drives both the RBAC gates and the menu.
   */
  import { page } from '$app/stores'
import { t } from '$lib/stores/content.svelte'
  import { getCsrfToken } from '$lib/utils/auth'
  import { getAdminT } from '$lib/utils/admin-translations'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
  const items = $derived(data.items)
  const roles = $derived(data.roles)
  const adminT = $derived(getAdminT($page.data))

  let saving = $state<number | null>(null)
  let feedback = $state<string | null>(null)

  /** Effective role slug for a user row (roleId-linked slug wins). */
  function roleLabel(item: { roleId?: number | null; role: string }): string {
    return roles.find(r => r.id === item.roleId)?.slug ?? item.role
  }

  async function assignRole(userId: number, roleId: number | null) {
    saving = userId
    feedback = null
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json', 'x-csrf-token': getCsrfToken() },
        body: JSON.stringify({ roleId })
      })
      const body = await res.json().catch(() => null)
      if (!res.ok || body?.success === false) {
        feedback = body?.error?.message ?? 'Failed to update role'
        return
      }
      // Reflect the server's normalized response (effective role slug) without
      // a full reload — the payload is the same shape as the list rows.
      const item = items.find(i => i.id === userId)
      if (item && body?.data) Object.assign(item, body.data)
    } catch (e) {
      feedback = e instanceof Error ? e.message : 'Failed to update role'
    } finally {
      saving = null
    }
  }
</script>

<div class="max-w-[var(--max-w-content)] mx-auto">
  <div class="flex items-center justify-between gap-4 py-4 mb-6 border-b border-pm-border">
    <h1 class="text-2xl font-bold text-pm-text">{adminT['admin.users'] || 'Users'}</h1>
    <span class="text-sm text-pm-text-muted">{items.length} {adminT['admin.total'] || 'total'}</span>
  </div>

  {#if feedback}
    <div class="mb-4 p-3 rounded-md bg-pm-danger-bg text-pm-danger text-sm">{feedback}</div>
  {/if}

  <div class="bg-pm-bg-elevated border border-pm-border rounded-xl overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-pm-bg-sunken">
        <tr>
          <th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">{adminT['admin.id'] || 'ID'}</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">{adminT['admin.email'] || t('common.email')}</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">{adminT['admin.name'] || t('common.name')}</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase tracking-wider">{adminT['admin.role'] || 'Role'}</th>
        </tr>
      </thead>
      <tbody>
        {#each items as item (item.id)}
          <tr class="border-b border-pm-border hover:bg-pm-bg-elevated transition-colors">
            <td class="px-4 py-3 text-pm-text-muted">{item.id}</td>
            <td class="px-4 py-3 text-pm-text">{item.email}</td>
            <td class="px-4 py-3 text-pm-text-muted">{item.name ?? '—'}</td>
            <td class="px-4 py-3">
              <select
                value={item.roleId ?? ''}
                disabled={saving === item.id}
                class="bg-pm-bg-elevated border border-pm-border rounded-md px-2 py-1 text-sm text-pm-text focus:outline-none focus:ring-2 focus:ring-pm-focus-ring"
                aria-label={adminT['admin.role'] || 'Role'}
                onchange={(e) => {
                  const val = (e.currentTarget as HTMLSelectElement).value
                  void assignRole(item.id, val === '' ? null : Number(val))
                }}
              >
                <option value="">{item.role}</option>
                {#each roles as role}
                  <option value={role.id}>{role.slug}</option>
                {/each}
              </select>
              <span class="ms-2 text-xs text-pm-text-muted">{roleLabel(item)}</span>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if items.length === 0}
    <p class="text-center text-pm-text-muted py-8">{adminT['admin.noItems'] || t('common.noResults')}</p>
  {/if}
</div>
