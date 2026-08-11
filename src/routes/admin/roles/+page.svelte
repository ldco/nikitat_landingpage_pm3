<script lang="ts">
  /**
   * Admin Roles — Manage RBAC roles with CRUD and permissions editing
   */
  import { page } from '$app/stores'
  import { t } from '$lib/stores/content.svelte'
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
  import { getAdminT } from '$lib/utils/admin-translations'
  import PageHeader from '$lib/components/atoms/PageHeader.svelte'
  import EmptyState from '$lib/components/atoms/EmptyState.svelte'
  import Badge from '$lib/components/atoms/Badge.svelte'
  import AdminDataTable, { type AdminTableColumn } from '$lib/components/admin/AdminDataTable.svelte'
  import AdminModal from '$lib/components/molecules/AdminModal.svelte'
  import FormField from '$lib/components/atoms/FormField.svelte'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import IconPencil from '@tabler/icons-svelte/icons/pencil'
  import IconTrash from '@tabler/icons-svelte/icons/trash'
  import IconPlus from '@tabler/icons-svelte/icons/plus'
  import { goto } from '$app/navigation'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
  const items = $derived(data.items)
  const pages = $derived(data.pages)
  const adminT = $derived(getAdminT($page.data))

  const COLOR_OPTIONS = [
    { value: 'primary', key: 'admin.colorPrimary' },
    { value: 'secondary', key: 'admin.colorSecondary' },
    { value: 'success', key: 'admin.colorSuccess' },
    { value: 'warning', key: 'admin.colorWarning' },
    { value: 'danger', key: 'admin.colorDanger' }
  ]

  let showModal = $state(false)
  let saving = $state(false)
  let deletePending = $state<number | null>(null)
  let deleteError = $state<string | null>(null)

  type EditingRole = {
    id: number
    name: string
    slug: string
    description: string | null
    level: number
    color: string
    permissions: string
    isBuiltIn: boolean
  } | null
  let editingRole = $state<EditingRole>(null)
  let form = $state({ name: '', slug: '', description: '', level: '0', color: 'secondary' })
  let permissions = $state<Record<string, boolean>>({})

  const permissionsJson = $derived(JSON.stringify(permissions))

  function loadPermissions(json: string) {
    try {
      permissions = JSON.parse(json) as Record<string, boolean>
    } catch {
      permissions = {}
    }
  }

  function togglePermission(pageId: string) {
    permissions = { ...permissions, [pageId]: !permissions[pageId] }
  }

  function openCreate() {
    editingRole = null
    form = { name: '', slug: '', description: '', level: '0', color: 'secondary' }
    permissions = {}
    showModal = true
  }

  function openEdit(role: EditingRole & {}) {
    if (!role) return
    editingRole = role
    form = {
      name: role.name,
      slug: role.slug,
      description: role.description ?? '',
      level: String(role.level),
      color: role.color
    }
    loadPermissions(role.permissions)
    showModal = true
  }

  function closeModal() {
    showModal = false
    editingRole = null
  }

  async function handleSubmit() {
    saving = true
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        description: form.description || undefined,
        level: Number(form.level),
        color: form.color,
        permissions: permissionsJson
      }

      if (!editingRole) {
        body.slug = form.slug
      }

      const url = editingRole
        ? '/api/admin/roles/' + editingRole.id
        : '/api/admin/roles'
      const method = editingRole ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': $page.data.csrfToken
        },
        body: JSON.stringify(body)
      })

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.message ?? String(res.status))
      }

      closeModal()
      goto(ADMIN_ROUTES.roles)
    } catch (e: unknown) {
      console.error('[admin] role save failed:', e instanceof Error ? e.message : e)
    } finally {
      saving = false
    }
  }

  async function handleDelete(id: number, name: string) {
    const msg = adminT['admin.confirmDeleteRole'] ?? adminT['admin.confirmDelete'] ?? t('common.areYouSure')
    if (!confirm(msg + ' "' + name + '"?')) return
    deletePending = id
    deleteError = null
    try {
      const res = await fetch('/api/admin/roles/' + id, {
        method: 'DELETE',
        headers: { 'x-csrf-token': $page.data.csrfToken }
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.message ?? String(res.status))
      }
      goto(ADMIN_ROUTES.roles)
    } catch (e: unknown) {
      console.error('[admin] role delete failed:', e instanceof Error ? e.message : e)
      deleteError = t('common.error')
    } finally {
      deletePending = null
    }
  }

  const columns = $derived<AdminTableColumn[]>([
    { key: 'name', label: adminT['admin.name'] ?? t('common.name') },
    { key: 'slug', label: adminT['admin.slug'] ?? t('admin.slug') },
    { key: 'level', label: adminT['admin.level'] ?? t('admin.level') },
    { key: 'color', label: adminT['admin.color'] ?? t('admin.color') }
  ])
</script>

<div class="max-w-[var(--max-w-content)] mx-auto">
  <PageHeader title={adminT['admin.roles'] ?? t('admin.roles')} itemCount={items.length}>
    {#snippet actions()}
      <CtaButton variant="primary" size="sm" onclick={openCreate}>
        <IconPlus class="size-4" /> {t('common.create')}
      </CtaButton>
    {/snippet}
  </PageHeader>

  {#if deleteError}
    <div class="mb-4 p-3 bg-pm-danger-bg border border-pm-danger rounded-[var(--radius-lg)] text-sm text-pm-danger">
      {deleteError}
      <button onclick={() => deleteError = null} class="ms-2 underline hover:no-underline">{t('common.dismiss')}</button>
    </div>
  {/if}

  <div class="mt-6">
    {#if items.length === 0}
      <EmptyState type="empty-box" size="compact" title={adminT['admin.noItems'] ?? t('common.noResults')} />
    {:else}
      <AdminDataTable {columns} items={items} emptyMessage={adminT['admin.noItems'] ?? t('common.noResults')}>
        {#snippet cell(column, item)}
          {@const row = item as { id: number; name: string; slug: string; level: number; color: string; isBuiltIn: boolean }}
          {#if column.key === 'name'}
            <span class="font-medium text-pm-text">{row.name}</span>
            {#if row.isBuiltIn}
              <Badge variant="warning" class="ml-2">{adminT['admin.builtInRole'] ?? t('admin.builtInRole')}</Badge>
            {/if}
          {:else if column.key === 'slug'}
            <span class="text-pm-text-muted">{row.slug}</span>
          {:else if column.key === 'level'}
            <span class="text-pm-text-muted">{row.level}</span>
          {:else}
            <Badge variant={row.color === 'danger' ? 'error' : row.color === 'success' ? 'success' : row.color === 'warning' ? 'warning' : 'primary'}>{row.color}</Badge>
          {/if}
        {/snippet}
        {#snippet actions(item)}
          {@const row = item as { id: number; name: string; slug: string; level: number; color: string; isBuiltIn: boolean; permissions: string; description: string | null }}
          <div class="flex items-center justify-end gap-1">
            <button onclick={() => openEdit(row)}
              class="p-1.5 rounded-md text-pm-text-muted hover:text-pm-brand hover:bg-pm-bg-sunken transition-colors"
              aria-label={t('common.edit')}>
              <IconPencil class="size-4" />
            </button>
            <button onclick={() => handleDelete(row.id, row.name)}
              disabled={deletePending === row.id || row.isBuiltIn}
              title={row.isBuiltIn ? (adminT['admin.cannotDeleteBuiltIn'] ?? t('admin.cannotDeleteBuiltIn')) : undefined}
              class="p-1.5 rounded-md text-pm-text-muted hover:text-pm-danger hover:bg-pm-bg-sunken transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label={t('common.delete')}>
              <IconTrash class="size-4" />
            </button>
          </div>
        {/snippet}
      </AdminDataTable>
    {/if}
  </div>
</div>

<AdminModal
  open={showModal}
  title={editingRole ? (adminT['admin.editRole'] ?? t('admin.editRole')) : (adminT['admin.addRole'] ?? t('admin.addRole'))}
  maxWidthClass="max-w-lg"
  cancelLabel={t('common.cancel')}
  submitLabel={t('common.save')}
  onclose={closeModal}
  onsubmit={handleSubmit}
  submitDisabled={saving}
  loading={saving}
>
  <div class="flex flex-col gap-4">
    <FormField name="name" label={adminT['admin.name'] ?? t('common.name')} bind:value={form.name} required />
    {#if !editingRole}
      <FormField name="slug" label={adminT['admin.slug'] ?? t('admin.slug')} bind:value={form.slug} required />
      <p class="text-xs text-pm-text-muted -mt-2">{adminT['admin.slugImmutable'] ?? t('admin.slugImmutable')}</p>
    {/if}
    <FormField name="description" label={adminT['admin.description'] ?? t('admin.description')} bind:value={form.description} />
    <FormField name="level" type="number" label={adminT['admin.level'] ?? t('admin.level')} bind:value={form.level} />

    <div class="flex flex-col gap-1.5">
      <label for="field-color" class="text-sm font-medium text-pm-text">{adminT['admin.color'] ?? t('admin.color')}</label>
      <select name="color" id="field-color" bind:value={form.color}
        class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text">
        {#each COLOR_OPTIONS as opt}
          <option value={opt.value}>{adminT[opt.key] ?? opt.value}</option>
        {/each}
      </select>
    </div>

    <fieldset>
      <legend class="text-sm font-medium text-pm-text mb-2">{adminT['admin.permissions'] ?? t('admin.permissions')}</legend>
      <div class="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border border-pm-border rounded-md p-3">
        {#each pages as page}
          <label class="flex items-center gap-2 text-sm text-pm-text cursor-pointer">
            <input type="checkbox"
              checked={permissions[page.id] === true}
              onchange={() => togglePermission(page.id)}
              class="size-4 rounded border-pm-border text-pm-brand focus:ring-pm-brand" />
            {adminT['admin.' + page.id] ?? page.id}
          </label>
        {/each}
      </div>
    </fieldset>
  </div>
</AdminModal>
