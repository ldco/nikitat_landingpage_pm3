<script lang="ts">
  /**
   * UserFormModal — add/edit admin user modal.
   *
   * Owns the modal form state (email, password, name, role) and posts through
   * the AdminModal SvelteKit form action (`?/create` / `?/update`) — the
   * standard admin form contract (Zod + fail(400, { fieldErrors })). Field
   * errors come from `$page.form` and keep the modal open.
   *
   * @props {boolean} open — modal visibility
   * @props {AdminUser|null} editingUser — user being edited (null = create)
   * @props {Array<{id:number;slug:string;name:string}>} roles — selectable
   *   roles (name used to display custom roles that have no i18n label)
   * @props {boolean} [selfEdit=false] — editing the currently logged-in account;
   *   the role field is locked (self-role changes are rejected server-side)
   * @props {() => void} onClose — close callback
   *
   * @example
   * <UserFormModal open={showModal} editingUser={editingUser} {roles} onClose={closeModal} />
   */
  import { page } from '$app/stores'
  import { t } from '$lib/stores/content.svelte'
  import { getAdminT } from '$lib/utils/admin-translations'
  import AdminModal from '$lib/components/molecules/AdminModal.svelte'
  import FormField from '$lib/components/atoms/FormField.svelte'
  import type { AdminUser } from '$lib/admin-users'

  let {
    open = false,
    editingUser = null,
    roles = [],
    selfEdit = false,
    onClose
  }: {
    open: boolean
    editingUser?: AdminUser | null
    roles?: Array<{ id: number; slug: string; name: string }>
    selfEdit?: boolean
    onClose: () => void
  } = $props()

  const adminT = $derived(getAdminT($page.data))
  const form = $derived($page.form)
  const errors = $derived(
    (form as { fieldErrors?: Record<string, string[]> } | null)?.fieldErrors ?? {}
  )

  let formEmail = $state('')
  let formPassword = $state('')
  let formName = $state('')
  let formRole = $state('editor')

  // Re-initialize the form whenever the modal opens (create = blank, edit =
  // pre-filled with the user's current values; password always blank).
  $effect(() => {
    if (!open) return
    formEmail = editingUser?.email ?? ''
    formPassword = ''
    formName = editingUser?.name ?? ''
    formRole = editingUser?.role ?? 'editor'
  })

  function roleLabel(role: string): string {
    return t(`admin.role.${role}`)
  }

  // Display name for a role slug: the translated label when the catalog has
  // one (built-in roles), else the role's own name (custom roles — the admin
  // editor never seeds admin.role.* keys for them), else the slug.
  function roleDisplay(role: string): string {
    const label = roleLabel(role)
    if (label !== `admin.role.${role}`) return label
    return roles.find(r => r.slug === role)?.name ?? role
  }

  const roleOptions = $derived(roles.map(r => ({ value: r.slug, label: roleDisplay(r.slug) })))
</script>

<AdminModal
  open={open}
  title={editingUser ? adminT['admin.editUser'] ?? t('admin.editUser') : adminT['admin.addUser'] ?? t('admin.addUser')}
  formAction={editingUser ? '?/update' : '?/create'}
  cancelLabel={t('common.cancel')}
  submitLabel={t('common.save')}
  submitDisabled={!formEmail.trim() || (editingUser === null && !formPassword)}
  onclose={onClose}
>
  <input type="hidden" name="_csrf" value={$page.data.csrfToken} />
  {#if editingUser}
    <input type="hidden" name="id" value={editingUser.id} />
  {/if}

  <div class="flex flex-col gap-1.5">
    <label for="user-email" class="text-sm font-medium text-pm-text">{adminT['admin.email'] ?? t('admin.email')} *</label>
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
      {adminT['admin.password'] ?? t('admin.password')}{editingUser ? '' : ' *'}
    </label>
    <input
      id="user-password"
      name="password"
      bind:value={formPassword}
      type="password"
      required={!editingUser}
      placeholder={editingUser ? adminT['admin.leaveBlankToKeep'] ?? t('admin.leaveBlankToKeep') : ''}
      autocomplete="new-password"
      class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring"
    />
    {#if errors.password?.[0]}<p class="text-xs text-pm-danger">{t(errors.password[0])}</p>{/if}
  </div>

  <div class="flex flex-col gap-1.5">
    <label for="user-name" class="text-sm font-medium text-pm-text">{adminT['admin.name'] ?? t('admin.name')}</label>
    <input
      id="user-name"
      name="name"
      bind:value={formName}
      type="text"
      class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring"
    />
  </div>

  {#if selfEdit}
    <!-- Self-edit: role is locked — the server rejects self-role changes, so
         the select is replaced by a static read-only value + hidden input
         (a disabled select would drop the field from FormData entirely).
         The hidden input carries the EFFECTIVE role slug (custom roles
         included), which the update action resolves to the same identity. -->
    <div class="flex flex-col gap-1.5">
      <label for="user-role" class="text-sm font-medium text-pm-text">
        {adminT['admin.roleColumn'] ?? t('admin.roleColumn')} *
      </label>
      <p id="user-role" class="px-3 py-2 rounded-md border border-pm-border bg-pm-bg-sunken text-sm text-pm-text">
        {roleDisplay(formRole)}
      </p>
      <input type="hidden" name="role" value={formRole} />
    </div>
  {:else}
    <FormField
      name="role"
      type="select"
      label={adminT['admin.roleColumn'] ?? t('admin.roleColumn')}
      options={roleOptions}
      bind:value={formRole}
      required
      error={errors.role?.[0] ? t(errors.role[0]) : ''}
    />
  {/if}
</AdminModal>
