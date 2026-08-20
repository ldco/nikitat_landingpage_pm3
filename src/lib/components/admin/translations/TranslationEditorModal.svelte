<script lang="ts">
  /**
   * TranslationEditorModal — add/edit translation dialog for the admin
   * translations page (key + per-locale value textareas).
   *
   * Owns the modal form state and the add/edit POST (single-locale for edits,
   * batch for new keys across every locale). After a successful save it calls
   * `onClose()` and then `onSaved(wasEdit)` so the page can refresh the
   * affected locale row sets (`wasEdit` — refresh only the active locale).
   *
   * @props {boolean} open — modal visibility
   * @props {string|null} editingKey — key being edited (null = add)
   * @props {string|null} editingLocale — locale of the key being edited
   * @props {string} [editValue=''] — current value of the edited key
   * @props {'content'|'system'} [activeSection='content'] — active section (badge/hints)
   * @props {boolean} [canEditSystem=false] — master-only system section editing
   * @props {string[]} [locales=[]] — configured locales (batch value inputs)
   * @props {Record<string,string>} [localeNames={}] — display names per locale
   * @props {() => void} onClose — close callback
   * @props {(wasEdit: boolean) => void|Promise<void>} onSaved — post-save refresh hook
   *
   * @example
   * <TranslationEditorModal open={showModal} editingKey={editingKey} editingLocale={editingLocale}
   *   editValue={editValue} activeSection={activeSection} canEditSystem={canEditSystem}
   *   {locales} {localeNames} onClose={closeModal} onSaved={refresh} />
   */
  import { page } from '$app/stores'
  import { clsx } from 'clsx'
  import { t } from '$lib/stores/content.svelte'
  import { getCsrfToken } from '$lib/utils/auth'
  import { API_ROUTES } from '$lib/utils/api-paths'
  import { getOverlaysState } from '$lib/stores/overlays.svelte'
  import { getAdminT } from '$lib/utils/admin-translations'
  import { isRtlLocale } from '$lib/config/site'
  import AdminModal from '$lib/components/molecules/AdminModal.svelte'

  let {
    open = false,
    editingKey = null,
    editingLocale = null,
    editValue = '',
    activeSection = 'content',
    canEditSystem = false,
    locales = [],
    localeNames = {},
    onClose,
    onSaved
  }: {
    open: boolean
    editingKey?: string | null
    editingLocale?: string | null
    editValue?: string
    activeSection?: 'content' | 'system'
    canEditSystem?: boolean
    locales?: string[]
    localeNames?: Record<string, string>
    onClose: () => void
    onSaved: (wasEdit: boolean) => void | Promise<void>
  } = $props()

  const adminT = $derived(getAdminT($page.data))
  const overlays = getOverlaysState()

  let formKey = $state('')
  let formValues = $state<Record<string, string>>({})
  let saving = $state(false)

  // Re-initialize the form whenever the modal opens (add = blank key + all
  // locales; edit = fixed key + the edited locale's current value).
  // The values are built in a LOCAL object and assigned once: mutating
  // `formValues[loc]` inside the effect reads AND writes the same $state,
  // which Svelte 5 flags as `effect_update_depth_exceeded` and breaks the
  // modal's reactivity (the Save button never enabled in the e2e suite).
  $effect(() => {
    if (!open) return
    formKey = editingKey ?? ''
    const values: Record<string, string> = {}
    if (editingKey && editingLocale) {
      values[editingLocale] = editValue
    } else {
      for (const loc of locales) values[loc] = ''
    }
    formValues = values
  })

  async function saveTranslation(): Promise<void> {
    if (!formKey.trim()) return
    saving = true
    try {
      if (editingKey && editingLocale) {
        // Single-locale update (PUT parity via POST /api/admin/translations)
        const res = await fetch(API_ROUTES.admin.translations.list, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-csrf-token': getCsrfToken() },
          body: JSON.stringify({
            locale: editingLocale,
            key: formKey,
            value: formValues[editingLocale] ?? ''
          })
        })
        const body = await res.json().catch(() => null)
        if (!res.ok || body?.success === false) throw new Error()
      } else {
        // Batch: all locales at once (PM2 /api/admin/translations/batch)
        const res = await fetch(API_ROUTES.admin.translations.batch, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-csrf-token': getCsrfToken() },
          body: JSON.stringify({ key: formKey, values: formValues })
        })
        const body = await res.json().catch(() => null)
        if (!res.ok || body?.success === false) throw new Error()
      }
      onClose()
      overlays.showToast(t('common.saved'), 'success')
      await onSaved(!!editingKey)
    } catch {
      overlays.showToast(
        adminT['admin.failedSaveTranslation'] ?? t('admin.failedSaveTranslation'),
        'error'
      )
    } finally {
      saving = false
    }
  }
</script>

<AdminModal
  open={open}
  title={editingKey ? t('common.edit') : (adminT['admin.addItem'] ?? t('admin.addItem'))}
  maxWidthClass="max-w-lg"
  cancelLabel={t('common.cancel')}
  submitLabel={saving ? t('common.saving') : t('common.save')}
  submitDisabled={saving || !formKey.trim()}
  loading={saving}
  onclose={onClose}
  onsubmit={saveTranslation}
>
  {#snippet badge()}
    {#if !editingKey && canEditSystem}
      <span
        class={clsx(
          'inline-block ms-2 px-2 py-0.5 rounded text-xs font-medium align-middle',
          activeSection === 'system'
            ? 'bg-pm-warning-bg text-pm-warning'
            : 'bg-pm-brand-subtle text-pm-brand-text'
        )}
      >
        {activeSection === 'system'
          ? (adminT['admin.translationsSystem'] ?? t('admin.translationsSystem'))
          : (adminT['admin.translationsContent'] ?? t('admin.translationsContent'))}
      </span>
    {/if}
  {/snippet}

  {#if !editingKey && activeSection === 'system'}
    <div
      class="px-3 py-2 rounded-md bg-pm-warning-bg border border-pm-warning text-sm text-pm-warning"
    >
      <strong>
        {adminT['admin.translationsAddingToSystem'] ?? t('admin.translationsAddingToSystem')}
      </strong>
      {adminT['admin.translationsSystemPrefixHint'] ?? t('admin.translationsSystemPrefixHint')}
      <code class="px-1 py-0.5 rounded bg-black/5 text-xs">common.</code>
      ,
      <code class="px-1 py-0.5 rounded bg-black/5 text-xs">admin.</code>
      ,
      <code class="px-1 py-0.5 rounded bg-black/5 text-xs">nav.</code>
      ,
      <code class="px-1 py-0.5 rounded bg-black/5 text-xs">auth.</code>
    </div>
  {:else if !editingKey && canEditSystem}
    <div
      class="px-3 py-2 rounded-md bg-pm-bg-sunken border border-pm-border text-sm text-pm-text-muted"
    >
      {adminT['admin.translationsAddingToContent'] ?? t('admin.translationsAddingToContent')}
      <code class="px-1 py-0.5 rounded bg-black/5 text-xs">hero.</code>
      ,
      <code class="px-1 py-0.5 rounded bg-black/5 text-xs">about.</code>
      ,
      <code class="px-1 py-0.5 rounded bg-black/5 text-xs">cta.</code>
    </div>
  {/if}

  <div class="flex flex-col gap-1.5">
    <label for="translation-modal-key" class="text-sm font-medium text-pm-text">
      {adminT['admin.translationKey'] ?? t('admin.translationKey')}
    </label>
    <input
      id="translation-modal-key"
      bind:value={formKey}
      type="text"
      required
      disabled={!!editingKey}
      class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:ring-2 focus:ring-pm-focus-ring disabled:bg-pm-bg-sunken disabled:cursor-not-allowed disabled:opacity-70"
      placeholder={activeSection === 'system'
        ? (adminT['admin.translationSystemPlaceholder'] ?? t('admin.translationSystemPlaceholder'))
        : (adminT['admin.translationContentPlaceholder'] ?? t('admin.translationContentPlaceholder'))}
    />
    <small class="text-sm text-pm-text-muted">
      {adminT['admin.translationKeyHint'] ?? t('admin.translationKeyHint')}
    </small>
  </div>

  {#if editingKey && editingLocale}
    <div class="flex flex-col gap-1.5">
      <label for="translation-modal-value" class="text-sm font-medium text-pm-text">
        {localeNames[editingLocale] || editingLocale}
      </label>
      <textarea
        id="translation-modal-value"
        bind:value={formValues[editingLocale]}
        rows={3}
        required
        dir="auto"
        class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:ring-2 focus:ring-pm-focus-ring"
      ></textarea>
    </div>
  {:else}
    {#each locales as loc (loc)}
      <div class="flex flex-col gap-1.5">
        <label for="translation-locale-{loc}" class="text-sm font-medium text-pm-text">
          {localeNames[loc] || loc}
        </label>
        <textarea
          id="translation-locale-{loc}"
          bind:value={formValues[loc]}
          rows={2}
          dir={isRtlLocale(loc) ? 'rtl' : 'ltr'}
          class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:ring-2 focus:ring-pm-focus-ring"
          placeholder={t('admin.translationValuePlaceholder', {
            locale: localeNames[loc] || loc
          })}
        ></textarea>
      </div>
    {/each}
  {/if}
</AdminModal>
