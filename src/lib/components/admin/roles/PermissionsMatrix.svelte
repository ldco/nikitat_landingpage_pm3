<script lang="ts">
  /**
   * PermissionsMatrix — role permission checkbox grid for the admin roles editor.
   *
   * Renders one `perm_<pageId>` checkbox per admin page. Checkboxes are
   * uncontrolled: initial `checked` comes from the `permissions` record and the
   * RoleEditorModal's SvelteKit form action rebuilds the JSON server-side from
   * the submitted checkbox names.
   *
   * @props {Array<{id:string}>} pages — authorized admin pages (permission ids)
   * @props {Record<string,boolean>} permissions — initial checked state by page id
   * @props {string} [label=''] — fieldset legend text (i18n-resolved)
   * @props {string} [class] — additional CSS classes merged via twMerge
   *
   * @example
   * <PermissionsMatrix {pages} {permissions} label={t('admin.permissions')} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { page } from '$app/stores'
  import { getAdminT } from '$lib/utils/admin-translations'

  let {
    pages,
    permissions,
    label = '',
    class: className = ''
  }: {
    pages: Array<{ id: string }>
    permissions: Record<string, boolean>
    label?: string
    class?: string
  } = $props()

  const adminT = $derived(getAdminT($page.data))
</script>

<fieldset class={twMerge(clsx('flex flex-col gap-1.5', className))}>
  {#if label}
    <legend class="text-sm font-medium text-pm-text mb-2">{label}</legend>
  {/if}
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
