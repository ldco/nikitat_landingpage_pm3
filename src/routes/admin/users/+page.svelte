<script lang="ts">
  /**
   * Admin Users — PM v2 users.vue parity
   *
   * Structure (exact PM2 DOM):
   *   page-header (title + Add User button in page-actions)
   *   card → data-table.users-table
   *     name | email | role badge | created | actions (edit/unlock/delete)
   *   modal (add/edit user: email, password, name, role select)
   *
   * All mutations go through SvelteKit form actions (?/create, ?/update,
   * ?/delete, ?/unlock) with Zod + fail(400, { fieldErrors }) — the standard
   * admin form contract. Success redirects revalidate the list; errors stay
   * in $page.form and keep the modal open.
   *
   * Role badges: master=warning, admin=primary, editor=secondary (PM2
   * roleBadgeClass). Only master can manage master accounts.
   */
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import { clsx } from 'clsx'
  import { t } from '$lib/stores/content.svelte'
  import { getOverlaysState } from '$lib/stores/overlays.svelte'
  import PageHeader from '$lib/components/atoms/PageHeader.svelte'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import AdminModal from '$lib/components/molecules/AdminModal.svelte'
  import AdminDataTable, {
    type AdminTableColumn
  } from '$lib/components/admin/AdminDataTable.svelte'
  import Pagination from '$lib/components/molecules/Pagination.svelte'
  import IconPlus from '@tabler/icons-svelte/icons/plus'
  import IconEdit from '@tabler/icons-svelte/icons/edit'
  import IconTrash from '@tabler/icons-svelte/icons/trash'
  import IconLockOpen from '@tabler/icons-svelte/icons/lock-open'
  import type { PageData } from './$types'

  interface AdminUser {
    id: number
    email: string
    name?: string | null
    role: string
    lockedUntil?: string | Date | null
    createdAt?: string | Date | null
  }

  let { data }: { data: PageData } = $props()
  const items = $derived((data.items ?? []) as AdminUser[])
  const roles = $derived((data.roles ?? []) as Array<{ id: number; slug: string }>)
  const currentUser = $derived((data.user ?? null) as { id?: number; role?: string } | null)
  const isMaster = $derived(currentUser?.role === 'master')
  let currentPage = $state(data.pagination?.page ?? 1)
  const overlays = getOverlaysState()

  const form = $derived($page.form)
  const errors = $derived(
    (form as { fieldErrors?: Record<string, string[]> } | null)?.fieldErrors ?? {}
  )

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
    // PM2 users.vue formatDate: locale-aware via the active admin locale
    return new Date(date).toLocaleDateString(data.locale ?? 'ru', {
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
    { key: 'name', label: t('admin.name') },
    { key: 'email', label: t('admin.email') },
    { key: 'role', label: t('admin.roleColumn') },
    { key: 'created', label: t('admin.created') }
  ]

  // ── Modal state (PM2 users.vue) ─────────────────────────────────────────
  let showModal = $state(false)
  let editingUser = $state<AdminUser | null>(null)
  let formEmail = $state('')
  let formPassword = $state('')
  let formName = $state('')
  let formRole = $state('editor')

  function openCreateModal(): void {
    editingUser = null
    formEmail = ''
    formPassword = ''
    formName = ''
    formRole = 'editor'
    showModal = true
  }

  function openEditModal(user: AdminUser): void {
    editingUser = user
    formEmail = user.email
    formPassword = ''
    formName = user.name ?? ''
    formRole = user.role
    showModal = true
  }

  function closeModal(): void {
    showModal = false
    editingUser = null
  }

  async function confirmThenSubmit(e: MouseEvent): Promise<void> {
    e.preventDefault()
    const button = e.currentTarget as HTMLButtonElement
    const confirmed = await overlays.confirm({
      title: t('common.delete'),
      message: t('admin.confirmDelete'),
      confirmText: t('common.delete'),
      variant: 'danger'
    })
    if (confirmed) button.form?.requestSubmit()
  }

  function canEdit(user: AdminUser): boolean {
    return !(user.role === 'master' && !isMaster)
  }
</script>

<div class="admin-users">
  <PageHeader title={t('admin.users')}>
    {#snippet actions()}
      <CtaButton variant="primary" size="lg" onclick={openCreateModal}>
        <IconPlus class="size-5" />
        {t('admin.addUser')}
      </CtaButton>
    {/snippet}
  </PageHeader>

  <div class="bg-pm-bg-elevated border border-pm-border rounded-xl overflow-hidden">
    {#if items.length === 0}
      <p class="py-16 text-center text-pm-text-muted">{t('admin.noItems')}</p>
    {:else}
      <AdminDataTable {columns} {items} emptyMessage={t('admin.noItems')}>
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
                  title={t('admin.lockedAccount')}
                >
                  {t('admin.locked')}
                </span>
              {/if}
            </span>
          {:else}
            <span class="text-pm-text-muted text-sm">{formatDate(row.createdAt)}</span>
          {/if}
        {/snippet}
        {#snippet actions(item)}
          {@const row = item as AdminUser}
          <div class="inline-flex items-center gap-2">
            {#if isLocked(row) && canEdit(row)}
              <form method="POST" action="?/unlock" class="inline-flex">
                <input type="hidden" name="_csrf" value={$page.data.csrfToken} />
                <input type="hidden" name="id" value={row.id} />
                <button
                  type="submit"
                  class="inline-flex items-center justify-center size-9 rounded-md text-pm-text-muted hover:bg-pm-warning-bg hover:text-pm-warning transition-colors"
                  title={t('admin.unlock')}
                >
                  <IconLockOpen class="size-4" />
                </button>
              </form>
            {/if}
            <button
              type="button"
              class="inline-flex items-center justify-center size-9 rounded-md text-pm-text-muted hover:bg-pm-bg-sunken hover:text-pm-text transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title={t('common.edit')}
              disabled={!canEdit(row)}
              onclick={() => openEditModal(row)}
            >
              <IconEdit class="size-4" />
            </button>
            <form method="POST" action="?/delete" class="inline-flex">
              <input type="hidden" name="_csrf" value={$page.data.csrfToken} />
              <input type="hidden" name="id" value={row.id} />
              <button
                type="submit"
                class="inline-flex items-center justify-center size-9 rounded-md text-pm-text-muted hover:bg-pm-danger/10 hover:text-pm-danger transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title={t('common.delete')}
                disabled={!canEdit(row) || row.id === currentUser?.id}
                onclick={confirmThenSubmit}
              >
                <IconTrash class="size-4" />
              </button>
            </form>
          </div>
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
  <AdminModal
    open={showModal}
    title={editingUser ? t('admin.editUser') : t('admin.addUser')}
    formAction={editingUser ? '?/update' : '?/create'}
    cancelLabel={t('common.cancel')}
    submitLabel={t('common.save')}
    submitDisabled={!formEmail.trim() || (editingUser === null && !formPassword)}
    onclose={closeModal}
  >
    <input type="hidden" name="_csrf" value={$page.data.csrfToken} />
    {#if editingUser}
      <input type="hidden" name="id" value={editingUser.id} />
    {/if}

    <div class="flex flex-col gap-1.5">
      <label for="user-email" class="text-sm font-medium text-pm-text">{t('admin.email')} *</label>
      <input
        id="user-email"
        name="email"
        bind:value={formEmail}
        type="email"
        required
        class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring"
      />
      {#if errors.email?.[0]}<p class="text-xs text-pm-danger">{t(errors.email[0])}</p>{/if}
    </div>

    <div class="flex flex-col gap-1.5">
      <label for="user-password" class="text-sm font-medium text-pm-text">
        {t('admin.password')}{editingUser ? '' : ' *'}
      </label>
      <input
        id="user-password"
        name="password"
        bind:value={formPassword}
        type="password"
        required={!editingUser}
        placeholder={editingUser ? t('admin.leaveBlankToKeep') : ''}
        autocomplete="new-password"
        class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring"
      />
      {#if errors.password?.[0]}<p class="text-xs text-pm-danger">{t(errors.password[0])}</p>{/if}
    </div>

    <div class="flex flex-col gap-1.5">
      <label for="user-name" class="text-sm font-medium text-pm-text">{t('admin.name')}</label>
      <input
        id="user-name"
        name="name"
        bind:value={formName}
        type="text"
        class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring"
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <label for="user-role" class="text-sm font-medium text-pm-text">
        {t('admin.roleColumn')} *
      </label>
      <select
        id="user-role"
        name="role"
        bind:value={formRole}
        required
        class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring"
      >
        {#each roles as role}
          <option value={role.slug}>{roleLabel(role.slug)}</option>
        {/each}
      </select>
      {#if errors.role?.[0]}<p class="text-xs text-pm-danger">{t(errors.role[0])}</p>{/if}
    </div>
  </AdminModal>
</div>
