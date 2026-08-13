<script lang="ts">
  /**
   * Admin Users — PM v2 users.vue parity
   *
   * Orchestration shell: renders the users table, role badges, row actions
   * (unlock/edit/delete) and pagination. The add/edit modal (form state +
   * create/update form-action submission) lives in `UserFormModal`; delete and
   * unlock submit through SvelteKit form actions (?/delete, ?/unlock) with the
   * shared overlays.confirm confirmation flow.
   *
   * All mutations go through SvelteKit form actions (?/create, ?/update,
   * ?/delete, ?/unlock) with Zod + fail(400, { fieldErrors }) — the standard
   * admin form contract. Success redirects revalidate the list; errors stay
   * in $page.form and keep the modal open.
   *
   * Role badges: master=warning, admin=primary, editor=secondary (PM2
   * roleBadgeClass). Only master can manage master accounts.
   *
   * Self-edits (the current account's own row) are supported: the update
   * action allows non-privilege fields (email/name/password) for the actor's
   * own account while rejecting self-role changes — the modal locks the role
   * field for the self-edit case so the client and server contracts agree.
   * Deleting your own account stays blocked (disabled row action).
   */
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import { clsx } from 'clsx'
  import { t } from '$lib/stores/content.svelte'
  import { getOverlaysState } from '$lib/stores/overlays.svelte'
  import { confirmDeleteAction } from '$lib/utils/admin-confirm'
  import PageHeader from '$lib/components/atoms/PageHeader.svelte'
  import EmptyState from '$lib/components/atoms/EmptyState.svelte'
  import AdminCreateButton from '$lib/components/atoms/AdminCreateButton.svelte'
  import IconButton from '$lib/components/atoms/IconButton.svelte'
  import AdminRowActions from '$lib/components/atoms/AdminRowActions.svelte'
  import AdminDataTable, {
    type AdminTableColumn
  } from '$lib/components/admin/AdminDataTable.svelte'
  import Pagination from '$lib/components/molecules/Pagination.svelte'
  import UserFormModal from '$lib/components/admin/users/UserFormModal.svelte'
  import IconPencil from '@tabler/icons-svelte/icons/pencil'
  import IconTrash from '@tabler/icons-svelte/icons/trash'
  import IconLockOpen from '@tabler/icons-svelte/icons/lock-open'
  import type { PageData } from './$types'
  import type { AdminUser } from '$lib/admin-users'
  import { getAdminT } from '$lib/utils/admin-translations'

  let { data }: { data: PageData } = $props()
  const adminT = $derived(getAdminT($page.data))
  const items = $derived((data.items ?? []) as AdminUser[])
  const roles = $derived((data.roles ?? []) as Array<{ id: number; slug: string; name: string }>)
  const currentUser = $derived((data.user ?? null) as { id?: number; role?: string } | null)
  const isMaster = $derived(currentUser?.role === 'master')
  let currentPage = $state(data.pagination?.page ?? 1)
  const overlays = getOverlaysState()

  // ── Role badges (PM2 roleBadgeClass) ─────────────────────────────────────
  function roleBadgeClass(role: string): string {
    if (role === 'master') return 'bg-pm-warning-bg text-pm-warning'
    if (role === 'admin') return 'bg-pm-brand-subtle text-pm-brand'
    return 'bg-pm-bg-sunken text-pm-text-muted'
  }

  function roleLabel(role: string): string {
    return t(`admin.role.${role}`)
  }

  function formatDate(date: string | Date | null | undefined): string {
    if (!date) return ''
    // PM2 users.vue formatDate: locale-aware via the admin locale resolved
    // server-side by the admin layout load (never undefined on this page).
    return new Date(date).toLocaleDateString(data.locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    })
  }

  function isLocked(user: AdminUser): boolean {
    if (!user.lockedUntil) return false
    return new Date(user.lockedUntil).getTime() > Date.now()
  }

  const columns: AdminTableColumn[] = [
    { key: 'name', label: adminT['admin.name'] ?? t('admin.name') },
    { key: 'email', label: adminT['admin.email'] ?? t('admin.email') },
    { key: 'role', label: adminT['admin.roleColumn'] ?? t('admin.roleColumn') },
    { key: 'created', label: adminT['admin.created'] ?? t('admin.created') }
  ]

  // ── Modal orchestration ─────────────────────────────────────────────────
  let showModal = $state(false)
  let editingUser = $state<AdminUser | null>(null)

  function openCreateModal(): void {
    editingUser = null
    showModal = true
  }

  function openEditModal(user: AdminUser): void {
    editingUser = user
    showModal = true
  }

  function closeModal(): void {
    showModal = false
    editingUser = null
  }

  async function confirmThenSubmit(e: MouseEvent): Promise<void> {
    e.preventDefault()
    const button = e.currentTarget as HTMLButtonElement
    const confirmed = await confirmDeleteAction(
      overlays,
      adminT['admin.confirmDelete'] ?? t('admin.confirmDelete')
    )
    if (confirmed) button.form?.requestSubmit()
  }

  function canEdit(user: AdminUser): boolean {
    return !(user.role === 'master' && !isMaster)
  }
</script>

<div class="max-w-[var(--max-w-content)] mx-auto">
  <PageHeader title={adminT['admin.users'] ?? t('admin.users')}>
    {#snippet actions()}
      <AdminCreateButton
        onclick={openCreateModal}
        label={adminT['admin.addUser'] ?? t('admin.addUser')}
      />
    {/snippet}
  </PageHeader>

  <div class="mt-6">
    {#if items.length === 0}
      <EmptyState
        type="empty-box"
        size="compact"
        title={adminT['admin.noItems'] ?? t('admin.noItems')}
      />
    {:else}
      <AdminDataTable {columns} {items} emptyMessage={adminT['admin.noItems'] ?? t('admin.noItems')}>
        {#snippet cell(column, item)}
          {@const row = item as AdminUser}
          {#if column.key === 'name'}
            <span class="text-pm-text">{row.name ?? '—'}</span>
          {:else if column.key === 'email'}
            <span class="text-pm-text">{row.email}</span>
          {:else if column.key === 'role'}
            <span
              class={clsx(
                'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                roleBadgeClass(row.role)
              )}
            >
              {roleLabel(row.role)}
              {#if isLocked(row)}
                <span
                  class="ms-1 text-[var(--text-2xs)] uppercase"
                  title={adminT['admin.lockedAccount'] ?? t('admin.lockedAccount')}
                >
                  {adminT['admin.locked'] ?? t('admin.locked')}
                </span>
              {/if}
            </span>
          {:else}
            <span class="text-pm-text-muted text-sm">{formatDate(row.createdAt)}</span>
          {/if}
        {/snippet}
        {#snippet actions(item)}
          {@const row = item as AdminUser}
          <AdminRowActions>
            {#if isLocked(row) && canEdit(row)}
              <form method="POST" action="?/unlock" class="inline-flex">
                <input type="hidden" name="_csrf" value={$page.data.csrfToken} />
                <input type="hidden" name="id" value={row.id} />
                <IconButton
                  type="submit"
                  title={adminT['admin.unlock'] ?? t('admin.unlock')}
                  ariaLabel={adminT['admin.unlock'] ?? t('admin.unlock')}
                  class="hover:bg-pm-warning-bg hover:text-pm-warning"
                >
                  <IconLockOpen class="size-4" />
                </IconButton>
              </form>
            {/if}
            <IconButton
              title={t('common.edit')}
              ariaLabel={t('common.edit')}
              disabled={!canEdit(row)}
              onclick={() => openEditModal(row)}
              class="hover:text-pm-text"
            >
              <IconPencil class="size-4" />
            </IconButton>
            <form method="POST" action="?/delete" class="inline-flex">
              <input type="hidden" name="_csrf" value={$page.data.csrfToken} />
              <input type="hidden" name="id" value={row.id} />
              <IconButton
                type="submit"
                variant="danger"
                title={t('common.delete')}
                ariaLabel={t('common.delete')}
                disabled={!canEdit(row) || row.id === currentUser?.id}
                onclick={confirmThenSubmit}
                class="hover:bg-pm-danger/10"
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

  <!-- Add/Edit user modal (PM2 users.vue modal) — posts to the form action -->
  <UserFormModal
    open={showModal}
    editingUser={editingUser}
    selfEdit={editingUser?.id === currentUser?.id}
    {roles}
    onClose={closeModal}
  />
</div>
