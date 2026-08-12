<script lang="ts">
  /**
   * Admin Roles — Manage RBAC roles with CRUD and permissions editing
   *
   * All mutations go through SvelteKit form actions (?/create, ?/update,
   * ?/delete) with Zod + fail(400, { fieldErrors }) — the standard admin form
   * contract. Permissions are submitted as `perm_<pageId>` checkboxes and
   * rebuilt server-side; success redirects revalidate the list.
   */
  import { page } from '$app/stores'
  import { t } from '$lib/stores/content.svelte'
  import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
  import { getAdminT } from '$lib/utils/admin-translations'
  import PageHeader from '$lib/components/atoms/PageHeader.svelte'
  import EmptyState from '$lib/components/atoms/EmptyState.svelte'
  import Badge from '$lib/components/atoms/Badge.svelte'
  import AdminDataTable, {
    type AdminTableColumn
  } from '$lib/components/admin/AdminDataTable.svelte'
  import AdminModal from '$lib/components/molecules/AdminModal.svelte'
  import FormField from '$lib/components/atoms/FormField.svelte'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import Pagination from '$lib/components/molecules/Pagination.svelte'
  import IconPencil from '@tabler/icons-svelte/icons/pencil'
  import IconTrash from '@tabler/icons-svelte/icons/trash'
  import IconPlus from '@tabler/icons-svelte/icons/plus'
  import { goto } from '$app/navigation'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
  const items = $derived(data.items)
  const pages = $derived(data.pages)
  const adminT = $derived(getAdminT($page.data))

  const form = $derived($page.form)
  const errors = $derived(
    (form as { fieldErrors?: Record<string, string[]> } | null)?.fieldErrors ?? {}
  )

  const COLOR_OPTIONS = [
    { value: 'primary', key: 'admin.colorPrimary' },
    { value: 'secondary', key: 'admin.colorSecondary' },
    { value: 'success', key: 'admin.colorSuccess' },
    { value: 'warning', key: 'admin.colorWarning' },
    { value: 'danger', key: 'admin.colorDanger' }
  ]

  let showModal = $state(false)
  let currentPage = $state(data.pagination?.page ?? 1)

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
  let formName = $state('')
  let formSlug = $state('')
  let formDescription = $state('')
  let formLevel = $state('0')
  let formColor = $state('secondary')
  let permissions = $state<Record<string, boolean>>({})

  function loadPermissions(json: string) {
    try {
      permissions = JSON.parse(json) as Record<string, boolean>
    } catch {
      permissions = {}
    }
  }

  function openCreate() {
    editingRole = null
    formName = ''
    formSlug = ''
    formDescription = ''
    formLevel = '0'
    formColor = 'secondary'
    permissions = {}
    showModal = true
  }

  function openEdit(role: EditingRole & {}) {
    if (!role) return
    editingRole = role
    formName = role.name
    formSlug = role.slug
    formDescription = role.description ?? ''
    formLevel = String(role.level)
    formColor = role.color
    loadPermissions(role.permissions)
    showModal = true
  }

  function closeModal() {
    showModal = false
    editingRole = null
  }

  async function confirmDelete(e: MouseEvent): Promise<void> {
    e.preventDefault()
    const button = e.currentTarget as HTMLButtonElement
    const msg =
      adminT['admin.confirmDeleteRole'] ?? adminT['admin.confirmDelete'] ?? t('common.areYouSure')
    if (confirm(msg + ' "' + (button.dataset.name ?? '') + '"?')) button.form?.requestSubmit()
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
        <IconPlus class="size-4" />
        {t('common.create')}
      </CtaButton>
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
          <div class="flex items-center justify-end gap-1">
            <button
              onclick={() => openEdit(row)}
              class="p-1.5 rounded-md text-pm-text-muted hover:text-pm-brand hover:bg-pm-bg-sunken transition-colors"
              aria-label={t('common.edit')}
            >
              <IconPencil class="size-4" />
            </button>
            <form method="POST" action="?/delete" class="inline-flex">
              <input type="hidden" name="_csrf" value={$page.data.csrfToken} />
              <input type="hidden" name="id" value={row.id} />
              <button
                type="submit"
                data-name={row.name}
                disabled={row.isBuiltIn}
                title={row.isBuiltIn
                  ? (adminT['admin.cannotDeleteBuiltIn'] ?? t('admin.cannotDeleteBuiltIn'))
                  : undefined}
                class="p-1.5 rounded-md text-pm-text-muted hover:text-pm-danger hover:bg-pm-bg-sunken transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label={t('common.delete')}
                onclick={confirmDelete}
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
</div>

<AdminModal
  open={showModal}
  title={editingRole
    ? (adminT['admin.editRole'] ?? t('admin.editRole'))
    : (adminT['admin.addRole'] ?? t('admin.addRole'))}
  maxWidthClass="max-w-lg"
  formAction={editingRole ? '?/update' : '?/create'}
  cancelLabel={t('common.cancel')}
  submitLabel={t('common.save')}
  onclose={closeModal}
>
  <input type="hidden" name="_csrf" value={$page.data.csrfToken} />
  {#if editingRole}
    <input type="hidden" name="id" value={editingRole.id} />
  {/if}

  <div class="flex flex-col gap-4">
    <FormField
      name="name"
      label={adminT['admin.name'] ?? t('common.name')}
      bind:value={formName}
      error={t(errors.name?.[0] ?? '')}
      required
    />
    {#if !editingRole}
      <FormField
        name="slug"
        label={adminT['admin.slug'] ?? t('admin.slug')}
        bind:value={formSlug}
        error={t(errors.slug?.[0] ?? '')}
        required
      />
      <p class="text-xs text-pm-text-muted -mt-2">
        {adminT['admin.slugImmutable'] ?? t('admin.slugImmutable')}
      </p>
    {/if}
    <FormField
      name="description"
      label={adminT['admin.description'] ?? t('admin.description')}
      bind:value={formDescription}
      error={t(errors.description?.[0] ?? '')}
    />
    <FormField
      name="level"
      type="number"
      label={adminT['admin.level'] ?? t('admin.level')}
      bind:value={formLevel}
      error={t(errors.level?.[0] ?? '')}
    />

    <div class="flex flex-col gap-1.5">
      <label for="field-color" class="text-sm font-medium text-pm-text">
        {adminT['admin.color'] ?? t('admin.color')}
      </label>
      <select
        name="color"
        id="field-color"
        bind:value={formColor}
        class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text"
      >
        {#each COLOR_OPTIONS as opt}
          <option value={opt.value}>{adminT[opt.key] ?? opt.value}</option>
        {/each}
      </select>
    </div>

    <fieldset>
      <legend class="text-sm font-medium text-pm-text mb-2">
        {adminT['admin.permissions'] ?? t('admin.permissions')}
      </legend>
      <div
        class="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border border-pm-border rounded-md p-3"
      >
        {#each pages as p}
          <label class="flex items-center gap-2 text-sm text-pm-text cursor-pointer">
            <input
              type="checkbox"
              name={`perm_${p.id}`}
              checked={permissions[p.id] === true}
              class="size-4 rounded border-pm-border text-pm-brand focus:ring-pm-brand"
            />
            {adminT['admin.' + p.id] ?? p.id}
          </label>
        {/each}
      </div>
    </fieldset>

    {#if errors.name?.[0] || errors.slug?.[0] || errors.id?.[0]}
      <p
        class="text-sm text-pm-danger bg-pm-danger-bg border border-pm-danger rounded-md px-3 py-2"
        role="alert"
      >
        {t(errors.name?.[0] ?? errors.slug?.[0] ?? errors.id?.[0] ?? '')}
      </p>
    {/if}
  </div>
</AdminModal>
