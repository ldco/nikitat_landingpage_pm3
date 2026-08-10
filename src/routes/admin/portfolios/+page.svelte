<script lang="ts">
  /**
   * Admin Portfolios List — CRUD listing
   */
  import type { PageData } from './$types'
  import { page } from '$app/stores'
  import * as m from '$lib/i18n'
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
  import { getAdminT } from '$lib/utils/admin-translations'
  import { adminDelete } from '$lib/api/client'
  import IconPencil from '@tabler/icons-svelte/icons/pencil'
  import IconTrash from '@tabler/icons-svelte/icons/trash'
  import IconPlus from '@tabler/icons-svelte/icons/plus'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import { goto } from '$app/navigation'
  let { data }: { data: PageData } = $props()
  const items = $derived(data.items)
  const t = $derived(getAdminT($page.data))
  let deletePending = $state<number | null>(null)
  let deleteError = $state<string | null>(null)

  async function handleDelete(id: number, name: string) {
    const msg = t['admin.confirmDelete'] ?? m.common_areYouSure()
    if (!confirm(msg + ' "' + name + '"?')) return
    deletePending = id
    deleteError = null
    try {
      const result = await adminDelete('portfolios', id)
      if (!result.success) {
        deleteError = result.error?.message ?? m.common_error()
        return
      }
      goto(ADMIN_ROUTES.portfolios)
    } catch (e: unknown) {
      deleteError = m.common_error()
    } finally {
      deletePending = null
    }
  }
</script>

<div class="max-w-[var(--max-w-content)] mx-auto">
  <div class="flex items-center justify-between gap-4 py-4 mb-6 border-b border-pm-border">
    <h1 class="text-2xl font-bold text-pm-text">{t['admin.portfolios']}</h1>
    <div class="flex items-center gap-3">
      <CtaButton href={ADMIN_ROUTES.portfolioCreate} variant="primary" size="sm" class="rounded-lg gap-1.5">
        <IconPlus class="size-4" /> {m.common_create()}
      </CtaButton>
      <span class="text-sm text-pm-text-muted">{items.length} total</span>
    </div>
  </div>

  {#if deleteError}
    <div class="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
      {deleteError}
      <button onclick={() => deleteError = null} class="ml-2 underline hover:no-underline">{m.common_dismiss()}</button>
    </div>
  {/if}

  <div class="bg-pm-bg-elevated border border-pm-border rounded-xl overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-pm-bg-sunken">
        <tr>
          <th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase">{t['admin.name']}</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase">{t['admin.portfolioType']}</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-pm-text-muted uppercase">{t['admin.status']}</th>
          <th class="px-4 py-3 text-right text-xs font-medium text-pm-text-muted uppercase">{t['admin.actions']}</th>
        </tr>
      </thead>
      <tbody>
        {#each items as item (item.id)}
          <tr class="border-b border-pm-border hover:bg-pm-bg-elevated transition-colors">
            <td class="px-4 py-3 font-medium text-pm-text">{item.name}</td>
            <td class="px-4 py-3 text-pm-text-muted">{item.type}</td>
            <td class="px-4 py-3">
              <span class="px-1.5 py-0.5 rounded text-xs" class:bg-pm-success-bg:text-pm-success={item.published} class:bg-pm-bg-sunken:text-pm-text-muted={!item.published}>
                {item.published ? t['admin.published'] : t['admin.draft']}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1">
                <a href={ADMIN_ROUTES.portfolioEdit(item.id)} class="p-1.5 rounded hover:bg-pm-bg-sunken text-pm-text-muted hover:text-pm-brand transition-colors" title={m.common_edit()}>
                  <IconPencil class="size-4" />
                </a>
                <button onclick={() => handleDelete(item.id, item.name)} disabled={deletePending === item.id} class="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950 text-pm-text-muted hover:text-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed" title={m.common_delete()}>
                  <IconTrash class="size-4" />
                </button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if items.length === 0}
    <p class="text-center text-pm-text-muted py-8">{m.common_noResults()}</p>
  {/if}
</div>
