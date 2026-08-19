<script lang="ts">
  /**
   * Admin Translations — PM v2 translations.vue parity
   *
   * Orchestration shell: wires page data, top-level section/locale selection
   * and search, then delegates to focused components:
   *   - section-toggle (Content / System pill buttons + counts)
   *   - alert--warning (system translations notice)
   *   - tabs--underline (locale tabs + per-locale counts)
   *   - search-bar (icon + input)
   *   - TranslationNamespaceList (namespace accordion cards + data-table)
   *   - TranslationEditorModal (add/edit: key + per-locale value textareas)
   *
   * The refresh/rebuild flow around `rebuildLocaleRows()` lives in
   * `$lib/utils/translations-editor` (`refreshLocaleRows()`).
   *
   * System translations editable by master only (PM v2 parity: the admin
   * guide reserves system keys for the master role) — the UI lock is a
   * convenience layer; the real security boundary is isSystemKey() in the
   * API routes.
   */
  import { t } from '$lib/stores/content.svelte'
  import { untrack } from 'svelte'
  import { page } from '$app/stores'
  import { getCsrfToken } from '$lib/utils/auth'
  import { API_ROUTES } from '$lib/utils/api-paths'
  import { getOverlaysState } from '$lib/stores/overlays.svelte'
  import PageHeader from '$lib/components/atoms/PageHeader.svelte'
  import AdminCreateButton from '$lib/components/atoms/AdminCreateButton.svelte'
  import InlineBannerAction from '$lib/components/atoms/InlineBannerAction.svelte'
  import EmptyState from '$lib/components/atoms/EmptyState.svelte'
  import LoadingText from '$lib/components/atoms/LoadingText.svelte'
  import SegmentedControl from '$lib/components/atoms/SegmentedControl.svelte'
  import AdminTabs from '$lib/components/admin/AdminTabs.svelte'
  import TranslationNamespaceList, {
    type TranslationGroup
  } from '$lib/components/admin/translations/TranslationNamespaceList.svelte'
  import TranslationEditorModal from '$lib/components/admin/translations/TranslationEditorModal.svelte'
  import IconSearch from '@tabler/icons-svelte/icons/search'
  import IconSettings from '@tabler/icons-svelte/icons/settings'
  import IconFileText from '@tabler/icons-svelte/icons/file-text'
  import type { PageData } from './$types'
  import type { AdminTranslationRow } from './+page.server'
  import { getAdminT } from '$lib/utils/admin-translations'
  import {
    HIDDEN_CONTENT_NAMESPACES,
    type LocaleCounts,
    countRows,
    fetchLocaleRows,
    refreshLocaleRows
  } from '$lib/utils/translations-editor'
  import { resolveInitialLocale } from '$lib/utils/admin-locale'

  let { data }: { data: PageData } = $props()
  const adminT = $derived(getAdminT($page.data))

  const locales = $derived((data.locales ?? []) as string[])
  const localeNames = $derived((data.localeNames ?? {}) as Record<string, string>)

  // Rows are loaded ON DEMAND: the server ships only the initial locale; the
  // rest are fetched the first time their tab is opened (fetchLocaleRows).
  // Intentional one-time captures seed the initial state; `byLocale` is
  // mutated in place by the on-demand loader.
  const initByLocale = untrack(() => data.byLocale ?? {})
  const initLocaleCounts = untrack(() => data.localeCounts ?? {})
  const byLocale = $state<Record<string, AdminTranslationRow[]>>(initByLocale)
  // Precomputed server-side counts (one lightweight query) — locale tabs and
  // the Content/System totals never filter raw row arrays.
  const localeCounts = $state<Record<string, LocaleCounts>>(initLocaleCounts)

  // PM2: system section only editable by master (admin guide: "System |
  // Navigation, buttons, labels | Master only"); hidden namespace for legal docs
  const canEditSystem = $derived(data.user?.role === 'master')
  const overlays = getOverlaysState()

  let activeSection = $state<'content' | 'system'>('content')
  const initLocales = untrack(() => data.locales)
  const initialLocale = resolveInitialLocale(initLocales)
  let activeLocale = $state(initialLocale)
  let searchQuery = $state('')
  let loadingLocales = $state<ReadonlySet<string>>(new Set())
  // Locales whose on-demand load failed — marked settled so the effect does
  // not refetch them in an unbounded loop; the user can retry explicitly.
  let failedLocales = $state<ReadonlySet<string>>(new Set())

  async function loadLocaleRows(locale: string): Promise<void> {
    if (loadingLocales.has(locale)) return
    loadingLocales = new Set(loadingLocales).add(locale)
    const rows = await fetchLocaleRows(locale)
    if (rows) {
      byLocale[locale] = rows
      localeCounts[locale] = countRows(rows)
    } else {
      failedLocales = new Set(failedLocales).add(locale)
    }
    const next = new Set(loadingLocales)
    next.delete(locale)
    loadingLocales = next
  }

  // Fetch the active locale's rows the first time its tab is selected.
  $effect(() => {
    const loc = activeLocale
    if (!byLocale[loc] && !loadingLocales.has(loc) && !failedLocales.has(loc)) {
      void loadLocaleRows(loc)
    }
  })

  const isLoadingActive = $derived(loadingLocales.has(activeLocale))
  const isLoadingError = $derived(failedLocales.has(activeLocale))

  // Build tabs for AdminTabs component — counts come from the precomputed
  // server summary, never from filtering every locale's raw rows.
  const localeTabs = $derived(
    locales.map(loc => {
      const counts = localeCounts[loc] ?? { content: 0, system: 0 }
      return {
        id: loc,
        label: localeNames[loc] || loc.toUpperCase(),
        count: activeSection === 'system' ? counts.system : counts.content
      }
    })
  )

  // ── Derived data (PM2 translations.vue computed) ─────────────────────────
  const currentTranslations = $derived.by<AdminTranslationRow[]>(() => {
    const rows = byLocale[activeLocale] ?? []
    if (activeSection === 'system') return rows.filter(r => r.type === 'system')
    return rows.filter(
      r => r.type === 'content' && !HIDDEN_CONTENT_NAMESPACES.has(r.key.split('.')[0] ?? 'root')
    )
  })

  const filteredTranslations = $derived.by(() => {
    const sorted = [...currentTranslations].sort((a, b) => a.key.localeCompare(b.key))
    if (!searchQuery.trim()) return sorted
    const q = searchQuery.toLowerCase()
    return sorted.filter(
      item => item.key.toLowerCase().includes(q) || item.value.toLowerCase().includes(q)
    )
  })

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

  // Cross-locale totals = sum of the lightweight per-locale summaries.
  const contentCount = $derived(
    locales.reduce((sum, loc) => sum + (localeCounts[loc]?.content ?? 0), 0)
  )
  const systemCount = $derived(
    locales.reduce((sum, loc) => sum + (localeCounts[loc]?.system ?? 0), 0)
  )

  // ── Add/Edit modal orchestration ────────────────────────────────────────
  let showModal = $state(false)
  let editingKey = $state<string | null>(null)
  let editingLocale = $state<string | null>(null)
  let editValue = $state('')

  function openAdd(): void {
    editingKey = null
    editingLocale = null
    editValue = ''
    showModal = true
  }

  function openEdit(item: AdminTranslationRow): void {
    editingKey = item.key
    editingLocale = activeLocale
    editValue = item.value
    showModal = true
  }

  async function deleteTranslation(item: AdminTranslationRow): Promise<void> {
    const confirmed = await overlays.confirm({
      title: t('common.delete'),
      message: adminT['admin.translationDeleteConfirm'] ?? t('admin.translationDeleteConfirm'),
      confirmText: t('common.delete'),
      variant: 'danger'
    })
    if (!confirmed) return
    try {
      const res = await fetch(API_ROUTES.admin.translations.item(activeLocale, item.key), {
        method: 'DELETE',
        headers: { 'x-csrf-token': getCsrfToken() }
      })
      const body = await res.json().catch(() => null)
      // Surface the server's specific error (an i18n key code) instead of a
      // generic toast — e.g. a key still referenced by content stays visible.
      const errorCode = typeof body?.error?.code === 'string' ? body.error.code : ''
      if (!res.ok || body?.success === false) throw new Error(errorCode)
      overlays.showToast(
        adminT['admin.translationDeleted'] ?? t('admin.translationDeleted'),
        'success'
      )
      await refreshFromServer()
    } catch (e) {
      const key = e instanceof Error && e.message ? e.message : ''
      overlays.showToast(
        key ? t(key) : (adminT['admin.failedDeleteTranslation'] ?? t('admin.failedDeleteTranslation')),
        'error'
      )
    }
  }

  async function refreshFromServer(localesToRefresh?: string[]): Promise<void> {
    const targets = localesToRefresh && localesToRefresh.length > 0 ? localesToRefresh : [activeLocale]
    // Rebuild only the affected locale tables and fold their fresh counts into
    // the precomputed summary — never re-ship every locale's rows.
    const refreshed = await refreshLocaleRows(byLocale, targets)
    for (const [loc, counts] of Object.entries(refreshed)) {
      localeCounts[loc] = counts
    }
  }
</script>

<div class="admin-translations">
  <PageHeader
    title={adminT['admin.translations'] ?? t('admin.translations')}
    subtitle={adminT['admin.translationsSubtitle'] ?? t('admin.translationsSubtitle')}
  >
    {#snippet actions()}
      <AdminCreateButton
        onclick={openAdd}
        label={adminT['admin.addTranslation'] ?? t('admin.addTranslation')}
      />
    {/snippet}
  </PageHeader>

  <!-- Section toggle: Content / System (PM2 .section-toggle → SegmentedControl) -->
  {#if canEditSystem}
    <SegmentedControl
      options={[
        {
          id: 'content',
          label: adminT['admin.translationsContent'] ?? t('admin.translationsContent'),
          icon: IconFileText,
          count: contentCount
        },
        {
          id: 'system',
          label: adminT['admin.translationsSystem'] ?? t('admin.translationsSystem'),
          icon: IconSettings,
          count: systemCount
        }
      ]}
      active={activeSection}
      onchange={(id) => (activeSection = id as 'content' | 'system')}
      class="mb-4"
    />
  {/if}

  <!-- System translations warning (PM2 .alert--warning) -->
  {#if activeSection === 'system'}
    <div
      class="px-4 py-3 mb-4 rounded-md bg-pm-warning-bg border border-pm-warning text-pm-warning text-sm"
    >
      <strong>
        {adminT['admin.translationsSystemWarning'] ?? t('admin.translationsSystemWarning')}
      </strong>
      — {adminT['admin.translationsSystemWarningDesc'] ?? t('admin.translationsSystemWarningDesc')}
    </div>
  {/if}

  <!-- Locale tabs (using AdminTabs component) -->
  <AdminTabs tabs={localeTabs} active={activeLocale} onchange={id => (activeLocale = id)} />

  <!-- Search bar (PM2 .search-bar + .search-icon) -->
  <div class="relative mb-6">
    <IconSearch
      class="absolute start-3 top-1/2 -translate-y-1/2 size-5 text-pm-text-muted pointer-events-none"
    />
    <input
      bind:value={searchQuery}
      type="text"
      class="w-full ps-10 pe-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text placeholder:text-pm-text-muted focus:outline-none focus:ring-2 focus:ring-pm-focus-ring"
      placeholder={adminT['admin.searchTranslationsPlaceholder'] ?? t('admin.searchTranslationsPlaceholder')}
    />
  </div>

  <!-- Empty state -->
  {#if isLoadingActive}
    <LoadingText lines={4} />
  {:else if isLoadingError}
    <div class="px-4 py-3 rounded-md bg-pm-danger-bg border border-pm-danger text-sm text-pm-danger">
      {adminT['admin.failedLoadTranslations'] ?? t('common.error')}
      <InlineBannerAction
        onclick={() => {
          const next = new Set(failedLocales)
          next.delete(activeLocale)
          failedLocales = next
        }}
      >
        {t('common.retry')}
      </InlineBannerAction>
    </div>
  {:else if filteredTranslations.length === 0}
    <EmptyState
      type={searchQuery.trim() ? 'search' : 'empty-box'}
      size="compact"
      title={searchQuery.trim()
        ? (adminT['admin.noMatchesFound'] ?? t('admin.noMatchesFound'))
        : (adminT['admin.noTranslations'] ?? t('admin.noTranslations'))}
    />
  {:else}
    <!-- Namespace-grouped accordion cards (PM2 .translation-group-list) -->
    <TranslationNamespaceList
      groups={groupedTranslations}
      contextKey={`${activeSection}:${activeLocale}`}
      forceOpen={searchQuery.trim().length > 0}
      onEdit={openEdit}
      onDelete={deleteTranslation}
    />
  {/if}

  <!-- Add/Edit modal (using AdminModal molecule) -->
  <TranslationEditorModal
    open={showModal}
    editingKey={editingKey}
    editingLocale={editingLocale}
    editValue={editValue}
    activeSection={activeSection}
    canEditSystem={canEditSystem}
    {locales}
    {localeNames}
    onClose={() => (showModal = false)}
    onSaved={wasEdit => refreshFromServer(wasEdit ? undefined : locales)}
  />
</div>
