<script lang="ts">
  /**
   * Admin Translations — PM v2 translations.vue parity
   *
   * Structure (exact PM2 DOM):
   *   page-header (title + subtitle + Add button)
   *   section-toggle (Content / System pill buttons + counts)
   *   alert--warning (system translations notice)
   *   tabs--underline (locale tabs + per-locale counts)
   *   search-bar (icon + input)
   *   translation-group-list → card per namespace (chevron + code + count)
   *     → data-table (key chip | editable value | delete)
   *   modal (add/edit: key + per-locale value textareas)
   *
   * System translations editable by master/admin only — the UI lock is a convenience
 * layer; the real security boundary is isSystemKey() in the API routes.
   */
  import { clsx } from 'clsx'
  import { t } from '$lib/stores/content.svelte'
  import { getCsrfToken } from '$lib/utils/auth'
  import { getOverlaysState } from '$lib/stores/overlays.svelte'
  import PageHeader from '$lib/components/atoms/PageHeader.svelte'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import EmptyState from '$lib/components/atoms/EmptyState.svelte'
  import AdminTabs from '$lib/components/admin/AdminTabs.svelte'
  import AdminModal from '$lib/components/molecules/AdminModal.svelte'
  import IconPlus from '@tabler/icons-svelte/icons/plus'
  import IconTrash from '@tabler/icons-svelte/icons/trash'
  import IconSearch from '@tabler/icons-svelte/icons/search'
  import IconSettings from '@tabler/icons-svelte/icons/settings'
  import IconFileText from '@tabler/icons-svelte/icons/file-text'
  import IconChevronDown from '@tabler/icons-svelte/icons/chevron-down'
  import type { PageData } from './$types'
  import type { AdminTranslationRow } from './+page.server'

  let { data }: { data: PageData } = $props()

  const byLocale = $derived((data.byLocale ?? {}) as Record<string, AdminTranslationRow[]>)
  const locales = $derived((data.locales ?? []) as string[])
  const localeNames = $derived((data.localeNames ?? {}) as Record<string, string>)

  // Build tabs for AdminTabs component
  const localeTabs = $derived(locales.map(loc => ({
    id: loc,
    label: localeNames[loc] || loc.toUpperCase(),
    count: activeSection === 'system'
      ? (byLocale[loc] ?? []).filter(r => r.type === 'system').length
      : (byLocale[loc] ?? []).filter(r => r.type === 'content' && !hiddenContentNamespaces.has(r.key.split('.')[0] ?? 'root')).length
  })))

  // PM2: system section only editable by master/admin; hidden namespace for legal docs
  const canEditSystem = $derived(data.user?.role === 'master' || data.user?.role === 'admin')
  const hiddenContentNamespaces = new Set(['legalDocuments'])
  const overlays = getOverlaysState()

  let activeSection = $state<'content' | 'system'>('content')
  const initialLocale = (data.locales?.[0] as string | undefined) ?? 'en'
  let activeLocale = $state(initialLocale)
  let searchQuery = $state('')
  let openGroups = $state<Set<string>>(new Set())

  // ── Derived data (PM2 translations.vue computed) ─────────────────────────
  const currentTranslations = $derived.by<AdminTranslationRow[]>(() => {
    const rows = byLocale[activeLocale] ?? []
    if (activeSection === 'system') return rows.filter(r => r.type === 'system')
    return rows.filter(r => r.type === 'content' && !hiddenContentNamespaces.has(r.key.split('.')[0] ?? 'root'))
  })

  const filteredTranslations = $derived.by(() => {
    const sorted = [...currentTranslations].sort((a, b) => a.key.localeCompare(b.key))
    if (!searchQuery.trim()) return sorted
    const q = searchQuery.toLowerCase()
    return sorted.filter(item => item.key.toLowerCase().includes(q) || item.value.toLowerCase().includes(q))
  })

  interface TranslationGroup { namespace: string; items: AdminTranslationRow[] }

  const groupedTranslations = $derived.by<TranslationGroup[]>(() => {
    const groups = new Map<string, AdminTranslationRow[]>()
    for (const item of filteredTranslations) {
      const ns = item.key.split('.')[0] || 'root'
      let list = groups.get(ns)
      if (!list) {
        list = []
        groups.set(ns, list)
      }
      list.push(item)
    }
    return [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([namespace, items]) => ({ namespace, items }))
  })

  const contentCount = $derived(
    locales.reduce((sum, loc) => {
      const rows = (byLocale[loc] ?? []).filter(r => r.type === 'content' && !hiddenContentNamespaces.has(r.key.split('.')[0] ?? 'root'))
      return sum + rows.length
    }, 0)
  )
  const systemCount = $derived(
    locales.reduce((sum, loc) => sum + (byLocale[loc] ?? []).filter(r => r.type === 'system').length, 0)
  )

  function groupKey(group: TranslationGroup): string {
    return `${activeSection}:${activeLocale}:${group.namespace}`
  }

  function isGroupOpen(group: TranslationGroup): boolean {
    return searchQuery.trim().length > 0 || openGroups.has(groupKey(group))
  }

  function toggleGroup(group: TranslationGroup): void {
    const key = groupKey(group)
    const next = new Set(openGroups)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    openGroups = next
  }

  // ── Add/Edit modal (PM2: modal with key + per-locale textareas) ──────────
  let showModal = $state(false)
  let editingKey = $state<string | null>(null)
  let editingLocale = $state<string | null>(null)
  let formKey = $state('')
  let formValues = $state<Record<string, string>>({})
  let saving = $state(false)

  function openAdd(): void {
    editingKey = null
    editingLocale = null
    formKey = ''
    formValues = {}
    for (const loc of locales) formValues[loc] = ''
    showModal = true
  }

  function openEdit(item: AdminTranslationRow): void {
    editingKey = item.key
    editingLocale = activeLocale
    formKey = item.key
    formValues = { [activeLocale]: item.value }
    showModal = true
  }

  function isSystemKey(key: string): boolean {
    return key.startsWith('admin.') || key.startsWith('nav.') || key.startsWith('common.') || key.startsWith('auth.') || key.startsWith('validation.') || key.startsWith('error.') || key.startsWith('footer.') || key.startsWith('apiErrors.')
  }

  async function saveTranslation(): Promise<void> {
    if (!formKey.trim()) return
    saving = true
    try {
      if (editingKey && editingLocale) {
        const res = await fetch('/api/admin/translations', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-csrf-token': getCsrfToken() },
          body: JSON.stringify({ locale: editingLocale, key: formKey, value: formValues[editingLocale] ?? '' })
        })
        const body = await res.json().catch(() => null)
        if (!res.ok || body?.success === false) throw new Error()
      } else {
        // Batch: all locales at once (PM2 /api/admin/translations/batch)
        const res = await fetch('/api/admin/translations/batch', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-csrf-token': getCsrfToken() },
          body: JSON.stringify({ key: formKey, values: formValues })
        })
        const body = await res.json().catch(() => null)
        if (!res.ok || body?.success === false) throw new Error()
      }
      showModal = false
      overlays.showToast(t('common.saved'), 'success')
      // Optimistic refresh: reload translations for the affected locale(s)
      await refreshFromServer()
    } catch {
      overlays.showToast(t('admin.failedSaveTranslation'), 'error')
    } finally {
      saving = false
    }
  }

  async function deleteTranslation(item: AdminTranslationRow): Promise<void> {
    const confirmed = await overlays.confirm({
      title: t('common.delete'),
      message: t('admin.translationDeleteConfirm'),
      confirmText: t('common.delete'),
      variant: 'danger'
    })
    if (!confirmed) return
    try {
      const res = await fetch(`/api/admin/translations/${activeLocale}/${encodeURIComponent(item.key)}`, {
        method: 'DELETE',
        headers: { 'x-csrf-token': getCsrfToken() }
      })
      const body = await res.json().catch(() => null)
      if (!res.ok || body?.success === false) throw new Error()
      overlays.showToast(t('admin.translationDeleted'), 'success')
      await refreshFromServer()
    } catch {
      overlays.showToast(t('admin.failedDeleteTranslation'), 'error')
    }
  }

  async function refreshFromServer(): Promise<void> {
    try {
      const res = await fetch(`/api/admin/translations?locale=${activeLocale}`, { headers: { 'x-csrf-token': getCsrfToken() } })
      const body = await res.json().catch(() => null)
      if (res.ok && body) {
        // GET returns { key: value } map — rebuild the locale rows in place
        const map = body as Record<string, string>
        const existing = byLocale[activeLocale] ?? []
        const existingKeys = new Set(existing.map(r => r.key))
        const updated: AdminTranslationRow[] = existing.map(row => ({ ...row, value: map[row.key] ?? row.value }))
        for (const [key, value] of Object.entries(map)) {
          if (!existingKeys.has(key)) {
            updated.push({ id: updated.length + 1, key, value, type: isSystemKey(key) ? 'system' : 'content' })
          }
        }
        // Mutate the source array so derived values re-evaluate
        byLocale[activeLocale] = updated
      }
    } catch (e) {
      console.warn('[admin] translations refresh failed:', e instanceof Error ? e.message : e)
    }
  }
</script>

<div class="admin-translations">
  <PageHeader title={t('admin.translations')} subtitle={t('admin.translationsSubtitle')}>
    {#snippet actions()}
      <CtaButton variant="primary" size="md" onclick={openAdd}>
        <IconPlus class="size-4" />
        {t('admin.addTranslation')}
      </CtaButton>
    {/snippet}
  </PageHeader>

  <!-- Section toggle: Content / System (PM2 .section-toggle) -->
  {#if canEditSystem}
    <div class="flex gap-2 mb-4">
      <button
        type="button"
        class={clsx('inline-flex items-center gap-2 px-4 py-2 rounded-md border text-sm transition-all', activeSection === 'content'
          ? 'bg-pm-brand border-pm-brand text-pm-white'
          : 'bg-pm-bg-elevated border-pm-border text-pm-text-muted hover:border-pm-brand hover:text-pm-text')}
        onclick={() => activeSection = 'content'}
      >
        <IconFileText class="size-4" />
        {t('admin.translationsContent')}
        <span class={clsx('inline-flex items-center justify-center min-w-6 h-5 px-1.5 rounded-full text-xs', activeSection === 'content' ? 'bg-white/20' : 'bg-black/10')}>{contentCount}</span>
      </button>
      <button
        type="button"
        class={clsx('inline-flex items-center gap-2 px-4 py-2 rounded-md border text-sm transition-all', activeSection === 'system'
          ? 'bg-pm-brand border-pm-brand text-pm-white'
          : 'bg-pm-bg-elevated border-pm-border text-pm-text-muted hover:border-pm-brand hover:text-pm-text')}
        onclick={() => activeSection = 'system'}
      >
        <IconSettings class="size-4" />
        {t('admin.translationsSystem')}
        <span class={clsx('inline-flex items-center justify-center min-w-6 h-5 px-1.5 rounded-full text-xs', activeSection === 'system' ? 'bg-white/20' : 'bg-black/10')}>{systemCount}</span>
      </button>
    </div>
  {/if}

  <!-- System translations warning (PM2 .alert--warning) -->
  {#if activeSection === 'system'}
    <div class="px-4 py-3 mb-4 rounded-md bg-pm-warning-bg border border-pm-warning text-pm-warning text-sm">
      <strong>{t('admin.translationsSystemWarning')}</strong> — {t('admin.translationsSystemWarningDesc')}
    </div>
  {/if}

  <!-- Locale tabs (using AdminTabs component) -->
  <AdminTabs tabs={localeTabs} active={activeLocale} onchange={(id) => activeLocale = id} />

  <!-- Search bar (PM2 .search-bar + .search-icon) -->
  <div class="relative mb-6">
    <IconSearch class="absolute start-3 top-1/2 -translate-y-1/2 size-5 text-pm-text-muted pointer-events-none" />
    <input
      bind:value={searchQuery}
      type="text"
      class="w-full ps-10 pe-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text placeholder:text-pm-text-muted focus:outline-none focus:ring-2 focus:ring-pm-focus-ring"
      placeholder={t('admin.searchTranslationsPlaceholder')}
    />
  </div>

  <!-- Empty state -->
  {#if filteredTranslations.length === 0}
    <EmptyState
      type={searchQuery.trim() ? 'search' : 'empty-box'}
      size="compact"
      title={searchQuery.trim() ? t('admin.noMatchesFound') : t('admin.noTranslations')}
    />
  {:else}
    <!-- Namespace-grouped accordion cards (PM2 .translation-group-list) -->
    <div class="flex flex-col gap-4">
      {#each groupedTranslations as group (group.namespace)}
        <section class="bg-pm-bg-elevated border border-pm-border rounded-xl overflow-hidden">
          <button
            type="button"
            class="w-full flex items-center justify-between gap-3 px-4 py-4 text-start bg-transparent border-0 cursor-pointer hover:bg-pm-bg-sunken transition-colors"
            aria-expanded={isGroupOpen(group)}
            onclick={() => toggleGroup(group)}
          >
            <span class="inline-flex items-center gap-2 min-w-0 font-semibold">
              <IconChevronDown class={clsx('size-4 text-pm-text-muted shrink-0 transition-transform', !isGroupOpen(group) && '-rotate-90')} />
              <code class="text-base text-pm-text">{group.namespace}</code>
            </span>
            <span class="inline-flex items-center justify-center min-w-8 px-2 py-1 rounded-full bg-pm-bg-sunken text-xs font-medium text-pm-text-muted">
              {group.items.length}
            </span>
          </button>

          {#if isGroupOpen(group)}
            <div class="overflow-x-auto border-t border-pm-border">
              <table class="w-full border-collapse text-sm">
                <thead class="hidden sm:table-header-group bg-pm-bg-sunken">
                  <tr>
                    <th class="px-5 py-3 text-start font-medium text-pm-text-muted text-sm whitespace-nowrap w-[var(--width-key-column)]">{t('admin.translationKey')}</th>
                    <th class="px-5 py-3 text-start font-medium text-pm-text-muted text-sm whitespace-nowrap">{t('admin.translationValue')}</th>
                    <th class="px-5 py-3 text-end font-medium text-pm-text-muted text-sm whitespace-nowrap"></th>
                  </tr>
                </thead>
                <tbody>
                  {#each group.items as item (item.id)}
                    <tr class="border-b border-pm-border last:border-b-0 hover:bg-pm-bg-sunken transition-colors sm:table-row flex flex-col sm:flex-row gap-2 sm:gap-0 p-4 sm:p-0 bg-pm-bg sm:bg-transparent rounded-md sm:rounded-none border sm:border-0 sm:border-b sm:border-pm-border">
                      <td class="px-5 py-3 align-top w-[var(--width-key-column)] sm:px-0 sm:py-1">
                        <span class="hidden max-sm:block text-sm font-medium text-pm-text-muted mb-1">{t('admin.translationKey')}</span>
                        <code class="text-sm bg-pm-bg-sunken px-2 py-1 rounded-md inline-block">{item.key}</code>
                      </td>
                      <td class="px-5 py-3 align-top cursor-pointer hover:bg-pm-brand-subtle transition-colors sm:px-0 sm:py-1" dir="auto" onclick={() => openEdit(item)}>
                        <span class="hidden max-sm:block text-sm font-medium text-pm-text-muted mb-1">{t('admin.translationValue')}</span>
                        {item.value}
                      </td>
                      <td class="px-5 py-3 text-end align-middle whitespace-nowrap sm:px-0 sm:pt-2 sm:border-t sm:border-pm-border sm:mt-1">
                        <button
                          type="button"
                          class="inline-flex items-center justify-center size-9 rounded-md text-pm-text-muted hover:bg-pm-danger/10 hover:text-pm-danger transition-colors"
                          aria-label={t('common.delete')}
                          onclick={() => deleteTranslation(item)}
                        >
                          <IconTrash class="size-4" />
                        </button>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}
        </section>
      {/each}
    </div>
  {/if}

  <!-- Add/Edit modal (using AdminModal molecule) -->
  <AdminModal
    open={showModal}
    title={editingKey ? t('common.edit') : t('admin.addItem')}
    maxWidthClass="max-w-lg"
    cancelLabel={t('common.cancel')}
    submitLabel={saving ? t('common.saving') : t('common.save')}
    submitDisabled={saving || !formKey.trim()}
    loading={saving}
    onclose={() => showModal = false}
    onsubmit={saveTranslation}
  >
    {#snippet badge()}
      {#if !editingKey && canEditSystem}
        <span class={clsx('inline-block ms-2 px-2 py-0.5 rounded text-xs font-medium align-middle', activeSection === 'system' ? 'bg-pm-warning-bg text-pm-warning' : 'bg-pm-brand-subtle text-pm-brand')}>
          {activeSection === 'system' ? t('admin.translationsSystem') : t('admin.translationsContent')}
        </span>
      {/if}
    {/snippet}

    {#if !editingKey && activeSection === 'system'}
      <div class="px-3 py-2 rounded-md bg-pm-warning-bg border border-pm-warning text-sm text-pm-warning">
        <strong>{t('admin.translationsAddingToSystem')}</strong>
        {t('admin.translationsSystemPrefixHint')} <code class="px-1 py-0.5 rounded bg-black/5 text-xs">common.</code>, <code class="px-1 py-0.5 rounded bg-black/5 text-xs">admin.</code>, <code class="px-1 py-0.5 rounded bg-black/5 text-xs">nav.</code>, <code class="px-1 py-0.5 rounded bg-black/5 text-xs">auth.</code>
      </div>
    {:else if !editingKey && canEditSystem}
      <div class="px-3 py-2 rounded-md bg-pm-bg-sunken border border-pm-border text-sm text-pm-text-muted">
        {t('admin.translationsAddingToContent')} <code class="px-1 py-0.5 rounded bg-black/5 text-xs">hero.</code>, <code class="px-1 py-0.5 rounded bg-black/5 text-xs">about.</code>, <code class="px-1 py-0.5 rounded bg-black/5 text-xs">cta.</code>
      </div>
    {/if}

    <div class="flex flex-col gap-1.5">
      <label for="translation-modal-key" class="text-sm font-medium text-pm-text">{t('admin.translationKey')}</label>
      <input
        id="translation-modal-key"
        bind:value={formKey}
        type="text"
        required
        disabled={!!editingKey}
        class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:ring-2 focus:ring-pm-focus-ring disabled:bg-pm-bg-sunken disabled:cursor-not-allowed disabled:opacity-70"
        placeholder={activeSection === 'system' ? t('admin.translationSystemPlaceholder') : t('admin.translationContentPlaceholder')}
      />
      <small class="text-sm text-pm-text-muted">{t('admin.translationKeyHint')}</small>
    </div>

    {#if editingKey && editingLocale}
      <div class="flex flex-col gap-1.5">
        <label for="translation-modal-value" class="text-sm font-medium text-pm-text">{localeNames[editingLocale] || editingLocale}</label>
        <textarea id="translation-modal-value" bind:value={formValues[editingLocale]} rows={3} required dir="auto" class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:ring-2 focus:ring-pm-focus-ring"></textarea>
      </div>
    {:else}
      {#each locales as loc (loc)}
        <div class="flex flex-col gap-1.5">
          <label for="translation-locale-{loc}" class="text-sm font-medium text-pm-text">{localeNames[loc] || loc}</label>
          <textarea
            id="translation-locale-{loc}"
            bind:value={formValues[loc]}
            rows={2}
            dir={loc === 'he' ? 'rtl' : 'ltr'}
            class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:ring-2 focus:ring-pm-focus-ring"
            placeholder={t('admin.translationValuePlaceholder', { locale: localeNames[loc] || loc })}
          ></textarea>
        </div>
      {/each}
    {/if}
  </AdminModal>
</div>
