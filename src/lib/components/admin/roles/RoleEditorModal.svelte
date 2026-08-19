<script lang="ts">
  /**
   * RoleEditorModal — add/edit role modal (role fields + permissions matrix).
   *
   * Owns the modal form state (name, slug, description, level, color) and the
   * permissions record, and posts through the AdminModal SvelteKit form action
   * (`?/create` / `?/update`) — the standard admin form contract (Zod +
   * fail(400, { fieldErrors })). Permissions submit as `perm_<pageId>`
   * checkboxes (uncontrolled, rendered by PermissionsMatrix) and are rebuilt
   * server-side; field errors come from `$page.form` and keep the modal open.
   *
   * @props {boolean} open — modal visibility
   * @props {EditingRole|null} editingRole — role being edited (null = create)
   * @props {Array<{id:string}>} pages — admin pages for the permissions matrix
   * @props {() => void} onClose — close callback
   *
   * @example
   * <RoleEditorModal open={showModal} editingRole={editingRole} {pages} onClose={closeModal} />
   */
  import { page } from '$app/stores'
  import { t } from '$lib/stores/content.svelte'
  import { getAdminT } from '$lib/utils/admin-translations'
  import AdminModal from '$lib/components/molecules/AdminModal.svelte'
  import FormField from '$lib/components/atoms/FormField.svelte'
  import PermissionsMatrix from './PermissionsMatrix.svelte'

  export interface EditingRole {
    id: number
    name: string
    slug: string
    description: string | null
    level: number
    color: string
    permissions: string
    isBuiltIn: boolean
  }

  const COLOR_OPTIONS = [
    { value: 'primary', key: 'admin.colorPrimary' },
    { value: 'secondary', key: 'admin.colorSecondary' },
    { value: 'success', key: 'admin.colorSuccess' },
    { value: 'warning', key: 'admin.colorWarning' },
    { value: 'danger', key: 'admin.colorDanger' }
  ]
  const colorOptions = $derived(
    COLOR_OPTIONS.map(o => ({ value: o.value, label: o.key }))
  )

  let {
    open = false,
    editingRole = null,
    pages = [],
    onClose
  }: {
    open: boolean
    editingRole?: EditingRole | null
    pages?: Array<{ id: string }>
    onClose: () => void
  } = $props()

  const adminT = $derived(getAdminT($page.data))
  const form = $derived($page.form)
  const errors = $derived(
    (form as { fieldErrors?: Record<string, string[]> } | null)?.fieldErrors ?? {}
  )

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

  // Re-initialize the form whenever the modal opens (create = defaults, edit =
  // pre-filled with the role's current values + parsed permissions).
  $effect(() => {
    if (!open) return
    formName = editingRole?.name ?? ''
    formSlug = editingRole?.slug ?? ''
    formDescription = editingRole?.description ?? ''
    formLevel = String(editingRole?.level ?? 0)
    formColor = editingRole?.color ?? 'secondary'
    loadPermissions(editingRole?.permissions ?? '')
  })
</script>

<AdminModal
  open={open}
  title={editingRole
    ? (adminT['admin.editRole'] ?? t('admin.editRole'))
    : (adminT['admin.addRole'] ?? t('admin.addRole'))}
  maxWidthClass="max-w-lg"
  formAction={editingRole ? '?/update' : '?/create'}
  cancelLabel={t('common.cancel')}
  submitLabel={t('common.save')}
  onclose={onClose}
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

    <FormField
      name="color"
      type="select"
      label={adminT['admin.color'] ?? t('admin.color')}
      options={colorOptions}
      bind:value={formColor}
    />

    <PermissionsMatrix
      {pages}
      {permissions}
      label={adminT['admin.permissions'] ?? t('admin.permissions')}
    />

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
