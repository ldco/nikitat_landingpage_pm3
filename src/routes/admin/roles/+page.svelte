<script lang="ts">
  /**
   * Admin Roles — Manage RBAC roles with CRUD and permissions editing
   *
   * Orchestration shell: renders the roles table (with built-in badges and
   * row actions) and pagination. The role editor modal (fields + permissions
   * matrix) lives in `RoleEditorModal`; the permissions checkbox grid in
   * `PermissionsMatrix`. Delete uses the shared overlays.confirm flow.
   *
   * All mutations go through SvelteKit form actions (?/create, ?/update,
   * ?/delete) with Zod + fail(400, { fieldErrors }) — the standard admin form
   * contract. Permissions are submitted as `perm_<pageId>` checkboxes and
   * rebuilt server-side; success redirects revalidate the list.
   */
  import { page } from '$app/stores'
  import { t } from '$lib/stores/content.svelte'
  import { getOverlaysState } from '$lib/stores/overlays.svelte'
  import { confirmDeleteAction } from '$lib/utils/admin-confirm'
  import { getAdminT } from '$lib/utils/admin-translations'
  import PageHeader from '$lib/components/atoms/PageHeader.svelte'
  import EmptyState from '$lib/components/atoms/EmptyState.svelte'
  import Badge from '$lib/components/atoms/Badge.svelte'
  import AdminDataTable, {
    type AdminTableColumn
  } from '$lib/components/admin/AdminDataTable.svelte'
  import AdminCreateButton from '$lib/components/atoms/AdminCreateButton.svelte'
  import IconButton from '$lib/components/atoms/IconButton.svelte'
  import AdminRowActions from '$lib/components/atoms/AdminRowActions.svelte'
  import Pagination from '$lib/components/molecules/Pagination.svelte'
  import RoleEditorModal, {
    type EditingRole
  } from '$lib/components/admin/roles/RoleEditorModal.svelte'
  import IconPencil from '@tabler/icons-svelte/icons/pencil'
  import IconTrash from '@tabler/icons-svelte/icons/trash'
  import { goto } from '$app/navigation'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
  const items = $derived(data.items)
  const pages = $derived(data.pages)
  const adminT = $derived(getAdminT($page.data))
  const overlays = getOverlaysState()

  let showModal = $state(false)
  let currentPage = $state(1)
  $effect.pre(() => {
    currentPage = data.pagination?.page ?? 1
  })
  let editingRole = $state<EditingRole | null>(null)

  function openCreate() {
    editingRole = null
    showModal = true
  }

  function openEdit(role: EditingRole & {}) {
    if (!role) return
    editingRole = role
    showModal = true
  }

  function closeModal() {
    showModal = false
    editingRole = null
  }

  async function confirmDelete(e: MouseEvent, name: string): Promise<void> {
    e.preventDefault()
    const button = e.currentTarget as HTMLButtonElement
    const msg =
      adminT['admin.confirmDeleteRole'] ?? adminT['admin.confirmDelete'] ?? t('common.areYouSure')
    const confirmed = await confirmDeleteAction(overlays, `${msg} "${name}"?`)
    if (confirmed) button.form?.requestSubmit()
  }

  const columns = $derived<AdminTableColumn[]>([
    { key: 'name', label: adminT['admin.name'] ?? t('common.name') },
    { key: 'slug', label: adminT['admin.slug'] ?? t('admin.slug') },
    { key: 'level', label: adminT['admin.level'] ?? t('admin.level') },
    { key: 'color', label: adminT['admin.color'] ?? t('admin.color') }
  ])
</script>

<div class="max-w-[var(--max-w-content)] mx-auto">
  <PageHeader title={adminT['admin.roles'] ?? t('admin.roles')}>
    {#snippet actions()}
      <AdminCreateButton onclick={openCreate} />
    {/snippet}
  </PageHeader>

  <div class="mt-6">
    {#if items.length === 0}
      <EmptyState
        type="empty-box"
        size="compact"
        title={adminT['admin.noItems'] ?? t('common.noResults')}
      />
    {:else}
      <AdminDataTable
        {columns}
        {items}
        emptyMessage={adminT['admin.noItems'] ?? t('common.noResults')}
      >
        {#snippet cell(column, item)}
          {@const row = item as {
            id: number
            name: string
            slug: string
            level: number
            color: string
            isBuiltIn: boolean
          }}
          {#if column.key === 'name'}
            <span class="font-medium text-pm-text">{row.name}</span>
            {#if row.isBuiltIn}
              <Badge variant="warning" class="ml-2">
                {adminT['admin.builtInRole'] ?? t('admin.builtInRole')}
              </Badge>
            {/if}
          {:else if column.key === 'slug'}
            <span class="text-pm-text-muted">{row.slug}</span>
          {:else if column.key === 'level'}
            <span class="text-pm-text-muted">{row.level}</span>
          {:else}
            <Badge
              variant={row.color === 'danger'
                ? 'error'
                : row.color === 'success'
                  ? 'success'
                  : row.color === 'warning'
                    ? 'warning'
                    : 'primary'}
            >
              {row.color}
            </Badge>
          {/if}
        {/snippet}
        {#snippet actions(item)}
          {@const row = item as {
            id: number
            name: string
            slug: string
            level: number
            color: string
            isBuiltIn: boolean
            permissions: string
            description: string | null
          }}
          <AdminRowActions>
            <IconButton
              title={t('common.edit')}
              ariaLabel={t('common.edit')}
              onclick={() => openEdit(row)}
            >
              <IconPencil class="size-4" />
            </IconButton>
            <form method="POST" action="?/delete" class="inline-flex">
              <input type="hidden" name="_csrf" value={$page.data.csrfToken} />
              <input type="hidden" name="id" value={row.id} />
              <IconButton
                type="submit"
                variant="danger"
                disabled={row.isBuiltIn}
                title={row.isBuiltIn
                  ? (adminT['admin.cannotDeleteBuiltIn'] ?? t('admin.cannotDeleteBuiltIn'))
                  : undefined}
                ariaLabel={t('common.delete')}
                onclick={e => confirmDelete(e, row.name)}
              >
                <IconTrash class="size-4" />
              </IconButton>
            </form>
          </AdminRowActions>
        {/snippet}
      </AdminDataTable>
    {/if}
  </div>

  {#if data.pagination && data.pagination.totalPages > 1}
    <div class="mt-6">
      <Pagination
        bind:page={currentPage}
        totalPages={data.pagination.totalPages}
        onPageChange={p => goto('?page=' + p)}
      />
    </div>
  {/if}
</div>

<RoleEditorModal open={showModal} editingRole={editingRole} {pages} onClose={closeModal} />
