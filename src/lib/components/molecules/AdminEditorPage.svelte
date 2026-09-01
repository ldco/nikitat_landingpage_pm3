<script lang="ts">
  /**
   * AdminEditorPage — shared shell for admin entity create/edit pages.
   *
   * Produces the complete editor framing from ONE reusable pattern instead of
   * hand-assembling it per module: page title, back navigation, optional top
   * actions, the `<form method="POST">` element with the CSRF hidden input,
   * and the footer Cancel/Save action row.
   *
   * Title convention: create pages pass `t('common.create')`, edit pages pass
   * `t('common.edit')` — never mix generic and entity-specific wording (see
   * docs/contributing/adding-a-new-entity.md § Admin editing-surface contract).
   *
   * @props {string} title — page heading (i18n resolved by parent)
   * @props {string} backHref — list route for the back action
   * @props {string} csrfToken — CSRF token for the hidden `_csrf` input
   * @props {string} [subtitle] — supporting text under the heading
   * @props {HTMLFormElement|null} [formEl] — bindable form element reference
   *   (dirty-guard navigation bypass in edit pages)
   * @props {boolean} [saveDisabled=false] — disables the footer Save button
   * @props {string} [class] — additional CSS classes merged via twMerge
   * @props {Snippet} [actions] — extra top actions rendered after the back action
   * @props {Snippet} children — form body (AdminFormSection blocks, etc.)
   *
   * @example
   * <AdminEditorPage
   *   title={t('common.create')}
   *   backHref={ADMIN_ROUTES.blog}
   *   csrfToken={$page.data.csrfToken}
   * >
   *   <AdminFormSection title={t('admin.basicInfo')}>
   *     <FormField name="slug" bind:value={slug} />
   *   </AdminFormSection>
   * </AdminEditorPage>
   */
  import { t } from '$lib/stores/content.svelte'
  import PageHeader from '$lib/components/atoms/PageHeader.svelte'
  import AdminBackButton from '$lib/components/atoms/AdminBackButton.svelte'
  import FormActions from '$lib/components/molecules/FormActions.svelte'

  let {
    title,
    backHref,
    csrfToken,
    subtitle,
    formEl = $bindable(null),
    saveDisabled = false,
    class: className = '',
    actions,
    children
  }: {
    title: string
    backHref: string
    csrfToken: string
    subtitle?: string
    formEl?: HTMLFormElement | null
    saveDisabled?: boolean
    class?: string
    actions?: import('svelte').Snippet
    children?: import('svelte').Snippet
  } = $props()
</script>

{#snippet headerActions()}
  <AdminBackButton href={backHref} />
  {@render actions?.()}
{/snippet}

<PageHeader {title} {subtitle} class={className} actions={headerActions} />

<form
  method="POST"
  bind:this={formEl}
  class="flex flex-col gap-6"
  data-testid="admin-editor-form"
>
  <input type="hidden" name="_csrf" value={csrfToken} />
  {@render children?.()}
  <FormActions
    cancelLabel={t('common.cancel')}
    cancelHref={backHref}
    submitLabel={t('common.save')}
    submitDisabled={saveDisabled}
  />
</form>
