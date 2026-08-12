<script lang="ts">
  /**
   * Admin Legal — PM v2 legal.vue parity
   *
   * Structure (exact PM2 DOM):
   *   page-header (title + subtitle)
   *   form.settings-form (bulk save)
   *     section.card — Company details (legal.company*, 2-col form-grid)
   *     section.card — Contact form legal gate (checkbox + description)
   *     section.card — Legal documents
   *       .admin-legal__status-grid (per-locale status cards)
   *       .tabs locale tabs (+ warning indicators for missing docs)
   *       .admin-legal__active-status (current locale badges)
   *       .admin-legal__tokens (placeholder tokens)
   *       .admin-legal__documents (per-doc title + badge + textarea)
   *   .form-actions → save button
   *
   * Legal settings save via PUT /api/admin/settings (bulk); document bodies
   * save via PUT /api/admin/legal/:slug per locale.
   */
  import { clsx } from 'clsx'
  import { t } from '$lib/stores/content.svelte'
  import { getCsrfToken } from '$lib/utils/auth'
  import { API_ROUTES } from '$lib/utils/api-paths'
  import { getOverlaysState } from '$lib/stores/overlays.svelte'
  import { renderLegalMarkdown } from '$lib/utils/legal-markdown'
  import PageHeader from '$lib/components/atoms/PageHeader.svelte'
  import CtaButton from '$lib/components/atoms/CtaButton.svelte'
  import AdminFormSection from '$lib/components/molecules/AdminFormSection.svelte'
  import MarkdownEditor from '$lib/components/molecules/MarkdownEditor.svelte'
  import AdminTabs from '$lib/components/admin/AdminTabs.svelte'
  import type { PageData } from './$types'
  import type { AdminLegalRow } from './+page.server'

  let { data }: { data: PageData } = $props()

  const byLocale = $derived((data.byLocale ?? {}) as Record<string, AdminLegalRow[]>)
  const locales = $derived((data.locales ?? []) as string[])
  const localeNames = $derived((data.localeNames ?? {}) as Record<string, string>)
  const settingsInitial = $derived((data.settings ?? {}) as Record<string, string>)

  const overlays = getOverlaysState()

  const DOC_SLUGS = ['privacy-policy', 'personal-data-policy', 'terms-of-service']
  const LEGAL_SETTING_KEYS = [
    'legal.companyLegalName',
    'legal.companyName',
    'legal.inn',
    'legal.kpp',
    'legal.ogrn',
    'legal.address',
    'legal.email',
    'contact.forceShowFormWithoutLegalDocuments'
  ] as const
  const PLACEHOLDER_TOKENS = ['{companyLegalName}', '{companyName}', '{inn}', '{kpp}', '{ogrn}', '{legalAddress}', '{legalEmail}']

  // ── Legal settings form (company details + contact gate) ─────────────────
  const legalSettingsForm = $state<Record<string, string>>({})
  let initialSettingsSnapshot = $state('')

  function serializeSettings(): string {
    return JSON.stringify(LEGAL_SETTING_KEYS.map(key => [key, legalSettingsForm[key] ?? '']))
  }

  // Synchronous init (SSR renders filled fields; no blank-until-hydration).
  {
    for (const key of LEGAL_SETTING_KEYS) {
      if (legalSettingsForm[key] === undefined) {
        legalSettingsForm[key] = settingsInitial[key] ?? (key === 'contact.forceShowFormWithoutLegalDocuments' ? 'false' : '')
      }
    }
    initialSettingsSnapshot = serializeSettings()
  }

  // ── Legal documents form (per-locale body) ──────────────────────────────
  const initialLocale = (data.locales?.[0] as string | undefined) ?? 'en'
  let activeLocale = $state(initialLocale)

  const docsForm = $state<Record<string, Record<string, string>>>({})
  let initialDocsSnapshot = $state('')



  // Reactive content accessor with guaranteed non-optional access for MarkdownEditor
  function contentFor(slug: string, locale: string): string {
    // Ensure nested objects exist (always true after init, but TS doesn't know)
    if (!docsForm[slug]) docsForm[slug] = {}
    return (docsForm[slug] as Record<string, string>)[locale] ?? ''
  }
  function setContentFor(slug: string, locale: string, value: string): void {
    if (!docsForm[slug]) docsForm[slug] = {}
    ;(docsForm[slug] as Record<string, string>)[locale] = value
  }

  /** Ensure docsForm[slug] is initialized for type-safe access */
  function getDocContent(slug: string, locale: string): string {
    docsForm[slug] = docsForm[slug] ?? {}
    return docsForm[slug][locale] ?? ''
  }

  function serializeDocs(): string {
    return JSON.stringify(
      DOC_SLUGS.map(slug => [slug, Object.fromEntries(locales.map(loc => [loc, docsForm[slug]?.[loc] ?? '']))])
    )
  }

  // Synchronous init for all locales (SSR renders document textareas).
  {
    for (const slug of DOC_SLUGS) {
      docsForm[slug] = docsForm[slug] ?? {}
      const rows = byLocale[activeLocale] ?? []
      const row = rows.find(r => r.slug === slug)
      if (docsForm[slug][activeLocale] === undefined) {
        docsForm[slug][activeLocale] = row?.content ?? ''
      }
      // Ensure all locales have the nested object initialized
      for (const loc of locales) {
        docsForm[slug][loc] = docsForm[slug][loc] ?? ''
      }
    }
    initialDocsSnapshot = serializeDocs()
  }

  const hasChanges = $derived(serializeSettings() !== initialSettingsSnapshot || serializeDocs() !== initialDocsSnapshot)
  let saving = $state(false)

  // Populate document bodies for the active locale on tab switch (after SSR).
  $effect(() => {
    const loc = activeLocale
    for (const slug of DOC_SLUGS) {
      docsForm[slug] = docsForm[slug] ?? {}
      if (docsForm[slug][loc] === undefined) {
        const row = (byLocale[loc] ?? []).find(r => r.slug === slug)
        docsForm[slug][loc] = row?.content ?? ''
      }
    }
  })

  function docLabel(slug: string): string {
    if (slug === 'privacy-policy') return t('footer.privacy')
    if (slug === 'personal-data-policy') return t('footer.personalData')
    return t('footer.terms')
  }

  function documentHasBody(slug: string, loc: string): boolean {
    return (docsForm[slug]?.[loc] ?? '').trim().length > 0
  }

  function documentComplete(slug: string, loc: string): boolean {
    // PM2: title always exists (footer labels are static); body determines status
    return documentHasBody(slug, loc)
  }

  interface LegalLocaleStatus {
    locale: string
    completeCount: number
    totalCount: number
    missingCount: number
    hasPrivacy: boolean
    hasPersonalData: boolean
    contactFormReady: boolean
    allComplete: boolean
  }

  function getLocaleStatus(loc: string): LegalLocaleStatus {
    const completeCount = DOC_SLUGS.filter(slug => documentComplete(slug, loc)).length
    const hasPrivacy = documentComplete('privacy-policy', loc)
    const hasPersonalData = documentComplete('personal-data-policy', loc)
    return {
      locale: loc,
      completeCount,
      totalCount: DOC_SLUGS.length,
      missingCount: DOC_SLUGS.length - completeCount,
      hasPrivacy,
      hasPersonalData,
      contactFormReady: hasPrivacy && hasPersonalData,
      allComplete: completeCount === DOC_SLUGS.length
    }
  }

  const forceShowForm = $derived(legalSettingsForm['contact.forceShowFormWithoutLegalDocuments'] === 'true')
  const activeLocaleStatus = $derived(getLocaleStatus(activeLocale))

  // Build tabs for AdminTabs component
  const legalTabs = $derived(locales.map(loc => ({
    id: loc,
    label: localeNames[loc] || loc.toUpperCase()
  })))

  const legalTabIndicator = (id: string) => {
    const status = getLocaleStatus(id)
    return status.missingCount > 0
  }

  function documentsStatusLabel(status: LegalLocaleStatus): string {
    return `${status.completeCount} of ${status.totalCount} documents complete`
  }

  function contactGateStatusLabel(status: LegalLocaleStatus): string {
    if (forceShowForm) return t('admin.legalContactFormBypassEnabled')
    if (status.contactFormReady) return t('admin.legalContactFormReady')
    return t('admin.legalContactFormBlocked')
  }

  function documentStatusLabel(slug: string, loc: string): string {
    if (documentComplete(slug, loc)) return t('admin.legalDocumentReady')
    return t('admin.legalDocumentMissingBody')
  }

  async function saveLegalPage(): Promise<void> {
    if (!hasChanges || saving) return
    saving = true
    try {
      // 1. Save legal settings (bulk)
      const settingsPayload: Record<string, string> = {}
      for (const key of LEGAL_SETTING_KEYS) settingsPayload[key] = legalSettingsForm[key] ?? ''
      const sRes = await fetch(API_ROUTES.admin.settings, {
        method: 'PUT',
        headers: { 'content-type': 'application/json', 'x-csrf-token': getCsrfToken() },
        body: JSON.stringify(settingsPayload)
      })
      const sBody = await sRes.json().catch(() => null)
      if (!sRes.ok || sBody?.success === false) throw new Error()

      // 2. Save every document body for every locale
      for (const slug of DOC_SLUGS) {
        for (const loc of locales) {
          const content = docsForm[slug]?.[loc] ?? ''
          if (content.trim().length === 0) continue // skip untouched empties
          const dRes = await fetch(API_ROUTES.admin.legal.bySlug(slug), {
            method: 'PUT',
            headers: { 'content-type': 'application/json', 'x-csrf-token': getCsrfToken() },
            body: JSON.stringify({ locale: loc, content })
          })
          const dBody = await dRes.json().catch(() => null)
          if (!dRes.ok || dBody?.success === false) throw new Error()
        }
      }

      initialSettingsSnapshot = serializeSettings()
      initialDocsSnapshot = serializeDocs()
      overlays.showToast(t('common.saved'), 'success')
    } catch {
      overlays.showToast(t('admin.legalSaveFailed'), 'error')
    } finally {
      saving = false
    }
  }


</script>

<div class="admin-legal">
  <PageHeader title={t('admin.legal')} subtitle={t('admin.legalPageSubtitle')} />

  <form class="flex flex-col gap-6" novalidate onsubmit={(e) => { e.preventDefault(); saveLegalPage() }}>
    <!-- Company details (PM2 settings-form card) -->
    <AdminFormSection title={t('admin.legalCompanyTitle')}>
      <div class="grid gap-4 grid-cols-[var(--grid-admin-form)]">
          <div class="flex flex-col gap-1">
            <label for="field-legal.companyLegalName" class="text-sm font-medium text-pm-text">{t('legal.fields.companyLegalName')}</label>
            <input id="field-legal.companyLegalName" bind:value={legalSettingsForm['legal.companyLegalName']} type="text" class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring" />
          </div>
          <div class="flex flex-col gap-1">
            <label for="field-legal.companyName" class="text-sm font-medium text-pm-text">{t('legal.fields.companyName')}</label>
            <input id="field-legal.companyName" bind:value={legalSettingsForm['legal.companyName']} type="text" class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring" />
          </div>
          <div class="flex flex-col gap-1">
            <label for="field-legal.inn" class="text-sm font-medium text-pm-text">{t('legal.fields.inn')}</label>
            <input id="field-legal.inn" bind:value={legalSettingsForm['legal.inn']} type="text" class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring" />
          </div>
          <div class="flex flex-col gap-1">
            <label for="field-legal.kpp" class="text-sm font-medium text-pm-text">{t('legal.fields.kpp')}</label>
            <input id="field-legal.kpp" bind:value={legalSettingsForm['legal.kpp']} type="text" class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring" />
          </div>
          <div class="flex flex-col gap-1">
            <label for="field-legal.ogrn" class="text-sm font-medium text-pm-text">{t('legal.fields.ogrn')}</label>
            <input id="field-legal.ogrn" bind:value={legalSettingsForm['legal.ogrn']} type="text" class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring" />
          </div>
          <div class="flex flex-col gap-1 col-span-full">
            <label for="field-legal.address" class="text-sm font-medium text-pm-text">{t('legal.fields.address')}</label>
            <input id="field-legal.address" bind:value={legalSettingsForm['legal.address']} type="text" class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring" />
          </div>
          <div class="flex flex-col gap-1">
            <label for="field-legal.email" class="text-sm font-medium text-pm-text">{t('legal.fields.email')}</label>
            <input id="field-legal.email" bind:value={legalSettingsForm['legal.email']} type="email" class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring" />
          </div>
      </div>
    </AdminFormSection>

    <!-- Contact form legal gate (PM2 checkbox + description) -->
    <AdminFormSection title={t('admin.legalContactFormTitle')}>
      <label class="flex items-center gap-2 cursor-pointer text-sm text-pm-text-muted">
          <input
            type="checkbox"
            checked={legalSettingsForm['contact.forceShowFormWithoutLegalDocuments'] === 'true'}
            class="size-4 accent-pm-brand flex-shrink-0"
            onchange={(e) => legalSettingsForm['contact.forceShowFormWithoutLegalDocuments'] = (e.currentTarget as HTMLInputElement).checked ? 'true' : 'false'}
          />
          <span>{t('settings.contact.forceShowFormWithoutLegalDocuments')}</span>
        </label>
      <p class="text-sm text-pm-text-muted mt-4 mb-0">{t('admin.legalContactFormWithoutDocumentsDesc')}</p>
    </AdminFormSection>

    <!-- Legal documents (PM2 admin-legal-page.css) -->
    <AdminFormSection title={t('admin.legalDocumentsTitle')}>
      <p class="text-sm text-pm-text-muted mt-0 mb-4">{t('admin.legalDocumentsSubtitle')}</p>

        <!-- Status grid: one card per locale -->
        <div class="grid gap-3 grid-cols-[var(--grid-admin-status)] my-5">
          {#each locales as loc (loc)}
            {@const status = getLocaleStatus(loc)}
            <div class="grid gap-3 p-4 border border-pm-border rounded-md bg-pm-bg-sunken">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="text-sm font-semibold text-pm-text">{localeNames[loc] || loc.toUpperCase()}</span>
                <span class={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', status.allComplete ? 'bg-pm-success-bg text-pm-success' : 'bg-pm-warning-bg text-pm-warning')}>
                  {documentsStatusLabel(status)}
                </span>
              </div>
              <span class={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium self-start', forceShowForm ? 'bg-pm-danger-bg text-pm-danger' : status.contactFormReady ? 'bg-pm-success-bg text-pm-success' : 'bg-pm-warning-bg text-pm-warning')}>
                {contactGateStatusLabel(status)}
              </span>
            </div>
          {/each}
        </div>

        <!-- Locale tabs (using AdminTabs component) -->
        <AdminTabs tabs={legalTabs} active={activeLocale} indicator={legalTabIndicator} onchange={(id) => activeLocale = id} />

        <!-- Active locale status badges -->
        <div class="flex flex-wrap items-center gap-2 mb-5">
          <span class={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', activeLocaleStatus.allComplete ? 'bg-pm-success-bg text-pm-success' : 'bg-pm-warning-bg text-pm-warning')}>
            {documentsStatusLabel(activeLocaleStatus)}
          </span>
          <span class={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', forceShowForm ? 'bg-pm-danger-bg text-pm-danger' : activeLocaleStatus.contactFormReady ? 'bg-pm-success-bg text-pm-success' : 'bg-pm-warning-bg text-pm-warning')}>
            {contactGateStatusLabel(activeLocaleStatus)}
          </span>
        </div>

        <!-- Placeholder tokens -->
        <div class="flex flex-wrap items-center gap-2 mb-6">
          <span class="text-sm text-pm-text-muted me-2">{t('admin.legalAvailableTokens')}</span>
          {#each PLACEHOLDER_TOKENS as token (token)}
            <code class="inline-flex items-center min-h-8 px-2 border border-pm-border rounded-full bg-pm-bg-elevated text-xs text-pm-text">{token}</code>
          {/each}
        </div>

        <!-- Documents editor -->
        <div class="flex flex-col gap-4">
          {#each DOC_SLUGS as slug (slug)}
            <div class="grid gap-4 pt-5 border-t border-pm-border first:pt-0 first:border-t-0">
              <h3 class="m-0 flex flex-wrap items-center gap-2 text-lg font-semibold text-pm-text leading-tight">
                <span>{docLabel(slug)}</span>
                <span class={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', documentComplete(slug, activeLocale) ? 'bg-pm-success-bg text-pm-success' : 'bg-pm-warning-bg text-pm-warning')}>
                  {documentStatusLabel(slug, activeLocale)}
                </span>
              </h3>

              <MarkdownEditor
                content={docsForm[slug]?.[activeLocale] ?? ''}
                onchange={(v) => {
                  docsForm[slug] = docsForm[slug] ?? {}
                  docsForm[slug][activeLocale] = v
                }}
                previewHtml={renderLegalMarkdown(docsForm[slug]?.[activeLocale] ?? '')}
                label={t('admin.legalDocumentBody')}
                editLabel={t('admin.legalEditMode')}
                previewLabel={t('admin.legalPreviewMode')}
              />
            </div>
          {/each}
      </div>
    </AdminFormSection>

    <div class="flex justify-end gap-4">
      <CtaButton type="submit" variant="primary" size="md" disabled={saving || !hasChanges}>
        {saving ? t('common.saving') : t('common.save')}
      </CtaButton>
    </div>
  </form>
</div>
